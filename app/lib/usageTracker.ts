const STORAGE_KEY = 'app_usage_stats';

export interface AppUsageEntry {
    count: number;
    lastOpened: number;
}

interface StoredStats {
    [appId: string]: number | AppUsageEntry;
}

function calculateFrecencyScore(count: number, lastOpened: number): number {
    const now = Date.now();
    const diffHours = (now - lastOpened) / (1000 * 60 * 60);

    let recencyWeight = 10;
    if (diffHours < 4) {
        recencyWeight = 100; // Past 4 hours
    } else if (diffHours < 24) {
        recencyWeight = 80; // Today
    } else if (diffHours < 72) {
        recencyWeight = 50; // Past 3 days
    } else if (diffHours < 168) {
        recencyWeight = 30; // Past week
    } else if (diffHours < 720) {
        recencyWeight = 15; // Past month
    }

    return (count * 10) + recencyWeight;
}

export const usageTracker = {
    trackAppOpen: (appId: string) => {
        if (typeof window === 'undefined') return;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const current: StoredStats = raw ? JSON.parse(raw) : {};
            const existing = current[appId];

            let count = 0;
            if (typeof existing === 'number') {
                count = existing;
            } else if (existing && typeof existing === 'object') {
                count = existing.count || 0;
            }

            current[appId] = {
                count: count + 1,
                lastOpened: Date.now()
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

            // Notify all listening components and widgets
            window.dispatchEvent(new CustomEvent('homelab_app_used', { detail: { appId } }));
        } catch (e) {
            console.error('Failed to track app usage:', e);
        }
    },

    getTopApps: (limit: number = 4): string[] => {
        if (typeof window === 'undefined') return [];

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const current: StoredStats = JSON.parse(raw);

            const scores = Object.entries(current).map(([id, entry]) => {
                let count = 1;
                let lastOpened = Date.now() - 86400000;
                if (typeof entry === 'number') {
                    count = entry;
                } else if (entry && typeof entry === 'object') {
                    count = entry.count || 1;
                    lastOpened = entry.lastOpened || lastOpened;
                }
                return {
                    id,
                    score: calculateFrecencyScore(count, lastOpened)
                };
            });

            return scores
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(s => s.id);
        } catch (e) {
            console.error('Failed to get top apps:', e);
            return [];
        }
    },

    getAppUsage: (appId: string): AppUsageEntry | null => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const current: StoredStats = JSON.parse(raw);
            const entry = current[appId];
            if (typeof entry === 'number') {
                return { count: entry, lastOpened: Date.now() };
            }
            return entry || null;
        } catch {
            return null;
        }
    },

    clearUsage: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('homelab_app_used', { detail: { cleared: true } }));
    }
};
