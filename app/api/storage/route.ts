import { NextResponse } from 'next/server';
import si from 'systeminformation';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { StorageConfig } from '@/app/types/storage';

const execAsync = util.promisify(exec);

const CONFIG_PATH = path.join(process.cwd(), 'config/storage.json');
const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'config/default.json'); // Keep reading default synchronously? No, try async.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DriveInfo {
    id: string;
    name: string;
    label: string;
    mount: string;
    total: number;
    used: number;
    available: number;
    percentage: number;
    icon: string;
    found: boolean;
}

interface MountInfo {
    device: string;
    mount: string;
    fstype: string;
    total: number;
    used: number;
    available: number;
    percentage: number;
}

async function getStorageConfig(): Promise<StorageConfig> {
    try {
        if (existsSync(CONFIG_PATH)) {
            const data = await fs.readFile(CONFIG_PATH, 'utf-8');
            return JSON.parse(data);
        }

        if (existsSync(DEFAULT_CONFIG_PATH)) {
            const data = await fs.readFile(DEFAULT_CONFIG_PATH, 'utf-8');
            const defaults = JSON.parse(data);
            if (defaults.storage) {
                return defaults.storage as StorageConfig;
            }
        }
    } catch (error) {
        console.error('Error reading storage config:', error);
    }

    return { drives: [] };
}

async function saveStorageConfig(config: StorageConfig) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

async function getHostFilesystemInfo(): Promise<MountInfo[]> {
    const mounts: MountInfo[] = [];
    const hostProcPath = '/host/proc/mounts';
    const defaultProcPath = '/proc/mounts';
    const procPath = existsSync(hostProcPath) ? hostProcPath : defaultProcPath;
    const isDocker = existsSync(hostProcPath);

    try {
        const mountsContent = await fs.readFile(procPath, 'utf-8');
        const lines = mountsContent.split('\n').filter(l => l.trim());

        // Identifying actionable filesystems
        const realFs = lines.filter(line => {
            const parts = line.split(' ');
            if (parts.length < 3) return false;
            const device = parts[0];
            const fstype = parts[2];

            return (
                device.startsWith('/dev/') ||
                ['nfs', 'nfs4', 'cifs', 'fuse', 'fuse.rclone'].includes(fstype)
            );
        });

        // Use Promise.all to run df checks in parallel (Performance improvement)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await Promise.all(realFs.map(async (line: any) => { // Changed 'line' to 'line: any' to suppress any
            const parts = line.split(' ');
            const device = parts[0];
            const mount = parts[1];
            const fstype = parts[2];

            const hostRootPrefix = '/host/root';
            const actualMount = isDocker && mount.startsWith(hostRootPrefix)
                ? mount.substring(hostRootPrefix.length) || '/'
                : mount;

            try {
                const possiblePaths = isDocker
                    ? [`${hostRootPrefix}${actualMount === '/' ? '' : actualMount}`, actualMount]
                    : [actualMount];

                for (const dfPath of possiblePaths) {
                    try {
                        await fs.access(dfPath);
                    } catch {
                        continue; // Skip if path not accessible
                    }

                    const { stdout } = await execAsync(`df -B1 "${dfPath.replace(/"/g, '\\"')}" 2>/dev/null | tail -1`);
                    const dfParts = stdout.trim().split(/\s+/);

                    if (dfParts.length >= 5) {
                        const total = parseInt(dfParts[1], 10) || 0;
                        const used = parseInt(dfParts[2], 10) || 0;
                        const available = parseInt(dfParts[3], 10) || 0;
                        const percentage = parseInt(dfParts[4].replace('%', ''), 10) || 0;
                        const returnedMount = dfParts[dfParts.length - 1];

                        // To prevent returning parent filesystem stats (e.g. root) for unmounted paths in Docker,
                        // ensure that the returned mount point explicitly matches our expected path.
                        if (total > 0 && (!isDocker || returnedMount === dfPath)) {
                            mounts.push({
                                device,
                                mount: actualMount,
                                fstype,
                                total,
                                used,
                                available,
                                percentage,
                            });
                            break; // Successfully got correct mount stats
                        }
                    }
                }
            } catch {
                // Ignore individual mount failures
            }
        }));

    } catch (error) {
        console.error('Error reading mounts:', error);
    }

    // Deduplicate logic if needed (simple unique by mount)
    const uniqueMounts = Array.from(new Map(mounts.map(m => [m.mount, m])).values());
    return uniqueMounts;
}

export async function GET() {
    try {
        let fsData = await getHostFilesystemInfo();

        if (fsData.length === 0) {
            const siData = await si.fsSize();
            fsData = siData.map(d => ({
                device: d.fs,
                mount: d.mount,
                fstype: d.type,
                total: d.size,
                used: d.used,
                available: d.available,
                percentage: Math.round(d.use),
            }));
        }

        const config = await getStorageConfig();
        const drives: DriveInfo[] = [];

        for (const configDrive of config.drives) {
            const foundMount = fsData.find(d => d.mount === configDrive.mount);

            if (foundMount) {
                drives.push({
                    id: configDrive.id,
                    name: configDrive.name,
                    label: configDrive.label,
                    mount: foundMount.mount,
                    total: foundMount.total,
                    used: foundMount.used,
                    available: foundMount.available,
                    percentage: foundMount.percentage,
                    icon: configDrive.icon || 'HardDrive',
                    found: true,
                });
            } else if (configDrive.fallback) {
                drives.push({
                    id: configDrive.id,
                    name: configDrive.name,
                    label: configDrive.label,
                    mount: configDrive.mount,
                    total: configDrive.fallback.total,
                    used: configDrive.fallback.used,
                    available: configDrive.fallback.total - configDrive.fallback.used,
                    percentage: configDrive.fallback.percentage,
                    icon: configDrive.icon || 'HardDrive',
                    found: false,
                });
            } else {
                drives.push({
                    id: configDrive.id,
                    name: configDrive.name,
                    label: configDrive.label,
                    mount: configDrive.mount,
                    total: 0,
                    used: 0,
                    available: 0,
                    percentage: 0,
                    icon: configDrive.icon || 'HardDrive',
                    found: false,
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                drives,
                totalDrives: drives.length,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error: unknown) {
        console.error('Storage info error:', error);
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

export async function POST(request: Request) {
    try {
        const config: StorageConfig = await request.json();

        // Basic Validation
        if (!config || !Array.isArray(config.drives)) {
            return NextResponse.json({ error: 'Invalid config format' }, { status: 400 });
        }

        await saveStorageConfig(config);
        return NextResponse.json({ success: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error saving storage config:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
