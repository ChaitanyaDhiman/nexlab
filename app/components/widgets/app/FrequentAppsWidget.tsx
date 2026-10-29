"use client";

import { useEffect, useState, useCallback } from 'react';
import { WidgetProps } from '@/app/types/widgets';
import { useApps } from '@/app/hooks/useApps';
import { AppTile } from '@/app/components/apps/AppTile';
import { usageTracker } from '@/app/lib/usageTracker';
import { App } from '@/app/types/apps';
import { BaseWidget } from '@/app/components/widgets/BaseWidget';
import { RotateCcw } from 'lucide-react';

export function FrequentAppsWidget({ widget, isEditMode, onRemove }: WidgetProps) {
    const { apps, loading } = useApps();
    const [frequentApps, setFrequentApps] = useState<App[]>([]);

    const refreshFrequent = useCallback(() => {
        // If in preview mode (id='preview'), show mock data
        if (widget.id === 'preview') {
            setFrequentApps(apps.slice(0, 4));
            return;
        }

        if (!loading && apps.length > 0) {
            const topIds = usageTracker.getTopApps(4);
            const topApps = topIds
                .map(id => apps.find(a => a.id === id))
                .filter((a): a is App => !!a);

            let displayApps = topApps;

            // If fewer than 4 apps, fill with favorites first
            if (displayApps.length < 4) {
                const favorites = apps
                    .filter(a => a.isFavorite && !displayApps.some(da => da.id === a.id))
                    .slice(0, 4 - displayApps.length);
                displayApps = [...displayApps, ...favorites];
            }

            // If still fewer than 4, fill with other available apps
            if (displayApps.length < 4) {
                const others = apps
                    .filter(a => !displayApps.some(da => da.id === a.id))
                    .slice(0, 4 - displayApps.length);
                displayApps = [...displayApps, ...others];
            }

            setFrequentApps(displayApps);
        }
    }, [apps, loading, widget.id]);

    useEffect(() => {
        refreshFrequent();

        const handleAppUsed = () => {
            refreshFrequent();
        };

        window.addEventListener('homelab_app_used', handleAppUsed);
        window.addEventListener('storage', handleAppUsed);

        return () => {
            window.removeEventListener('homelab_app_used', handleAppUsed);
            window.removeEventListener('storage', handleAppUsed);
        };
    }, [refreshFrequent]);

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Reset frequently visited apps history?')) {
            usageTracker.clearUsage();
            refreshFrequent();
        }
    };

    return (
        <BaseWidget
            title="Frequently Visited"
            isEditMode={isEditMode}
            onRemove={onRemove}
            actions={
                <button
                    onClick={handleReset}
                    className="p-1 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                    title="Reset history"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
            }
        >
            <div className="h-full flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-white/30 text-xs">
                        Loading apps...
                    </div>
                ) : frequentApps.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-white/30 text-xs text-center p-4">
                        No apps launched yet. Click any app tile to build your frequent list.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2.5 h-full auto-rows-fr">
                        {frequentApps.map(app => (
                            <div key={app.id} className="min-h-[64px] h-full">
                                <AppTile app={app} tileSize="small" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </BaseWidget>
    );
}
