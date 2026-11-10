import { NextResponse } from 'next/server';
import { loadAppsConfig } from '@/app/lib/appsConfig';

export const dynamic = 'force-dynamic';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

interface App {
    id: string;
    name: string;
    description: string;
    url: string;
    icon?: string;
    iconType?: string;
    iconUrl?: string;
    healthCheckUrl?: string;
}

export async function GET() {
    try {
        // Load configuration using shared utility with fallback logic
        const appsData = loadAppsConfig();

        // Collect all apps from categories and uncategorized
        const allApps: App[] = [
            ...(appsData.uncategorizedApps || []),
            ...(appsData.categories || []).flatMap(cat => cat.apps)
        ];

        // Filter apps that have either a health check URL or a standard URL
        const appsWithHealthCheck = allApps.filter(app => app.healthCheckUrl || (app.url && !app.url.startsWith('/')));

        if (appsWithHealthCheck.length === 0) {
            return NextResponse.json({ success: true, data: {} });
        }

        const statusPromises = appsWithHealthCheck.map(async (app) => {
            // Use app.url as primary, healthCheckUrl as fallback
            const primaryUrl = app.url;
            const fallbackUrl = app.healthCheckUrl;

            if (!primaryUrl || primaryUrl.startsWith('/')) {

                return { id: app.id, status: 'offline', responseTime: 0 };
            }

            const startTime = performance.now();
            let usedFallback = false;

            const tryCheck = async (url: string, timeoutMs: number) => {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), timeoutMs);
                try {
                    await fetch(url, {
                        method: 'GET',
                        cache: 'no-store',
                        signal: controller.signal,
                    });
                    return true;
                } finally {
                    clearTimeout(id);
                }
            };

            try {
                try {
                    // Try primary URL first (external URL)
                    await tryCheck(primaryUrl, 2000);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (e: any) {
                    // If primary fails and we have a different fallback URL, try it
                    if (fallbackUrl && fallbackUrl !== primaryUrl && !fallbackUrl.startsWith('/')) {
                        usedFallback = true;
                        await tryCheck(fallbackUrl, 3000);
                    } else {
                        throw e;
                    }
                }

                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);
                const status = responseTime > 2000 ? 'degraded' : 'online';

                return { id: app.id, status, responseTime, fallback: usedFallback };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.error(`[Health] Failed ${app.id}: ${error.message}`);
                return { id: app.id, status: 'offline', responseTime: 0, fallback: usedFallback };
            }
        });

        const results = await Promise.all(statusPromises);

        const data = results.reduce((acc, curr) => {
            acc[curr.id] = {
                status: curr.status,
                responseTime: curr.responseTime,
                fallback: curr.fallback
            };
            return acc;
        }, {} as Record<string, { status: string; responseTime: number; fallback?: boolean }>);

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('[Health] Error reading apps.json:', error);
        return NextResponse.json({ success: false, data: {}, error: 'Failed to read apps configuration' });
    }
}
