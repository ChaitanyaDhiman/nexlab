"use client";

import { useState } from 'react';
import { useWidgets } from '@/app/contexts/WidgetContext';
import { WidgetGrid } from '@/app/components/home/WidgetGrid';
import { WidgetPicker } from '@/app/components/home/WidgetPicker';
import { SearchBar } from '@/app/components/home/SearchBar';
import { WelcomeHeader } from '@/app/components/home/WelcomeHeader';
import { Edit3, Check, Plus, Loader2 } from 'lucide-react';
import { WidgetType } from '@/app/types/widgets';
import { WIDGET_METADATA } from '@/app/lib/widgetRegistry';

export function HomeView() {
    const { config, isEditMode, setEditMode, addWidget, loading } = useWidgets();
    const [showWidgetPicker, setShowWidgetPicker] = useState(false);


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddWidget = (type: WidgetType, _size: { w: number, h: number }, _data?: any) => {
        const metadata = WIDGET_METADATA[type];

        // Check for duplicates if singleton
        if (metadata.singleton && config?.widgets.some(w => w.type === type)) {
            alert(`${metadata.name} is already added to the dashboard.`);
            return;
        }

        const newWidget = {
            id: `${type}-${Date.now()}`,
            type,
            layout: {
                x: 0,
                y: 0, // Context will compute actual position
                w: metadata.defaultSize.w,
                h: metadata.defaultSize.h,
                minW: metadata.defaultSize.w,
                minH: metadata.defaultSize.h,
            },
            config: {}
        };
        addWidget(newWidget);
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-6">
            {/* Header Row: Welcome Message + Controls */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                    <WelcomeHeader />
                </h1>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Search Bar */}
                    <div className="w-48 md:w-64">
                        <SearchBar />
                    </div>

                    {/* Add Widget Button - Visible only in edit mode */}
                    {isEditMode && (
                        <button
                            onClick={() => setShowWidgetPicker(true)}
                            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                            title="Add Widget"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}

                    {/* Edit Mode Controls */}
                    {isEditMode ? (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="p-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2 px-4"
                                title="Exit Edit Mode"
                            >
                                <Check className="w-5 h-5" />
                                <span className="hidden md:inline font-medium">Done</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                            title="Edit Dashboard"
                        >
                            <Edit3 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Widget Grid */}
            {config && config.widgets.length > 0 ? (
                <WidgetGrid widgets={config.widgets} />
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Plus className="w-12 h-12 text-gray-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">No Widgets Yet</h2>
                    <p className="text-gray-400 max-w-md mb-6">
                        Get started by adding your first widget to customize your dashboard.
                    </p>
                    <button
                        onClick={() => {
                            setEditMode(true);
                            setShowWidgetPicker(true);
                        }}
                        className="px-6 py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Widget
                    </button>
                </div>
            )}

            {/* Widget Picker Modal */}
            {showWidgetPicker && (
                <WidgetPicker
                    onAdd={handleAddWidget}
                    onClose={() => setShowWidgetPicker(false)}
                />
            )}
        </div>
    );
}
