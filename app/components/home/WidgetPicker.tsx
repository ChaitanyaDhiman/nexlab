"use client";

import { useState, useMemo } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { WIDGET_METADATA } from '@/app/lib/widgetRegistry';
import { WidgetType, WidgetProps } from '@/app/types/widgets';
import { DateTimeWidget } from '@/app/components/widgets/datetime/DateTimeWidget';
import { SystemStatsWidget } from '@/app/components/widgets/system-stats/SystemStatsWidget';
import { StorageWidget } from '@/app/components/widgets/storage/StorageWidget';
import { WeatherWidget } from '@/app/components/widgets/weather/WeatherWidget';
import { UpdatesWidget } from '@/app/components/widgets/updates/UpdatesWidget';
import { ServiceHealthWidget } from '@/app/components/widgets/service-health/ServiceHealthWidget';
import { AppWidget } from '@/app/components/widgets/app/AppWidget';
import { FrequentAppsWidget } from '@/app/components/widgets/app/FrequentAppsWidget';
import { CpuGpuGauge } from '@/app/components/widgets/system/CpuGpuGauge';
import { CpuTempWidget } from '@/app/components/widgets/system/CpuTempCircle';
import { GpuTempWidget } from '@/app/components/widgets/system/GpuTempCircle';
import { StorageBarWidget } from '@/app/components/widgets/storage/StorageBar';
import { StoragePieWidget } from '@/app/components/widgets/storage/StoragePie';
import { NetworkWidget } from '@/app/components/widgets/network/NetworkWidget';
import { DockerWidget } from '@/app/components/widgets/docker/DockerWidget';

// Map for previews
const PREVIEW_COMPONENTS: Record<string, React.ComponentType<WidgetProps>> = {
    'datetime': DateTimeWidget,
    'datetime-minimal': DateTimeWidget,
    'datetime-analog': DateTimeWidget,
    'system-stats': SystemStatsWidget,
    'storage': StorageWidget,
    'weather': WeatherWidget,
    'updates': UpdatesWidget,
    'service-health': ServiceHealthWidget,
    'app': AppWidget,
    'frequent-apps': FrequentAppsWidget,
    'cpu-gpu-gauge': CpuGpuGauge,
    'cpu-temp-circle': CpuTempWidget,
    'gpu-temp-circle': GpuTempWidget,
    'storage-bar': StorageBarWidget,
    'storage-pie': StoragePieWidget,
    'network': NetworkWidget,
    'docker': DockerWidget,
};

interface WidgetPickerProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onAdd: (type: WidgetType, size: { w: number, h: number }, data?: any) => void;
    onClose: () => void;
}

export function WidgetPicker({ onAdd, onClose }: WidgetPickerProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Extract categories - Add 'All'
    const categories = useMemo(() => {
        const cats = new Set<string>();
        Object.values(WIDGET_METADATA).forEach(meta => cats.add(meta.category));
        return ['All', ...Array.from(cats).sort()];
    }, []);

    // Filter widgets
    const filteredWidgets = useMemo(() => {
        const allWidgets = Object.values(WIDGET_METADATA);
        if (searchQuery.trim()) {
            return allWidgets.filter(widget =>
                widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                widget.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedCategory === 'All') return allWidgets;
        return allWidgets.filter(widget => widget.category === selectedCategory);
    }, [searchQuery, selectedCategory]);

    // Mock widget object for preview
    const getMockWidget = (type: WidgetType) => ({
        id: 'preview',
        type,
        layout: { x: 0, y: 0, w: 0, h: 0 }, // Dimensions ignored in preview
        config: {}
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-6xl h-[85vh] flex overflow-hidden shadow-2xl border border-white/10 text-white p-0">

                {/* Sidebar - Categories */}
                <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-bold text-white mb-1">Add Widget</h2>
                        <p className="text-xs text-gray-400">Select a category or search</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => {
                                    setSelectedCategory(category);
                                    setSearchQuery(''); // Clear search when picking category
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category && !searchQuery
                                    ? 'bg-primary/20 text-primary border border-primary/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content - Previews */}
                <div className="flex-1 flex flex-col bg-transparent">
                    {/* Header with Search */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                {searchQuery ? 'Search Results' : selectedCategory}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {filteredWidgets.length} widget{filteredWidgets.length !== 1 ? 's' : ''} available
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search widgets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-black/40 w-64 transition-all"
                                />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Previews Grid - Simplified */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
                            {filteredWidgets.map((widget) => {
                                const PreviewComponent = PREVIEW_COMPONENTS[widget.type] || (() => null);

                                return (
                                    <button
                                        key={widget.type}
                                        onClick={() => {
                                            onAdd(widget.type, widget.defaultSize, { ...widget, id: Date.now().toString() });
                                            onClose();
                                        }}
                                        className="group relative flex flex-col bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-primary/50 hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 ring-0 focus:ring-2 ring-primary/50 outline-none w-full aspect-video"
                                        title={widget.name}
                                    >
                                        {/* Full Card Preview */}
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            {/* Scaled Content Container */}
                                            <div className="w-[180%] h-[180%] transform scale-[0.55] origin-center pointer-events-none select-none flex items-center justify-center">
                                                <PreviewComponent
                                                    widget={getMockWidget(widget.type)}
                                                    isEditMode={false}
                                                />
                                            </div>
                                        </div>

                                        {/* Hover Overlay with Name */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px] z-10">
                                            <h4 className="text-white font-bold text-lg mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                {widget.name}
                                            </h4>
                                            <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg flex items-center gap-2 font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg delay-75 hover:bg-white/20">
                                                <Plus className="w-4 h-4" />
                                                Add Widget
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
