import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';

interface ContainerInfo {
    id: string;
    name: string;
    image: string;
    status: string;
    state: string;
    updated: string;
    health: string;

    // Stats
    cpu: string;
    memory: string;
    memoryLimit: string;
    netIO: string;
    netRx?: number;
}

export async function GET() {
    try {
        const containers: Map<string, Partial<ContainerInfo>> = new Map();
        // Index by short ID as well for faster matching
        const shortIdIndex: Map<string, string> = new Map();

        // 1. Fetch container list
        const { stdout: psOutput } = await execFileAsync('docker', [
            'ps',
            '--all',
            '--format',
            '{{json .}}'
        ]);

        if (psOutput) {
            const lines = psOutput.trim().split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const c = JSON.parse(line);
                    const containerData = {
                        id: c.ID,
                        name: c.Names,
                        image: c.Image,
                        status: c.Status,
                        state: c.State,
                        updated: c.CreatedAt,
                        health: c.Status.includes('(healthy)') ? 'healthy' :
                            c.Status.includes('(unhealthy)') ? 'unhealthy' :
                                c.Status.includes('(health: starting)') ? 'starting' : 'none'
                    };
                    containers.set(c.ID, containerData);
                    shortIdIndex.set(c.ID.substring(0, 12), c.ID);
                } catch (e) {
                    console.error('Error parsing docker ps line:', e);
                }
            }
        }

        // 1.5 Fetch StartedAt (Updated) time via inspect
        try {
            const ids = Array.from(containers.keys());
            if (ids.length > 0) {
                const { stdout: inspectOutput } = await execFileAsync('docker', [
                    'inspect',
                    '--format',
                    '{{.Id}}#{{.State.StartedAt}}',
                    ...ids
                ]);

                if (inspectOutput) {
                    const lines = inspectOutput.trim().split('\n');
                    for (const line of lines) {
                        const parts = line.split('#');
                        if (parts.length >= 2) {
                            const id = parts[0];
                            const startedAt = parts[1];
                            if (containers.has(id)) {
                                try {
                                    const date = new Date(startedAt);
                                    // Format: "YYYY-MM-DD HH:mm:ss"
                                    const formatted = date.toISOString().replace('T', ' ').substring(0, 19);
                                    const container = containers.get(id);
                                    if (container) {
                                        container.updated = formatted;
                                    }
                                } catch {
                                    // ignore date parse error
                                }
                            }
                        }
                    }
                }
            }
        } catch (inspectError) {
            console.error('Error in docker inspect:', inspectError);
        }

        // 2. Fetch stats (for metrics) - only running containers
        try {
            const { stdout: statsOutput } = await execFileAsync('docker', [
                'stats',
                '--no-stream',
                '--format',
                '{{json .}}'
            ]);

            if (statsOutput) {
                const lines = statsOutput.trim().split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const s = JSON.parse(line);
                        // s = {"BlockIO":"...","CPUPerc":"...","Container":"...","ID":"...","MemPerc":"...","MemUsage":"...","Name":"...","NetIO":"...","PIDs":"..."}

                        let targetId = containers.has(s.ID) ? s.ID : shortIdIndex.get(s.ID);

                        if (!targetId && s.Container) {
                            targetId = containers.has(s.Container) ? s.Container : shortIdIndex.get(s.Container);
                        }

                        if (targetId) {
                            const container = containers.get(targetId);
                            if (container) {
                                container.cpu = s.CPUPerc;
                                container.memory = s.MemUsage.split('/')[0].trim();
                                container.memoryLimit = s.MemUsage.split('/')[1]?.trim();
                                // Parse NetIO "rx / tx" string into raw bytes
                                const [rxStr] = s.NetIO.split(' / ');
                                 
                                const parseBytes = (str: string) => {
                                    if (!str) return 0;
                                    const units = { 'B': 1, 'kB': 1024, 'MB': 1024 ** 2, 'GB': 1024 ** 3, 'TB': 1024 ** 4 };
                                    const match = str.match(/([\d.]+)([a-zA-Z]+)/);
                                    if (match) {
                                        const val = parseFloat(match[1]);
                                        const unit = match[2] as keyof typeof units;
                                        return val * (units[unit] || 1);
                                    }
                                    return 0;
                                };

                                container.netRx = parseBytes(rxStr);
                                container.netIO = s.NetIO.replace(/(\d)([A-Za-z])/g, '$1 $2').replace('kB', 'KB').replace('GB', 'GB').replace('MB', 'MB').replace('B', 'B');
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing docker stats line:', e);
                    }
                }
            }
        } catch (statsError) {
            console.error('Error fetching docker stats:', statsError);
        }

        const result = Array.from(containers.values());
        return NextResponse.json(result);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error('Error fetching docker info:', e);
        return NextResponse.json(
            { error: 'Failed to fetch docker info' },
            { status: 500 }
        );
    }
}
