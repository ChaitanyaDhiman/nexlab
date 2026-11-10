import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

interface GitHubRelease {
    tag_name: string;
    html_url: string;
}

export async function GET() {
    try {
        const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION;

        // If we can't determine current version, we can't check for updates
        if (!currentVersion) {
            return NextResponse.json({
                updateAvailable: false,
                currentVersion: 'unknown',
                latestVersion: null,
                error: 'Current version not found'
            });
        }

        // Parse the git URL to get owner and repo
        // Expected format: https://github.com/owner/repo
        const gitUrl = process.env.NEXT_PUBLIC_GIT_URL;
        const match = gitUrl?.match(/github\.com\/([^/]+)\/([^/]+)/);

        if (!match) {
            console.error('Invalid git URL format:', gitUrl);
            return NextResponse.json({
                updateAvailable: false,
                currentVersion,
                error: 'Invalid repository configuration'
            });
        }

        const [, owner, repo] = match;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Homelab-Web-Update-Checker'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            // If 404, it might mean no releases yet
            if (response.status === 404) {
                return NextResponse.json({
                    updateAvailable: false,
                    currentVersion,
                    latestVersion: currentVersion
                });
            }
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

         
        const data: GitHubRelease = await response.json();
        const latestVersionTag = data.tag_name; // e.g., "v1.0.1" or "1.0.1"

        // Normalize versions (remove 'v' prefix)
        const normalizedCurrent = currentVersion.replace(/^v/, '');
        const normalizedLatest = latestVersionTag.replace(/^v/, '');

        // Simple semantic version comparison
        // logical check: is latest > current?
        // We can use a simple string comparison if format is guaranteed, but let's be slightly robust
        const isUpdateAvailable = compareVersions(normalizedCurrent, normalizedLatest) < 0;

        return NextResponse.json({
            updateAvailable: isUpdateAvailable,
            currentVersion: currentVersion,
            latestVersion: latestVersionTag,
            url: data.html_url
        });

    } catch (error: unknown) {
        console.error('Update check failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            updateAvailable: false,
            error: errorMessage
        }, { status: 500 });
    }
}

/**
 * Compare two semantic version strings.
 * Returns:
 * -1 if v1 < v2
 *  0 if v1 == v2
 *  1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 < num2) return -1;
        if (num1 > num2) return 1;
    }

    return 0;
}
