import { NextResponse } from 'next/server';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const UPDATE_AGENT_URL = process.env.UPDATE_AGENT_URL || (fs.existsSync('/.dockerenv') ? 'http://update-agent:5000' : 'http://localhost:5000');

/**
 * POST /api/updates/apply
 * Triggers the system update job (apt update && apt upgrade -y && apt autoremove -y)
 */
export async function POST() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${UPDATE_AGENT_URL}/update`, {
            method: 'POST',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                message: 'Failed to contact update-agent runner. Ensure the update-agent container is running with host privileges.',
            },
            { status: 502 }
        );
    }
}
