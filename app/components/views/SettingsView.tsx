'use client';

import { Clock12, Clock4, Globe, Calendar, Eye, Sun, LayoutGrid, HardDrive, Info, Palette } from 'lucide-react';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useState, useEffect } from 'react';
import { AppsManager } from '@/app/components/settings/AppsManager';
import { StorageManager } from '@/app/components/settings/StorageManager';
import { AboutSection } from '@/app/components/settings/AboutSection';
import { ThemeStudio } from '@/app/components/settings/ThemeStudio';

type SettingsTab = 'appearance' | 'themes' | 'apps' | 'storage' | 'about';

interface SettingsViewProps {
    initialTab?: SettingsTab;
}

export function SettingsView({ initialTab = 'appearance' }: SettingsViewProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
    const [previewTime, setPreviewTime] = useState('');
    const [previewDate, setPreviewDate] = useState('');
    const { timeFormat, setTimeFormat, dateFormat, setDateFormat, getEffectiveTimeFormat } = useSettings();

    const effectiveFormat = getEffectiveTimeFormat();

    // Update preview every second
    useEffect(() => {
        const updatePreview = () => {
            const now = new Date();
            const effectiveTimeFormat = getEffectiveTimeFormat();

            let formattedTime: string;
            if (timeFormat === 'auto') {
                formattedTime = now.toLocaleTimeString();
            } else {
                formattedTime = now.toLocaleTimeString('en-US', {
                    hour12: effectiveTimeFormat === '12h',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
            setPreviewTime(formattedTime);

            let formattedDate: string;
            if (dateFormat === 'auto') {
                formattedDate = now.toLocaleDateString();
            } else {
                const options: Intl.DateTimeFormatOptions =
                    dateFormat === 'short' ? { month: 'numeric', day: 'numeric', year: '2-digit' } :
                        dateFormat === 'medium' ? { month: 'short', day: 'numeric', year: 'numeric' } :
                            { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
                formattedDate = now.toLocaleDateString('en-US', options);
            }
            setPreviewDate(formattedDate);
        };

        updatePreview();
        const interval = setInterval(updatePreview, 1000);
        return () => clearInterval(interval);
    }, [timeFormat, dateFormat, getEffectiveTimeFormat]);

    return (
        <div className="flex flex-col min-h-full py-6 animate-in fade-in duration-500 max-w-6xl">
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Settings</h1>
                <p className="text-gray-400">Customize your dashboard experience.</p>
            </header>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('appearance')}
                    className={`px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'appearance'
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Appearance
                    </div>
                    {activeTab === 'appearance' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('themes')}
                    className={`px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'themes'
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Theme Studio
                    </div>
                    {activeTab === 'themes' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('apps')}
                    className={`px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'apps'
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" />
                        Apps Management
                    </div>
                    {activeTab === 'apps' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('storage')}
                    className={`px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'storage'
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Storage
                    </div>
                    {activeTab === 'storage' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('about')}
                    className={`px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${activeTab === 'about'
                        ? 'text-primary'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        About
                    </div>
                    {activeTab === 'about' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'appearance' && (
                <div className="space-y-8">
                    {/* Live Preview Section */}
                    <section className="bg-surface/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-primary mb-4">
                            <Eye className="w-5 h-5" />
                            <h2 className="text-lg font-semibold tracking-wide">Live Preview</h2>
                        </div>
                        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-8 flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
                            <div className="space-y-2">
                                <div className="text-4xl md:text-5xl font-bold font-mono text-foreground tabular-nums tracking-tight">
                                    {previewTime}
                                </div>
                                <div className="text-xl text-foreground/70 font-medium">
                                    {previewDate}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Time Format */}
                        <section className="bg-surface/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-white">
                                        <Clock12 className="w-5 h-5" />
                                        <h2 className="text-lg font-semibold">Time Format</h2>
                                    </div>
                                    {timeFormat === 'auto' && (
                                        <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                                            System: {effectiveFormat === '12h' ? '12-hour' : '24-hour'}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'auto', label: 'Auto', icon: Globe },
                                        { id: '12h', label: '12-hour', icon: Clock12 },
                                        { id: '24h', label: '24-hour', icon: Clock4 },
                                    ].map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = timeFormat === option.id;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => setTimeFormat(option.id as 'auto' | '12h' | '24h')}
                                                className={`
                                                    flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl transition-all cursor-pointer border-2
                                                    ${isSelected
                                                        ? 'bg-primary/10 text-primary border-primary/50 shadow-lg shadow-primary/5'
                                                        : 'bg-surface-highlight/50 text-gray-400 border-transparent hover:bg-surface-highlight hover:text-white hover:border-white/10'
                                                    }
                                                `}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-sm font-medium">{option.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* Date Format */}
                        <section className="bg-surface/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-white mb-6">
                                    <Calendar className="w-5 h-5" />
                                    <h2 className="text-lg font-semibold">Date Format</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'auto', label: 'Auto', desc: 'System Default' },
                                        { id: 'short', label: 'Short', desc: 'MM/DD/YY' },
                                        { id: 'medium', label: 'Medium', desc: 'MMM DD, YYYY' },
                                        { id: 'long', label: 'Long', desc: 'Month DD, YYYY' },
                                    ].map((option) => {
                                        const isSelected = dateFormat === option.id;
                                        return (
                                            <button
                                                key={option.id}
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                onClick={() => setDateFormat(option.id as any)}
                                                className={`
                                                    flex flex-col items-start p-3 rounded-xl transition-all cursor-pointer border-2 w-full
                                                    ${isSelected
                                                        ? 'bg-primary/10 text-primary border-primary/50 shadow-lg shadow-primary/5'
                                                        : 'bg-surface-highlight/50 text-gray-400 border-transparent hover:bg-surface-highlight hover:text-white hover:border-white/10'
                                                    }
                                                `}
                                            >
                                                <span className="text-sm font-bold mb-0.5">{option.label}</span>
                                                <span className="text-xs opacity-70">{option.desc}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {activeTab === 'themes' && <ThemeStudio />}
            {activeTab === 'apps' && <AppsManager />}
            {activeTab === 'storage' && <StorageManager />}
            {activeTab === 'about' && <AboutSection />}
        </div>
    );
}
