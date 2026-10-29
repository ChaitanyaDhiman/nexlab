import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

const TRIGGER_FILE = '/data/trigger-refresh';
const UPDATE_AGENT_URL = process.env.UPDATE_AGENT_URL || (fs.existsSync('/.dockerenv') ? 'http://update-agent:5000' : 'http://localhost:5000');

/**
 * POST /api/updates/refresh
 * Triggers package list refresh.
 * Calls update-agent if reachable, or writes trigger file, or runs directly on host.
 */
export async function POST(req: Request) {
    let refresh = true;
    let stream = true;
    try {
        const body = await req.json();
        if (typeof body.refresh === 'boolean') {
            refresh = body.refresh;
        }
        if (typeof body.stream === 'boolean') {
            stream = body.stream;
        }
    } catch {
        // Body is optional
    }

    // 1. Try agent HTTP endpoint first
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout for apt update

        const res = await fetch(`${UPDATE_AGENT_URL}/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh, stream }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            return NextResponse.json({
                success: true,
                message: refresh ? 'Repositories refreshed and updates checked' : 'Update status checked',
                data: data.data,
                timestamp: new Date().toISOString(),
            });
        }
    } catch {
        // Agent not reachable via HTTP, proceed to file/direct fallback
    }

    // 2. Docker Mode fallback: write trigger file
    const isDocker = fs.existsSync('/.dockerenv');
    if (isDocker) {
        try {
            const triggerDir = path.dirname(TRIGGER_FILE);
            if (!fs.existsSync(triggerDir)) {
                fs.mkdirSync(triggerDir, { recursive: true });
            }
            fs.writeFileSync(TRIGGER_FILE, new Date().toISOString());

            return NextResponse.json({
                success: true,
                message: 'Refresh triggered via sidecar agent trigger file',
                timestamp: new Date().toISOString(),
            });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json(
                { success: false, error: msg, message: 'Failed to write trigger file' },
                { status: 500 }
            );
        }
    }

    // 3. Local/Host Mode fallback
    try {
        if (refresh) {
            try {
                await execAsync('sudo -n apt-get update');
            } catch {
                await execAsync('apt-get update');
            }
        }
        return NextResponse.json({
            success: true,
            message: 'Package list updated successfully on host',
            timestamp: new Date().toISOString(),
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: errorMessage, message: 'Failed to update package list' },
            { status: 500 }
        );
    }
}
