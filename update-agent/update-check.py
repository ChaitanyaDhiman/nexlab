#!/usr/bin/env python3
"""
Update Agent & Runner for NexLab
- Checks for system updates and provides parsed package details.
- Executes host system updates via nsenter in Docker (or direct execution on host).
- Provides FastAPI REST and SSE (Server-Sent Events) streaming endpoints.
- Streams live command output for refresh, check, and update operations.
- Writes atomic status JSON to /data/update-status.json for dashboard widgets.
- Backward-compatible with trigger file /data/trigger-refresh.
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import subprocess
import threading
import time
from typing import Any, Dict, List, Optional, Set

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import uvicorn

# Configuration
OUTPUT_FILE = os.environ.get('UPDATE_STATUS_FILE', '/data/update-status.json')
TRIGGER_FILE = os.environ.get('TRIGGER_FILE', '/data/trigger-refresh')
CHECK_INTERVAL = int(os.environ.get('CHECK_INTERVAL_SECONDS', 3600))  # Default 1 hour
PORT = int(os.environ.get('PORT', 5000))

# Global State
update_lock = threading.Lock()
job_state: Dict[str, Any] = {
    'id': None,
    'status': 'idle',  # 'idle' | 'running' | 'success' | 'error'
    'step': 'idle',
    'startedAt': None,
    'finishedAt': None,
    'exitCode': None,
    'error': None
}
recent_logs: List[str] = []
subscribers: Set[asyncio.Queue] = set()
main_loop: Optional[asyncio.AbstractEventLoop] = None


def detect_nsenter() -> bool:
    """Check if we can use nsenter to run commands in the host namespace."""
    try:
        res = subprocess.run(
            ['nsenter', '-t', '1', '-m', '-u', '-i', '-n', '-p', '--', 'hostname'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return res.returncode == 0
    except Exception:
        return False

HAS_NSENTER = detect_nsenter()
print(f"[{datetime.now().isoformat()}] NSENTER host execution available: {HAS_NSENTER}")


def build_cmd(cmd_str: str) -> str:
    """Wrap a command with nsenter if available, or return as-is."""
    if HAS_NSENTER:
        escaped = cmd_str.replace('"', '\\"')
        return f'nsenter -t 1 -m -u -i -n -p -- bash -c "{escaped}"'
    return cmd_str


def broadcast_event(event_type: str, data: Any):
    """Thread-safe event broadcast to all SSE subscriber queues."""
    global main_loop, subscribers
    if not main_loop or not subscribers:
        return

    payload = json.dumps({'type': event_type, 'data': data})
    for q in list(subscribers):
        try:
            main_loop.call_soon_threadsafe(q.put_nowait, payload)
        except Exception:
            pass


def log_line(line: str):
    """Store a log line in the ring buffer and broadcast to live subscribers."""
    global recent_logs
    recent_logs.append(line)
    if len(recent_logs) > 2000:
        recent_logs.pop(0)
    broadcast_event('log', line)


def run_streaming_cmd(cmd_str: str, step_name: Optional[str] = None) -> tuple[int, str]:
    """Execute a command and stream stdout/stderr line-by-line to SSE subscribers."""
    full_cmd = build_cmd(cmd_str)
    timestamp = datetime.now().strftime('%H:%M:%S')
    log_line(f"[{timestamp}] $ {cmd_str}\n")
    if step_name:
        broadcast_event('step', {'step': step_name, 'message': f'Running {cmd_str}'})

    output_lines = []
    try:
        process = subprocess.Popen(
            full_cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        if process.stdout:
            for line in iter(process.stdout.readline, ''):
                output_lines.append(line)
                log_line(line)

        process.wait()
        return process.returncode, "".join(output_lines)
    except Exception as e:
        err = f"Execution error: {e}\n"
        log_line(err)
        return 1, err


def run_cmd(cmd_str: str, timeout: int = 180) -> tuple[int, str, str]:
    """Execute a command without streaming (for internal fast checks)."""
    full_cmd = build_cmd(cmd_str)
    try:
        res = subprocess.run(
            full_cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except subprocess.TimeoutExpired:
        return 1, '', f'Command timed out after {timeout}s'
    except Exception as e:
        return 1, '', str(e)


def check_reboot_required() -> Dict[str, Any]:
    """Check if host system reboot is required."""
    cmd = 'if [ -f /var/run/reboot-required ]; then cat /var/run/reboot-required.pkgs 2>/dev/null || echo "reboot-required"; else echo "NONE"; fi'
    code, stdout, _ = run_cmd(cmd, timeout=10)
    if code == 0 and stdout != "NONE":
        pkgs = [p.strip() for p in stdout.split('\n') if p.strip() and p != "reboot-required"]
        return {'required': True, 'packages': pkgs}
    return {'required': False, 'packages': []}


def get_last_update_time() -> Optional[str]:
    """Get the timestamp of the last apt update on the host."""
    cmd = (
        'stat -c %y /var/lib/apt/periodic/update-success-stamp 2>/dev/null || '
        'stat -c %y /var/cache/apt/pkgcache.bin 2>/dev/null || '
        'stat -c %y /var/lib/apt/lists 2>/dev/null'
    )
    code, stdout, _ = run_cmd(cmd, timeout=10)
    if code == 0 and stdout:
        return stdout.split('\n')[0].strip()
    return None


def get_upgradable_packages(stream_output: bool = False) -> Dict[str, Any]:
    """Parse upgradable packages using apt list --upgradable."""
    if stream_output:
        code, stdout = run_streaming_cmd('apt list --upgradable 2>/dev/null', step_name='checking')
    else:
        code, stdout, _ = run_cmd('apt list --upgradable 2>/dev/null', timeout=60)

    if code != 0 or not stdout:
        return {
            'total': 0,
            'security': 0,
            'packages': [],
            'securityPackages': [],
            'details': []
        }

    packages = []
    security_pkgs = []
    details = []

    for line in stdout.split('\n'):
        line = line.strip()
        if not line or line.startswith('Listing') or line.startswith('WARNING:'):
            continue

        m = re.match(r'^([^/\s]+)/(\S+)\s+(\S+)\s+(\S+)\s+\[upgradable from:\s+([^\]]+)\]', line)
        if m:
            name, suite, new_ver, arch, curr_ver = m.groups()
            is_sec = 'security' in suite.lower() or 'security' in line.lower()
            packages.append(name)
            if is_sec:
                security_pkgs.append(name)
            details.append({
                'name': name,
                'suite': suite,
                'newVersion': new_ver,
                'currentVersion': curr_ver,
                'arch': arch,
                'isSecurity': is_sec
            })
        else:
            parts = line.split()
            if parts:
                name_part = parts[0].split('/')[0]
                is_sec = 'security' in line.lower()
                packages.append(name_part)
                if is_sec:
                    security_pkgs.append(name_part)
                details.append({
                    'name': name_part,
                    'suite': 'unknown',
                    'newVersion': parts[1] if len(parts) > 1 else '',
                    'currentVersion': '',
                    'arch': parts[2] if len(parts) > 2 else '',
                    'isSecurity': is_sec
                })

    return {
        'total': len(packages),
        'security': len(security_pkgs),
        'packages': packages,
        'securityPackages': security_pkgs,
        'details': details
    }


def write_status_file(status: Dict[str, Any]) -> None:
    """Atomically write the status JSON file for widget and dashboard access."""
    try:
        out_path = Path(OUTPUT_FILE)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        temp_file = out_path.with_suffix('.tmp')
        with open(temp_file, 'w') as f:
            json.dump(status, f, indent=2)
        temp_file.rename(out_path)
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] Failed to write status file: {e}")


def collect_current_status(refresh_lists: bool = False, stream_output: bool = False) -> Dict[str, Any]:
    """Collect full status, optionally refreshing package lists first with live logging."""
    if refresh_lists:
        if stream_output:
            log_line(f"\n[{datetime.now().strftime('%H:%M:%S')}] ─── Refreshing Repository Package Cache (apt update) ───\n")
            run_streaming_cmd('apt-get update', step_name='refreshing')
        else:
            print(f"[{datetime.now().isoformat()}] Updating package lists (apt-get update)...")
            run_cmd('apt-get update', timeout=180)

    upgrades = get_upgradable_packages(stream_output=stream_output)
    reboot = check_reboot_required()
    last_check = get_last_update_time()

    if stream_output:
        log_line(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Completed check: {upgrades['total']} updates available ({upgrades['security']} security).\n")
        broadcast_event('done', {'success': True, 'total': upgrades['total']})

    status = {
        'upgrades': {
            'total': upgrades['total'],
            'security': upgrades['security'],
            'allPackages': upgrades['packages'],
            'securityPackages': upgrades['securityPackages'],
            'details': upgrades['details']
        },
        'reboot': reboot,
        'lastUpdateCheck': last_check,
        'agentTimestamp': datetime.now(timezone.utc).isoformat(),
        'hasNsenter': HAS_NSENTER,
        'job': job_state
    }

    write_status_file(status)
    return status


def execute_update_job(job_id: str):
    """Run the complete system update sequence with real-time log capture."""
    global job_state

    with update_lock:
        job_state['id'] = job_id
        job_state['status'] = 'running'
        job_state['step'] = 'starting'
        job_state['startedAt'] = datetime.now(timezone.utc).isoformat()
        job_state['finishedAt'] = None
        job_state['exitCode'] = None
        job_state['error'] = None

        log_line(f"\n[{datetime.now().strftime('%H:%M:%S')}] ═════════════════════════════════════════════════════════════\n")
        log_line(f"[{datetime.now().strftime('%H:%M:%S')}] Starting System Update: apt update && apt upgrade && autoremove\n")
        log_line(f"[{datetime.now().strftime('%H:%M:%S')}] ═════════════════════════════════════════════════════════════\n\n")

        # Step 1: apt update
        code1, _ = run_streaming_cmd('export DEBIAN_FRONTEND=noninteractive && apt-get update', step_name='refreshing')
        if code1 != 0:
            log_line(f"[{datetime.now().strftime('%H:%M:%S')}] ⚠️ Warning: apt-get update returned exit code {code1}\n")

        # Step 2: apt upgrade
        upgrade_cmd = (
            "export DEBIAN_FRONTEND=noninteractive && "
            "export NEEDRESTART_MODE=a && "
            "apt-get -y -o Dpkg::Options::='--force-confdef' -o Dpkg::Options::='--force-confold' upgrade"
        )
        code2, _ = run_streaming_cmd(upgrade_cmd, step_name='installing')

        # Step 3: autoremove
        if code2 == 0:
            run_streaming_cmd('export DEBIAN_FRONTEND=noninteractive && apt-get -y autoremove', step_name='cleaning')

        exit_code = code2
        job_state['exitCode'] = exit_code
        job_state['finishedAt'] = datetime.now(timezone.utc).isoformat()

        if exit_code == 0:
            job_state['status'] = 'success'
            job_state['step'] = 'completed'
            log_line(f"\n[{datetime.now().strftime('%H:%M:%S')}] ✅ System update completed successfully!\n")
            broadcast_event('step', {'step': 'completed', 'message': 'System updated successfully!'})
            broadcast_event('done', {'success': True, 'exitCode': 0})
        else:
            job_state['status'] = 'error'
            job_state['step'] = 'failed'
            job_state['error'] = f"Upgrade failed with exit code {exit_code}"
            log_line(f"\n[{datetime.now().strftime('%H:%M:%S')}] ❌ Upgrade failed with code {exit_code}\n")
            broadcast_event('step', {'step': 'failed', 'message': f"Update failed with code {exit_code}"})
            broadcast_event('done', {'success': False, 'exitCode': exit_code, 'error': job_state['error']})

        # Final status check
        try:
            collect_current_status(refresh_lists=False, stream_output=False)
        except Exception:
            pass


def background_periodic_worker():
    """Watches trigger file and runs periodic check."""
    print(f"[{datetime.now().isoformat()}] Background worker started. Checking every {CHECK_INTERVAL}s.")
    trigger_path = Path(TRIGGER_FILE)

    try:
        collect_current_status(refresh_lists=False, stream_output=False)
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] Error in initial check: {e}")

    last_check_time = time.time()

    while True:
        time.sleep(2)
        try:
            if trigger_path.exists():
                try:
                    trigger_path.unlink()
                    print(f"[{datetime.now().isoformat()}] Manual refresh triggered via file")
                    collect_current_status(refresh_lists=True, stream_output=False)
                    last_check_time = time.time()
                    continue
                except Exception as e:
                    print(f"[{datetime.now().isoformat()}] Error processing trigger: {e}")

            if time.time() - last_check_time >= CHECK_INTERVAL:
                print(f"[{datetime.now().isoformat()}] Running scheduled periodic update check...")
                collect_current_status(refresh_lists=True, stream_output=False)
                last_check_time = time.time()

        except Exception as e:
            print(f"[{datetime.now().isoformat()}] Error in background worker loop: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global main_loop
    main_loop = asyncio.get_running_loop()

    worker_thread = threading.Thread(target=background_periodic_worker, daemon=True)
    worker_thread.start()

    yield

app = FastAPI(title="NexLab Update Runner", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CheckRequest(BaseModel):
    refresh: bool = False
    stream: bool = True


@app.get("/health")
def health():
    return {"status": "ok", "hasNsenter": HAS_NSENTER}


@app.get("/status")
def get_status():
    """Return the current update status, package list, reboot requirement, and job state."""
    status = collect_current_status(refresh_lists=False, stream_output=False)
    return JSONResponse(content={"success": True, "data": status})


@app.post("/check")
def check_updates(req: CheckRequest = CheckRequest()):
    """Trigger an on-demand update check, streaming output if requested."""
    if job_state['status'] == 'running':
        raise HTTPException(status_code=409, detail="An update job is currently in progress.")
    status = collect_current_status(refresh_lists=req.refresh, stream_output=req.stream)
    return JSONResponse(content={"success": True, "data": status})


@app.post("/update")
def start_update(background_tasks: BackgroundTasks):
    """Initiate the system update sequence in the background."""
    if job_state['status'] == 'running':
        return JSONResponse(
            content={"success": False, "message": "An update job is already running.", "job": job_state},
            status_code=409
        )

    job_id = f"upd-{int(time.time())}"
    background_tasks.add_task(execute_update_job, job_id)
    return JSONResponse(
        content={"success": True, "message": "System update initiated.", "jobId": job_id}
    )


@app.get("/logs")
def get_logs():
    """Return recent execution logs."""
    return JSONResponse(content={
        "success": True,
        "job": job_state,
        "logs": recent_logs
    })


@app.get("/stream")
async def stream_logs():
    """Server-Sent Events (SSE) streaming real-time update execution logs."""
    q: asyncio.Queue = asyncio.Queue()
    subscribers.add(q)

    async def event_generator():
        # First send existing recent logs (last 50 lines to keep it fast)
        for log_line in recent_logs[-50:]:
            yield f"data: {json.dumps({'type': 'log', 'data': log_line})}\n\n"

        yield f"data: {json.dumps({'type': 'status', 'data': job_state})}\n\n"

        try:
            while True:
                try:
                    payload = await asyncio.wait_for(q.get(), timeout=20.0)
                    yield f"data: {payload}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            subscribers.discard(q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/reboot")
def reboot_system():
    """Trigger a system reboot on the host via nsenter / systemctl."""
    log_line(f"\n[{datetime.now().strftime('%H:%M:%S')}] ⚠️ Initiating system reboot...\n")
    code, stdout, stderr = run_cmd('systemctl reboot', timeout=10)
    if code == 0:
        return JSONResponse(content={"success": True, "message": "Reboot initiated successfully."})
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": f"Failed to initiate reboot: {stderr or stdout}"}
    )


if __name__ == '__main__':
    print(f"Starting NexLab Update Runner on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
