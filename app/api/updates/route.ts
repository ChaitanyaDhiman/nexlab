import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UPDATE_STATUS_FILE = '/data/update-status.json';
const UPDATE_AGENT_URL = process.env.UPDATE_AGENT_URL || (fs.existsSync('/.dockerenv') ? 'http://update-agent:5000' : 'http://localhost:5000');

export interface PackageDetail {
    name: string;
    suite?: string;
    newVersion: string;
    currentVersion?: string;
    arch?: string;
    isSecurity: boolean;
}

export interface UpdateJobState {
    id: string | null;
    status: 'idle' | 'running' | 'success' | 'error';
    step: string;
    startedAt: string | null;
    finishedAt: string | null;
    exitCode: number | null;
    error: string | null;
}

export interface UpdateStatusData {
    rebootRequired: boolean;
    rebootReasons: string[];
    lastUpdateCheck: string | null;
    updatesAvailable: number;
    securityUpdates: number;
    lastUpdateLog: string[];
    updatePackages: string[];
    securityPackagesList: string[];
    packageDetails: PackageDetail[];
    job?: UpdateJobState;
    hasNsenter?: boolean;
}

async function safeExec(command: string, fallback: string = ''): Promise<string> {
    try {
        const { stdout } = await execAsync(command);
        return stdout.trim();
    } catch {
        return fallback;
    }
}

/**
 * Fetch status directly from the update-agent service if reachable
 */
async function fetchFromAgent(): Promise<UpdateStatusData | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${UPDATE_AGENT_URL}/status`, {
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        const json = await res.json();
        if (json.success && json.data) {
            const data = json.data;
            const upgrades = data.upgrades || {};
            const reboot = data.reboot || {};

            return {
                rebootRequired: reboot.required || false,
                rebootReasons: reboot.packages || [],
                lastUpdateCheck: data.lastUpdateCheck || null,
                updatesAvailable: upgrades.total || 0,
                securityUpdates: upgrades.security || 0,
                lastUpdateLog: data.job?.error ? [data.job.error] : ['Update agent connected'],
                updatePackages: upgrades.allPackages || [],
                securityPackagesList: upgrades.securityPackages || [],
                packageDetails: upgrades.details || [],
                job: data.job,
                hasNsenter: data.hasNsenter ?? true,
            };
        }
    } catch {
        // Fallback to file or direct host check
    }
    return null;
}

/**
 * Fallback: Read update status from the shared JSON file
 */
function readAgentFileStatus(): UpdateStatusData | null {
    try {
        if (fs.existsSync(UPDATE_STATUS_FILE)) {
            const content = fs.readFileSync(UPDATE_STATUS_FILE, 'utf-8');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsed = JSON.parse(content) as any;
            const upgrades = parsed.upgrades || {};
            const reboot = parsed.reboot || {};

            return {
                rebootRequired: reboot.required || false,
                rebootReasons: reboot.packages || [],
                lastUpdateCheck: parsed.lastUpdateCheck || null,
                updatesAvailable: upgrades.total || 0,
                securityUpdates: upgrades.security || 0,
                lastUpdateLog: ['Read from shared volume cache'],
                updatePackages: upgrades.allPackages || [],
                securityPackagesList: upgrades.securityPackages || [],
                packageDetails: upgrades.details || [],
                job: parsed.job,
                hasNsenter: parsed.hasNsenter,
            };
        }
    } catch {
        // ignore
    }
    return null;
}

/**
 * Fallback: Parse host apt list --upgradable directly when running locally
 */
async function getDirectHostStatus(): Promise<UpdateStatusData> {
    try {
        const raw = await safeExec('apt list --upgradable 2>/dev/null');
        const lines = raw.split('\n').filter(Boolean);

        const packages: string[] = [];
        const securityPkgs: string[] = [];
        const details: PackageDetail[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('Listing') || trimmed.startsWith('WARNING:')) continue;

            const m = trimmed.match(/^([^/\s]+)\/(\S+)\s+(\S+)\s+(\S+)\s+\[upgradable from:\s+([^\]]+)\]/);
            if (m) {
                const [, name, suite, newVersion, arch, currentVersion] = m;
                const isSec = suite.toLowerCase().includes('security') || trimmed.toLowerCase().includes('security');
                packages.push(name);
                if (isSec) securityPkgs.push(name);
                details.push({ name, suite, newVersion, currentVersion, arch, isSecurity: isSec });
            } else {
                const parts = trimmed.split(/\s+/);
                if (parts.length > 0) {
                    const namePart = parts[0].split('/')[0];
                    const isSec = trimmed.toLowerCase().includes('security');
                    packages.push(namePart);
                    if (isSec) securityPkgs.push(namePart);
                    details.push({
                        name: namePart,
                        newVersion: parts[1] || '',
                        arch: parts[2] || '',
                        isSecurity: isSec
                    });
                }
            }
        }

        const rebootRequired = fs.existsSync('/var/run/reboot-required') || fs.existsSync('/host/var/run/reboot-required');
        let rebootPkgs: string[] = [];
        const pkgsFile = fs.existsSync('/var/run/reboot-required.pkgs')
            ? '/var/run/reboot-required.pkgs'
            : (fs.existsSync('/host/var/run/reboot-required.pkgs') ? '/host/var/run/reboot-required.pkgs' : null);

        if (pkgsFile) {
            try {
                rebootPkgs = fs.readFileSync(pkgsFile, 'utf-8').split('\n').filter(Boolean);
            } catch {
                // ignore
            }
        }

        const lastCheck = await safeExec(
            'stat -c %y /var/lib/apt/periodic/update-success-stamp 2>/dev/null || ' +
            'stat -c %y /var/cache/apt/pkgcache.bin 2>/dev/null || ' +
            'stat -c %y /var/lib/apt/lists 2>/dev/null'
        );

        return {
            rebootRequired,
            rebootReasons: rebootPkgs,
            lastUpdateCheck: lastCheck || null,
            updatesAvailable: packages.length,
            securityUpdates: securityPkgs.length,
            lastUpdateLog: ['Direct host inspection'],
            updatePackages: packages,
            securityPackagesList: securityPkgs,
            packageDetails: details,
        };
    } catch {
        return {
            rebootRequired: false,
            rebootReasons: [],
            lastUpdateCheck: null,
            updatesAvailable: 0,
            securityUpdates: 0,
            lastUpdateLog: ['Unable to read updates'],
            updatePackages: [],
            securityPackagesList: [],
            packageDetails: [],
        };
    }
}

export async function GET() {
    try {
        // 1. Try agent HTTP endpoint first
        let status = await fetchFromAgent();

        // 2. Fall back to shared file
        if (!status) {
            status = readAgentFileStatus();
        }

        // 3. Fall back to direct command execution if not in Docker or agent not up
        if (!status) {
            status = await getDirectHostStatus();
        }

        return NextResponse.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString(),
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}