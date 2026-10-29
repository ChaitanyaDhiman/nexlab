"use client";

import { WidgetProps } from '@/app/types/widgets';
import { BaseWidget } from '@/app/components/widgets/BaseWidget';
import { useSystem } from '@/app/contexts/SystemContext';
import { ArrowDown, ArrowUp, Activity, Wifi } from 'lucide-react';

export function NetworkWidget({ isEditMode, onRemove }: WidgetProps) {
    const { stats } = useSystem();

    const rx = stats?.network?.rx_sec || 0;
    const tx = stats?.network?.tx_sec || 0;

    const formatSpeed = (bytes: number) => {
        if (!bytes || bytes <= 0 || isNaN(bytes)) return '0 B/s';
        const k = 1024;
        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
    };

    const isHighTraffic = rx > 1024 * 500 || tx > 1024 * 500; // > 500 KB/s
    const isMediumTraffic = (rx > 1024 * 50 || tx > 1024 * 50) && !isHighTraffic;

    return (
        <BaseWidget
            title="Network Throughput"
            isEditMode={isEditMode}
            onRemove={onRemove}
            className="p-3"
            actions={
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400">
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            isHighTraffic
                                ? 'bg-cyan-400 animate-pulse'
                                : isMediumTraffic
                                ? 'bg-emerald-400'
                                : 'bg-gray-500'
                        }`}
                    />
                    <span>{isHighTraffic ? 'Heavy' : isMediumTraffic ? 'Active' : 'Idle'}</span>
                </div>
            }
        >
            <div className="h-full flex flex-col justify-between space-y-2">
                <div className="text-[11px] text-gray-400 flex items-center justify-between px-0.5">
                    <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-primary" />
                        Host Traffic I/O
                    </span>
                    <span className="text-[10px] text-white/40">Real-time bandwidth</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    {/* Inbound / Download */}
                    <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 text-[11px] font-medium">Inbound (RX)</span>
                            <div className="flex items-center gap-0.5 text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                <ArrowDown className="w-3 h-3" />
                                <span>Down</span>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-white tracking-tight mt-0.5">
                            {formatSpeed(rx)}
                        </div>
                        <span className="text-[10px] text-gray-500 truncate" title="Downloads, torrents, incoming media">
                            Incoming traffic
                        </span>
                    </div>

                    {/* Outbound / Upload */}
                    <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 text-[11px] font-medium">Outbound (TX)</span>
                            <div className="flex items-center gap-0.5 text-blue-400 font-semibold text-[10px] bg-blue-500/10 px-1.5 py-0.5 rounded">
                                <ArrowUp className="w-3 h-3" />
                                <span>Up</span>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-white tracking-tight mt-0.5">
                            {formatSpeed(tx)}
                        </div>
                        <span className="text-[10px] text-gray-500 truncate" title="Plex streams, web responses, uploads">
                            Outgoing traffic
                        </span>
                    </div>
                </div>
            </div>
        </BaseWidget>
    );
}
