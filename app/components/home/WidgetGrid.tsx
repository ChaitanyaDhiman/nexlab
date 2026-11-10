"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ResponsiveGridLayout, Layout } from 'react-grid-layout';
import { Widget, WidgetType } from '@/app/types/widgets';
import { useWidgets } from '@/app/contexts/WidgetContext';
import { WIDGET_METADATA } from '@/app/lib/widgetRegistry';
import { DateTimeWidget } from '@/app/components/widgets/datetime/DateTimeWidget';
import { WeatherWidget } from '@/app/components/widgets/weather/WeatherWidget';
import { SystemStatsWidget } from '@/app/components/widgets/system-stats/SystemStatsWidget';
import { UpdatesWidget } from '@/app/components/widgets/updates/UpdatesWidget';
import { ServiceHealthWidget } from '@/app/components/widgets/service-health/ServiceHealthWidget';
import { StorageWidget } from '@/app/components/widgets/storage/StorageWidget';
import { AppWidget } from '@/app/components/widgets/app/AppWidget';
import { FrequentAppsWidget } from '@/app/components/widgets/app/FrequentAppsWidget';
import { CpuGpuGauge } from '@/app/components/widgets/system/CpuGpuGauge';
import { CpuTempWidget } from '@/app/components/widgets/system/CpuTempCircle';
import { GpuTempWidget } from '@/app/components/widgets/system/GpuTempCircle';
import { StorageBarWidget } from '@/app/components/widgets/storage/StorageBar';
import { StoragePieWidget } from '@/app/components/widgets/storage/StoragePie';
import { NetworkWidget } from '@/app/components/widgets/network/NetworkWidget';
import { DockerWidget } from '@/app/components/widgets/docker/DockerWidget';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType<any>> = {
    'datetime': DateTimeWidget,
    'datetime-minimal': DateTimeWidget, // Reusing same component for now
    'datetime-analog': DateTimeWidget,  // Reusing same component for now
    'weather': WeatherWidget,
    'system-stats': SystemStatsWidget,
    'updates': UpdatesWidget,
    'service-health': ServiceHealthWidget,
    'storage': StorageWidget,
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

interface WidgetGridProps {
    widgets: Widget[];
}

type LayoutItem = Layout[number];

export function WidgetGrid({ widgets }: WidgetGridProps) {
    const { isEditMode, updateLayout, removeWidget, updateWidget } = useWidgets();
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [mounted, setMounted] = useState(false);
    const isDragging = useRef(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const updateWidth = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const layouts = {
        lg: widgets.map(widget => {
            const meta = WIDGET_METADATA[widget.type];
            // Widget layout should take precedence, fallback to default
            const w = widget.layout.w || meta.defaultSize.w;
            const h = widget.layout.h || meta.defaultSize.h;

            return {
                i: widget.id,
                x: widget.layout.x,
                y: widget.layout.y ?? 0,
                w: w,
                h: h,
                minW: meta.minSize?.w || 2,
                minH: meta.minSize?.h || 2,
                static: !isEditMode,
            };
        })
    };

    const currentLayoutRef = useRef<Layout | null>(null);

    // ... (width/mounted effects)

    const processLayoutUpdate = useCallback((layout: Layout) => {
        if (!isEditMode) return;

        const updatedWidgets = widgets.map(widget => {
            const layoutItem = layout.find((l: LayoutItem) => l.i === widget.id);
            if (!layoutItem) return widget;

            return {
                ...widget,
                layout: {
                    ...widget.layout,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    w: layoutItem.w,
                    h: layoutItem.h,
                }
            };
        });

        // Only call update if the object is actually different to avoid deep-equal checks in context
        // But we already checked `hasChanges` in the caller if called from onLayoutChange
        updateLayout(updatedWidgets);
    }, [isEditMode, widgets, updateLayout]);

    const handleDragStart = useCallback(() => {
        isDragging.current = true;
    }, []);

    const handleDragStop = useCallback((layout: Layout) => {
        isDragging.current = false;
        // Trigger update with final layout
        if (currentLayoutRef.current) {
            processLayoutUpdate(currentLayoutRef.current);
        } else {
            processLayoutUpdate(layout);
        }
    }, [processLayoutUpdate]);

    const handleResizeStart = useCallback(() => {
        isDragging.current = true;
    }, []);

    const handleResizeStop = useCallback((layout: Layout) => {
        isDragging.current = false;
        if (currentLayoutRef.current) {
            processLayoutUpdate(currentLayoutRef.current);
        } else {
            processLayoutUpdate(layout);
        }
    }, [processLayoutUpdate]);

    const handleLayoutChange = useCallback((currentLayout: Layout) => {
        const typedLayout = currentLayout;
        currentLayoutRef.current = typedLayout;

        // Only update context if we're not actively dragging
        if (!isEditMode || isDragging.current) return;

        // Check if layout actually changed to prevent render loops
        const hasChanges = widgets.some(widget => {
            const item = typedLayout.find((l: LayoutItem) => l.i === widget.id);
            if (!item) return false;
            // Compare layout properties
            return (
                item.x !== widget.layout.x ||
                item.y !== (widget.layout.y ?? 0) ||
                item.w !== widget.layout.w ||
                item.h !== widget.layout.h
            );
        });

        if (hasChanges) {
            processLayoutUpdate(typedLayout);
        }
    }, [isEditMode, widgets, processLayoutUpdate]);

    const renderWidget = (widget: Widget) => {
        const WidgetComponent = WIDGET_COMPONENTS[widget.type];
        if (!WidgetComponent) return null;

        const handleUpdateConfig = (newConfig: Record<string, unknown>) => {
            updateWidget(widget.id, {
                config: {
                    ...widget.config,
                    ...newConfig
                }
            });
        };

        return (
            <div key={widget.id} className="widget-container">
                <WidgetComponent
                    widget={widget}
                    isEditMode={isEditMode}
                    onRemove={() => removeWidget(widget.id)}
                    onUpdateConfig={handleUpdateConfig}
                />
            </div>
        );
    };

    if (!mounted || width === 0) {
        return <div ref={containerRef} style={{ width: '100%', minHeight: '200px' }} />;
    }

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={60}
                width={width}
                margin={[16, 16]}
                containerPadding={[0, 0]}
                onDragStart={handleDragStart}
                onDragStop={handleDragStop}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onLayoutChange={(layout: any) => handleLayoutChange(layout)}
            >
                {widgets.map(renderWidget)}
            </ResponsiveGridLayout>
        </div>
    );
}
