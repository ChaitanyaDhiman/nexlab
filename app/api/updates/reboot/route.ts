import { NextResponse } from 'next/server';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const UPDATE_AGENT_URL = process.env.UPDATE_AGENT_URL || (fs.existsSync('/.dockerenv') ? 'http://update-agent:5000' : 'http://localhost:5000');

/**
 * POST /api/updates/reboot
 * Triggers host system reboot via update-agent
 */
export async function POST() {
    try {
        const res = await fetch(`${UPDATE_AGENT_URL}/reboot`, {
            method: 'POST',
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: msg, message: 'Failed to trigger reboot' },
            { status: 502 }
        );
    }
}
