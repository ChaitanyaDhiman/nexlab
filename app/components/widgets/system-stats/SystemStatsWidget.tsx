"use client";

import { BaseWidget } from '../BaseWidget';
import { WidgetProps } from '@/app/types/widgets';
import { useSystem } from '@/app/contexts/SystemContext';
import { Cpu, Thermometer, Fan, Clock, MemoryStick, Gpu } from 'lucide-react';

export function SystemStatsWidget({ isEditMode, onRemove }: WidgetProps) {
    const { stats, loading } = useSystem();

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getTemperatureColor = (temp: number) => {
        if (temp >= 80) return 'text-red-400';
        if (temp >= 65) return 'text-yellow-400';
        return 'text-green-400';
    };

    if (loading) {
        return (
            <BaseWidget title="System Stats" isEditMode={isEditMode} onRemove={onRemove}>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </BaseWidget>
        );
    }

    return (
        <BaseWidget title="System Stats" isEditMode={isEditMode} onRemove={onRemove}>
            <div className="flex flex-col gap-4">
                {/* CPU Usage and Temp */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Cpu className="w-4 h-4" />
                            <span className="text-xs">CPU</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {stats?.cpu.toFixed(1)}%
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${stats?.cpu || 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Thermometer className="w-4 h-4" />
                            <span className="text-xs">CPU Temp</span>
                        </div>
                        <div className={`text-2xl font-bold ${getTemperatureColor(stats?.temperature || 0)}`}>
                            {stats?.temperature}°C
                        </div>
                    </div>
                </div>

                {/* GPU Usage and Temp */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Gpu className="w-4 h-4" />
                            <span className="text-xs">GPU</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {stats?.gpu?.utilization.toFixed(1) || '0.0'}%
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className="bg-secondary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${stats?.gpu?.utilization || 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Thermometer className="w-4 h-4" />
                            <span className="text-xs">GPU Temp</span>
                        </div>
                        <div className={`text-2xl font-bold ${getTemperatureColor(stats?.gpu?.temperature || 0)}`}>
                            {stats?.gpu?.temperature || 0}°C
                        </div>
                    </div>
                </div>

                {/* RAM, Fan, Uptime */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <MemoryStick className="w-4 h-4" />
                            <span className="text-xs">RAM</span>
                        </div>
                        <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                            {stats?.memory?.used ? (stats.memory.used / (1024 * 1024 * 1024)).toFixed(1) : '0'}
                            <span className="text-sm text-gray-400 font-normal">
                                / {stats?.memory?.total ? (stats.memory.total / (1024 * 1024 * 1024)).toFixed(1) : '0'} GB
                            </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${stats?.memory?.total ? (stats.memory.used / stats.memory.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Fan className="w-4 h-4" />
                            <span className="text-xs">Fan</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {stats?.fanSpeed || 'N/A'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs">Uptime</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                            {formatUptime(stats?.uptime || 0)}
                        </div>
                    </div>
                </div>
            </div>
        </BaseWidget>
    );
}
