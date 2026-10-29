import fs from 'fs';

export const dynamic = 'force-dynamic';

const UPDATE_AGENT_URL = process.env.UPDATE_AGENT_URL || (fs.existsSync('/.dockerenv') ? 'http://update-agent:5000' : 'http://localhost:5000');

/**
 * GET /api/updates/stream
 * Proxies Server-Sent Events (SSE) from the update-agent runner to the browser client.
 */
export async function GET() {
    try {
        const agentResponse = await fetch(`${UPDATE_AGENT_URL}/stream`, {
            headers: {
                Accept: 'text/event-stream',
            },
            cache: 'no-store',
        });

        if (!agentResponse.ok || !agentResponse.body) {
            return new Response('Event stream not available from update-agent', {
                status: 502,
                headers: { 'Content-Type': 'text/plain' },
            });
        }

        return new Response(agentResponse.body, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch {
        return new Response('Unable to connect to update-agent stream', {
            status: 502,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
