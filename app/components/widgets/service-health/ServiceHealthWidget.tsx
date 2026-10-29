"use client";

import { BaseWidget } from '../BaseWidget';
import { WidgetProps } from '@/app/types/widgets';
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Service {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'degraded';
}

export function ServiceHealthWidget({ isEditMode, onRemove }: WidgetProps) {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchServices = useCallback(async () => {
        try {
            const appsResponse = await fetch('/api/apps', { cache: 'no-store' });
            if (!appsResponse.ok) throw new Error('Failed to fetch apps');
            const appsData = await appsResponse.json();

            const healthResponse = await fetch('/api/health', { cache: 'no-store' });
            if (!healthResponse.ok) throw new Error('Failed to fetch health');
            const healthData = await healthResponse.json();

            const allApps = [
                ...(appsData.uncategorizedApps || []),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(appsData.categories || []).flatMap((cat: any) => cat.apps)
            ];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const servicesWithHealth = allApps.map((app: any) => ({
                id: app.id,
                name: app.name,
                status: healthData.data?.[app.id]?.status || 'offline'
            }));

            setServices(servicesWithHealth);
        } catch (error) {
            console.error('Error fetching service health:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchServices();
        const interval = setInterval(fetchServices, 30000);
        return () => clearInterval(interval);
    }, [fetchServices]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchServices();
    };

    const actions = (
        <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className={`p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors ${
                refreshing ? 'animate-spin text-blue-400' : ''
            }`}
            title="Refresh service health"
        >
            <RefreshCw className="w-3.5 h-3.5" />
        </button>
    );

    if (loading) {
        return (
            <BaseWidget title="Service Health" isEditMode={isEditMode} onRemove={onRemove} actions={actions}>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </BaseWidget>
        );
    }

    const totalServices = services.length;
    const onlineServices = services.filter(s => s.status === 'online').length;
    const offlineServices = services.filter(s => s.status === 'offline');
    const degradedServices = services.filter(s => s.status === 'degraded');

    const healthPercentage = totalServices > 0 ? (onlineServices / totalServices) * 100 : 0;

    return (
        <BaseWidget title="Service Health" isEditMode={isEditMode} onRemove={onRemove} actions={actions}>
            <div className="flex flex-col h-full">
                {/* Overview */}
                <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-white/10"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthPercentage / 100)}`}
                                className="text-green-400 transition-all duration-500"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{onlineServices}</div>
                                <div className="text-xs text-gray-400">/{totalServices}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center p-2 bg-green-500/10 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400 mb-1" />
                        <div className="text-lg font-bold text-white">{onlineServices}</div>
                        <div className="text-xs text-gray-400">Online</div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-yellow-500/10 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-400 mb-1" />
                        <div className="text-lg font-bold text-white">{degradedServices.length}</div>
                        <div className="text-xs text-gray-400">Degraded</div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-red-500/10 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-400 mb-1" />
                        <div className="text-lg font-bold text-white">{offlineServices.length}</div>
                        <div className="text-xs text-gray-400">Offline</div>
                    </div>
                </div>

                {/* Offline Services List */}
                {offlineServices.length > 0 && (
                    <div className="flex-1 overflow-auto">
                        <div className="text-xs text-gray-400 mb-2">Offline Services:</div>
                        <div className="space-y-1">
                            {offlineServices.slice(0, 3).map(service => (
                                <div key={service.id} className="text-sm text-red-400 truncate">
                                    • {service.name}
                                </div>
                            ))}
                            {offlineServices.length > 3 && (
                                <div className="text-xs text-gray-500">
                                    +{offlineServices.length - 3} more
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </BaseWidget>
    );
}
