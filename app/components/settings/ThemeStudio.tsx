"use client";

import { useState } from 'react';
import { useSettings } from '@/app/contexts/SettingsContext';
import { THEMES, ThemeColors } from '@/app/lib/themes';
import { 
    Palette, 
    Check, 
    Trash2, 
    Code, 
    Sliders, 
    Save, 
    Sparkles, 
    Eye,
    RotateCcw,
    Home,
    LayoutGrid,
    BarChart3,
    RefreshCw,
    Settings,
    Cpu,
    HardDrive,
    Wifi,
    Clock,
    Terminal,
    ShieldCheck,
    Radio
} from 'lucide-react';

function getContrastTextColor(hexColor?: string): string {
    if (!hexColor || !hexColor.startsWith('#')) return '#000000';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 140 ? '#0a0a0f' : '#ffffff';
}

export function ThemeStudio() {
    const { 
        activeThemeKey, 
        setThemeKey, 
        allThemes, 
        customThemes, 
        saveCustomTheme, 
        deleteCustomTheme 
    } = useSettings();

    const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [miniTab, setMiniTab] = useState<'home' | 'updates' | 'services'>('home');

    // Draft theme state for customizer
    const [draftTheme, setDraftTheme] = useState<ThemeColors>(() => {
        const base = allThemes[activeThemeKey] || THEMES.deepSpace;
        return {
            name: `${base.name} (Custom)`,
            description: 'My custom dashboard theme',
            colors: { ...base.colors }
        };
    });

    const [customThemeName, setCustomThemeName] = useState('My Custom Theme');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSelectPreset = (key: string) => {
        setThemeKey(key);
        const selected = allThemes[key] || THEMES.deepSpace;
        setDraftTheme({
            name: `${selected.name} (Custom)`,
            description: selected.description,
            colors: { ...selected.colors }
        });
        setCustomThemeName(`${selected.name} (Custom)`);
    };

    const handleColorChange = (key: keyof ThemeColors['colors'], value: string) => {
        setDraftTheme(prev => ({
            ...prev,
            name: customThemeName,
            colors: {
                ...prev.colors,
                [key]: value
            }
        }));
    };

    const handleJsonChange = (raw: string) => {
        try {
            const parsed = JSON.parse(raw);
            if (!parsed.colors || typeof parsed.colors !== 'object') {
                throw new Error("Missing 'colors' object");
            }
            setDraftTheme(parsed);
            if (parsed.name) setCustomThemeName(parsed.name);
            setJsonError(null);
        } catch (e: unknown) {
            setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
        }
    };

    const handleSave = async () => {
        const id = `custom_${Date.now()}`;
        const themeToSave: ThemeColors = {
            ...draftTheme,
            name: customThemeName.trim() || 'Custom Theme'
        };
        await saveCustomTheme(id, themeToSave);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
    };

    const handleResetToCurrent = () => {
        const current = allThemes[activeThemeKey] || THEMES.deepSpace;
        setDraftTheme({
            name: `${current.name} (Custom)`,
            description: current.description,
            colors: { ...current.colors }
        });
        setCustomThemeName(`${current.name} (Custom)`);
        setJsonError(null);
    };

    const currentTheme = allThemes[activeThemeKey] || THEMES.deepSpace;
    const previewColors = draftTheme.colors;
    const isCustomActive = !!customThemes[activeThemeKey];
    const buttonTextColor = getContrastTextColor(previewColors.primary);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Theme Studio
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                    Select a curated preset from the dropdown or build your own custom color scheme below.
                </p>
            </div>

            {/* SECTION 1: Preset Theme Dropdown (Compact) */}
            <section className="bg-surface/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            Preset Themes
                        </h3>
                        <p className="text-xs text-gray-400">
                            Quickly switch between pre-configured palettes
                        </p>
                    </div>
                    {isCustomActive && (
                        <button
                            onClick={() => {
                                if (confirm(`Delete custom theme "${currentTheme.name}"?`)) {
                                    deleteCustomTheme(activeThemeKey);
                                }
                            }}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Active Custom Theme
                        </button>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-surface-highlight/20 border border-white/5">
                    {/* Dropdown Select */}
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-[11px] font-medium text-gray-400 mb-1">
                            Choose Palette
                        </label>
                        <select
                            value={activeThemeKey}
                            onChange={(e) => handleSelectPreset(e.target.value)}
                            className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-primary transition-colors cursor-pointer"
                        >
                            <optgroup label="Curated Presets">
                                {Object.entries(THEMES).map(([key, t]) => (
                                    <option key={key} value={key} className="bg-gray-900 text-white">
                                        {t.name}
                                    </option>
                                ))}
                            </optgroup>
                            {Object.keys(customThemes).length > 0 && (
                                <optgroup label="Custom Themes">
                                    {Object.entries(customThemes).map(([key, t]) => (
                                        <option key={key} value={key} className="bg-gray-900 text-white">
                                            {t.name} (Custom)
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>

                    {/* Active Theme Info & Color Swatches */}
                    <div className="flex-1 flex flex-col justify-center gap-2 sm:border-l sm:border-white/10 sm:pl-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-300 font-medium">
                                {currentTheme.name}
                            </span>
                            <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Active
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-1">
                            {currentTheme.description}
                        </p>
                        {/* Swatches */}
                        <div className="flex items-center gap-1.5 pt-1">
                            <div 
                                className="w-4 h-4 rounded-full border border-white/15" 
                                style={{ backgroundColor: currentTheme.colors.background }} 
                                title={`Background: ${currentTheme.colors.background}`}
                            />
                            <div 
                                className="w-4 h-4 rounded-full border border-white/15" 
                                style={{ backgroundColor: currentTheme.colors.surface }} 
                                title={`Surface: ${currentTheme.colors.surface}`}
                            />
                            <div 
                                className="w-4 h-4 rounded-full border border-white/15" 
                                style={{ backgroundColor: currentTheme.colors.primary }} 
                                title={`Primary Accent: ${currentTheme.colors.primary}`}
                            />
                            <div 
                                className="w-4 h-4 rounded-full border border-white/15" 
                                style={{ backgroundColor: currentTheme.colors.secondary }} 
                                title={`Secondary Accent: ${currentTheme.colors.secondary}`}
                            />
                            <div 
                                className="w-4 h-4 rounded-full border border-white/15" 
                                style={{ backgroundColor: currentTheme.colors.foreground }} 
                                title={`Text: ${currentTheme.colors.foreground}`}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: Custom Theme Creator & Live Preview */}
            <section className="bg-surface/30 border border-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                    <div>
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Custom Theme Creator
                        </h3>
                        <p className="text-xs text-gray-400">
                            Fine-tune colors or paste raw JSON. Inspect real-time preview on the right.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Visual / JSON Switcher */}
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10 text-xs">
                            <button
                                onClick={() => setEditorMode('visual')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                    editorMode === 'visual' ? 'bg-primary/20 text-primary font-medium' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Sliders className="w-3.5 h-3.5" />
                                Visual Pickers
                            </button>
                            <button
                                onClick={() => setEditorMode('json')}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                    editorMode === 'json' ? 'bg-primary/20 text-primary font-medium' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Code className="w-3.5 h-3.5" />
                                Raw JSON
                            </button>
                        </div>

                        <button
                            onClick={handleResetToCurrent}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                            title="Reset colors to selected preset"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Form & Inputs (6 Cols) */}
                    <div className="lg:col-span-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                                Theme Name
                            </label>
                            <input
                                type="text"
                                value={customThemeName}
                                onChange={(e) => setCustomThemeName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors"
                                placeholder="e.g. My Cyberpunk Neon"
                            />
                        </div>

                        {editorMode === 'visual' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {/* Primary Accent */}
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-gray-300 font-medium">Primary Accent</span>
                                        <span className="text-[10px] text-gray-500">Buttons & Glow</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={previewColors.primary}
                                            onChange={(e) => handleColorChange('primary', e.target.value)}
                                            className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={previewColors.primary}
                                            onChange={(e) => handleColorChange('primary', e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white uppercase font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Secondary Accent */}
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-gray-300 font-medium">Secondary Accent</span>
                                        <span className="text-[10px] text-gray-500">Badges & Metrics</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={previewColors.secondary}
                                            onChange={(e) => handleColorChange('secondary', e.target.value)}
                                            className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={previewColors.secondary}
                                            onChange={(e) => handleColorChange('secondary', e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white uppercase font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Canvas Background */}
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-gray-300 font-medium">Canvas Background</span>
                                        <span className="text-[10px] text-gray-500">Page Backing</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={previewColors.background.startsWith('#') ? previewColors.background : '#050510'}
                                            onChange={(e) => handleColorChange('background', e.target.value)}
                                            className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={previewColors.background}
                                            onChange={(e) => handleColorChange('background', e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Card Surface */}
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-gray-300 font-medium">Card Surface</span>
                                        <span className="text-[10px] text-gray-500">Widget Containers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={previewColors.surface.startsWith('#') ? previewColors.surface : '#0f0f1f'}
                                            onChange={(e) => handleColorChange('surface', e.target.value)}
                                            className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={previewColors.surface}
                                            onChange={(e) => handleColorChange('surface', e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Surface Highlight */}
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-gray-300 font-medium">Hover Highlight</span>
                                        <span className="text-[10px] text-gray-500">Active Nav & Pills</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={previewColors.surfaceHighlight.startsWith('#') ? previewColors.surfaceHighlight : '#1a1a2e'}
                                            onChange={(e) => handleColorChange('surfaceHighlight', e.target.value)}
                                            className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={previewColors.surfaceHighlight}
                                            onChange={(e) => handleColorChange('surfaceHighlight', e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Text Color */}
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-gray-300 font-medium">Text Color</span>
                                        <span className="text-[10px] text-gray-500">Primary Typography</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={previewColors.foreground.startsWith('#') ? previewColors.foreground : '#e0e0e0'}
                                            onChange={(e) => handleColorChange('foreground', e.target.value)}
                                            className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={previewColors.foreground}
                                            onChange={(e) => handleColorChange('foreground', e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">
                                    Paste or Edit Theme JSON
                                </label>
                                <textarea
                                    rows={9}
                                    value={JSON.stringify(draftTheme, null, 2)}
                                    onChange={(e) => handleJsonChange(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-primary"
                                    spellCheck={false}
                                />
                                {jsonError && (
                                    <p className="text-xs text-red-400 mt-1 font-mono">
                                        ⚠ {jsonError}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Save Action Bar */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={!!jsonError}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-primary/10 cursor-pointer"
                            >
                                <Save className="w-4 h-4" />
                                Save & Apply Custom Theme
                            </button>
                            {saveSuccess && (
                                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                                    <Check className="w-4 h-4" /> Saved to server config!
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Live Miniature Interactive Dashboard Preview (6 Cols) */}
                    <div className="lg:col-span-6 space-y-3 lg:sticky lg:top-4">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1.5 font-medium text-white">
                                <Eye className="w-4 h-4 text-primary" />
                                Live Miniature Dashboard Preview
                            </span>
                            <div className="flex items-center gap-1 text-[11px] bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                                <button
                                    onClick={() => setMiniTab('home')}
                                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${miniTab === 'home' ? 'text-primary font-bold' : 'hover:text-white'}`}
                                >
                                    Home
                                </button>
                                <span>•</span>
                                <button
                                    onClick={() => setMiniTab('updates')}
                                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${miniTab === 'updates' ? 'text-primary font-bold' : 'hover:text-white'}`}
                                >
                                    Updates
                                </button>
                                <span>•</span>
                                <button
                                    onClick={() => setMiniTab('services')}
                                    className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${miniTab === 'services' ? 'text-primary font-bold' : 'hover:text-white'}`}
                                >
                                    Services
                                </button>
                            </div>
                        </div>

                        {/* Authentic Scoped Dashboard Sandbox */}
                        <div 
                            className="rounded-2xl border transition-all duration-300 shadow-2xl overflow-hidden flex flex-col select-none"
                            style={{
                                backgroundColor: previewColors.background,
                                borderColor: previewColors.border || 'rgba(255,255,255,0.12)',
                                color: previewColors.foreground,
                            }}
                        >
                            {/* Window Chrome Titlebar */}
                            <div 
                                className="flex items-center justify-between px-3.5 py-2.5 border-b text-[11px]"
                                style={{ 
                                    borderColor: previewColors.border || 'rgba(255,255,255,0.08)', 
                                    backgroundColor: previewColors.surface 
                                }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                                    <span className="ml-2 font-mono text-[10px] opacity-70 tracking-tight">dashboard.home</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span 
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold"
                                        style={{ backgroundColor: `${previewColors.primary}20`, color: previewColors.primary }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: previewColors.primary }} />
                                        Online
                                    </span>
                                    <span className="text-[10px] opacity-60 font-mono">18:30:45</span>
                                </div>
                            </div>

                            {/* Window Body: Sidebar + Main Content */}
                            <div className="flex flex-1 min-h-[380px]">
                                {/* Miniature Sidebar */}
                                <div 
                                    className="w-12 border-r flex flex-col items-center py-3 gap-2.5 shrink-0"
                                    style={{ 
                                        borderColor: previewColors.border || 'rgba(255,255,255,0.08)', 
                                        backgroundColor: previewColors.surface 
                                    }}
                                >
                                    {/* NexLab Monogram Logo */}
                                    <div 
                                        className="w-7 h-7 rounded-lg flex items-center justify-center shadow font-bold text-xs"
                                        style={{ 
                                            backgroundColor: previewColors.primary, 
                                            color: buttonTextColor 
                                        }}
                                    >
                                        N
                                    </div>

                                    {/* Nav Icons */}
                                    <div className="flex flex-col items-center gap-1.5 pt-2 w-full px-1.5">
                                        {/* Home Tab */}
                                        <button
                                            onClick={() => setMiniTab('home')}
                                            className="w-full h-8 rounded-lg flex items-center justify-center relative transition-all cursor-pointer"
                                            style={{ 
                                                backgroundColor: miniTab === 'home' ? previewColors.surfaceHighlight : 'transparent',
                                                color: miniTab === 'home' ? previewColors.primary : previewColors.foreground,
                                                opacity: miniTab === 'home' ? 1 : 0.5
                                            }}
                                            title="Home"
                                        >
                                            <Home className="w-3.5 h-3.5" />
                                            {miniTab === 'home' && (
                                                <div 
                                                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r" 
                                                    style={{ backgroundColor: previewColors.primary }} 
                                                />
                                            )}
                                        </button>

                                        {/* Services / Apps Tab */}
                                        <button
                                            onClick={() => setMiniTab('services')}
                                            className="w-full h-8 rounded-lg flex items-center justify-center relative transition-all cursor-pointer"
                                            style={{ 
                                                backgroundColor: miniTab === 'services' ? previewColors.surfaceHighlight : 'transparent',
                                                color: miniTab === 'services' ? previewColors.primary : previewColors.foreground,
                                                opacity: miniTab === 'services' ? 1 : 0.5
                                            }}
                                            title="Services"
                                        >
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                            {miniTab === 'services' && (
                                                <div 
                                                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r" 
                                                    style={{ backgroundColor: previewColors.primary }} 
                                                />
                                            )}
                                        </button>

                                        {/* Updates Tab */}
                                        <button
                                            onClick={() => setMiniTab('updates')}
                                            className="w-full h-8 rounded-lg flex items-center justify-center relative transition-all cursor-pointer"
                                            style={{ 
                                                backgroundColor: miniTab === 'updates' ? previewColors.surfaceHighlight : 'transparent',
                                                color: miniTab === 'updates' ? previewColors.primary : previewColors.foreground,
                                                opacity: miniTab === 'updates' ? 1 : 0.5
                                            }}
                                            title="Updates"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span 
                                                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" 
                                                style={{ backgroundColor: previewColors.secondary }} 
                                            />
                                            {miniTab === 'updates' && (
                                                <div 
                                                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r" 
                                                    style={{ backgroundColor: previewColors.primary }} 
                                                />
                                            )}
                                        </button>

                                        {/* Analytics */}
                                        <div 
                                            className="w-full h-8 rounded-lg flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity"
                                            title="Analytics"
                                        >
                                            <BarChart3 className="w-3.5 h-3.5" />
                                        </div>
                                    </div>

                                    {/* Bottom Settings Icon */}
                                    <div className="mt-auto opacity-50 hover:opacity-100 transition-opacity pb-1">
                                        <Settings className="w-3.5 h-3.5" />
                                    </div>
                                </div>

                                {/* Main Dashboard View Panel */}
                                <div className="flex-1 p-3.5 space-y-3 overflow-hidden flex flex-col justify-between">
                                    {/* Top Greeting Header */}
                                    <div className="flex items-center justify-between pb-1 border-b"
                                         style={{ borderColor: previewColors.border || 'rgba(255,255,255,0.06)' }}>
                                        <div>
                                            <div className="text-xs font-bold tracking-tight" style={{ color: previewColors.foreground }}>
                                                NexLab Homelab
                                            </div>
                                            <div className="text-[9px] opacity-60 font-mono">
                                                Ubuntu 24.04 LTS • 8 Containers
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span 
                                                className="px-2 py-0.5 rounded-md text-[9px] font-mono flex items-center gap-1 border"
                                                style={{ 
                                                    backgroundColor: previewColors.surfaceHighlight, 
                                                    borderColor: previewColors.border || 'rgba(255,255,255,0.1)',
                                                    color: previewColors.foreground 
                                                }}
                                            >
                                                <Clock className="w-2.5 h-2.5 opacity-70" />
                                                Up 14d 6h
                                            </span>
                                        </div>
                                    </div>

                                    {/* VIEW 1: HOME DASHBOARD */}
                                    {miniTab === 'home' && (
                                        <div className="space-y-2.5 animate-in fade-in duration-200">
                                            {/* System Vitals Row */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {/* CPU Card */}
                                                <div 
                                                    className="p-2.5 rounded-xl border space-y-1.5"
                                                    style={{ 
                                                        backgroundColor: previewColors.surface, 
                                                        borderColor: previewColors.border || 'rgba(255,255,255,0.08)' 
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="flex items-center gap-1 text-[10px] font-medium opacity-80">
                                                            <Cpu className="w-3 h-3" style={{ color: previewColors.primary }} />
                                                            CPU Load
                                                        </span>
                                                        <span className="font-mono font-bold text-[10px]" style={{ color: previewColors.primary }}>
                                                            28%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all"
                                                            style={{ width: '28%', backgroundColor: previewColors.primary }} 
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between text-[8px] opacity-55 font-mono">
                                                        <span>4 Cores @ 3.4GHz</span>
                                                        <span>46°C</span>
                                                    </div>
                                                </div>

                                                {/* Memory Card */}
                                                <div 
                                                    className="p-2.5 rounded-xl border space-y-1.5"
                                                    style={{ 
                                                        backgroundColor: previewColors.surface, 
                                                        borderColor: previewColors.border || 'rgba(255,255,255,0.08)' 
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="flex items-center gap-1 text-[10px] font-medium opacity-80">
                                                            <HardDrive className="w-3 h-3" style={{ color: previewColors.secondary }} />
                                                            RAM Usage
                                                        </span>
                                                        <span className="font-mono font-bold text-[10px]" style={{ color: previewColors.secondary }}>
                                                            42%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all"
                                                            style={{ width: '42%', backgroundColor: previewColors.secondary }} 
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between text-[8px] opacity-55 font-mono">
                                                        <span>6.8 GB / 16 GB</span>
                                                        <span>Swap: 4%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Services Health Snapshot */}
                                            <div 
                                                className="p-2.5 rounded-xl border space-y-1.5"
                                                style={{ 
                                                    backgroundColor: previewColors.surface, 
                                                    borderColor: previewColors.border || 'rgba(255,255,255,0.08)' 
                                                }}
                                            >
                                                <div className="flex items-center justify-between text-[10px] font-semibold pb-1 border-b"
                                                     style={{ borderColor: previewColors.border || 'rgba(255,255,255,0.06)' }}>
                                                    <span>Active Homelab Services</span>
                                                    <span 
                                                        className="text-[8px] font-mono px-1.5 py-0.2 rounded"
                                                        style={{ backgroundColor: `${previewColors.primary}15`, color: previewColors.primary }}
                                                    >
                                                        3 Online
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    {/* Service 1: Plex */}
                                                    <div className="flex items-center justify-between py-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <div 
                                                                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                                                                style={{ 
                                                                    backgroundColor: previewColors.surfaceHighlight, 
                                                                    color: previewColors.primary 
                                                                }}
                                                            >
                                                                P
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-medium leading-none">Plex Media</div>
                                                                <div className="text-[8px] opacity-60">Port 32400</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[8px] font-mono opacity-70">18ms</span>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        </div>
                                                    </div>

                                                    {/* Service 2: AdGuard */}
                                                    <div className="flex items-center justify-between py-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <div 
                                                                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                                                                style={{ 
                                                                    backgroundColor: previewColors.surfaceHighlight, 
                                                                    color: previewColors.secondary 
                                                                }}
                                                            >
                                                                A
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-medium leading-none">AdGuard DNS</div>
                                                                <div className="text-[8px] opacity-60">0.0.0.0:53</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[8px] font-mono opacity-70">2ms</span>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Action Row: Network Area + Update Button */}
                                            <div className="grid grid-cols-2 gap-2 items-center">
                                                {/* Mini Network Sparkline */}
                                                <div 
                                                    className="p-2 rounded-xl border flex flex-col justify-between h-[54px]"
                                                    style={{ 
                                                        backgroundColor: previewColors.surface, 
                                                        borderColor: previewColors.border || 'rgba(255,255,255,0.08)' 
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between text-[9px]">
                                                        <span className="flex items-center gap-1 opacity-70">
                                                            <Wifi className="w-2.5 h-2.5" /> Traffic
                                                        </span>
                                                        <span className="font-mono text-[9px] font-bold" style={{ color: previewColors.primary }}>
                                                            14.2 MB/s
                                                        </span>
                                                    </div>
                                                    {/* SVG Sparkline */}
                                                    <svg className="w-full h-4 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                                                        <defs>
                                                            <linearGradient id="previewSparkGrad" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor={previewColors.primary} stopOpacity="0.4" />
                                                                <stop offset="100%" stopColor={previewColors.primary} stopOpacity="0.0" />
                                                            </linearGradient>
                                                        </defs>
                                                        <path d="M 0,16 Q 20,4 40,12 T 70,6 T 100,10 L 100,20 L 0,20 Z" fill="url(#previewSparkGrad)" />
                                                        <path d="M 0,16 Q 20,4 40,12 T 70,6 T 100,10" fill="none" stroke={previewColors.primary} strokeWidth="1.5" />
                                                    </svg>
                                                </div>

                                                {/* Action Button */}
                                                <button
                                                    onClick={() => setMiniTab('updates')}
                                                    className="w-full h-[54px] rounded-xl text-[11px] font-semibold shadow transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                                                    style={{
                                                        backgroundColor: previewColors.primary,
                                                        color: buttonTextColor
                                                    }}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <RefreshCw className="w-3 h-3" />
                                                        <span>System Updates</span>
                                                    </div>
                                                    <span className="text-[8px] opacity-80 font-normal">2 Upgradable Packages</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* VIEW 2: UPDATES VIEW SIMULATION */}
                                    {miniTab === 'updates' && (
                                        <div className="space-y-2.5 animate-in fade-in duration-200">
                                            {/* Updates Header Banner */}
                                            <div 
                                                className="p-2.5 rounded-xl border flex items-center justify-between"
                                                style={{ 
                                                    backgroundColor: previewColors.surface, 
                                                    borderColor: previewColors.border || 'rgba(255,255,255,0.08)' 
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                                                        style={{ backgroundColor: `${previewColors.secondary}20`, color: previewColors.secondary }}
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-bold">2 Upgrades Available</div>
                                                        <div className="text-[8px] opacity-60">Security and kernel patches</div>
                                                    </div>
                                                </div>
                                                <span 
                                                    className="px-2 py-0.5 rounded text-[9px] font-bold"
                                                    style={{ backgroundColor: previewColors.secondary, color: getContrastTextColor(previewColors.secondary) }}
                                                >
                                                    APT Ready
                                                </span>
                                            </div>

                                            {/* Package list */}
                                            <div 
                                                className="p-2.5 rounded-xl border space-y-1.5"
                                                style={{ 
                                                    backgroundColor: previewColors.surface, 
                                                    borderColor: previewColors.border || 'rgba(255,255,255,0.08)' 
                                                }}
                                            >
                                                <div className="flex items-center justify-between text-[9px] font-mono py-1 border-b"
                                                     style={{ borderColor: previewColors.border || 'rgba(255,255,255,0.06)' }}>
                                                    <span className="font-semibold">linux-image-generic</span>
                                                    <span style={{ color: previewColors.primary }}>6.8.0-45 ➔ 6.8.0-48</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[9px] font-mono py-1">
                                                    <span className="font-semibold">docker-ce</span>
                                                    <span style={{ color: previewColors.secondary }}>27.3.0 ➔ 27.3.1</span>
                                                </div>
                                            </div>

                                            {/* Simulated Live Terminal */}
                                            <div 
                                                className="p-2.5 rounded-xl border font-mono text-[8px] space-y-1 bg-black/70"
                                                style={{ borderColor: previewColors.border || 'rgba(255,255,255,0.1)' }}
                                            >
                                                <div className="flex items-center justify-between text-gray-400 border-b border-white/10 pb-1">
                                                    <span className="flex items-center gap-1">
                                                        <Terminal className="w-2.5 h-2.5" /> Live Terminal Log
                                                    </span>
                                                    <span className="text-emerald-400">● STREAMING</span>
                                                </div>
                                                <div className="text-gray-300">$ sudo apt update && apt list --upgradable</div>
                                                <div className="opacity-70">Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease</div>
                                                <div style={{ color: previewColors.primary }}>All packages are ready for deployment.</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* VIEW 3: SERVICES GRID SIMULATION */}
                                    {miniTab === 'services' && (
                                        <div className="space-y-2 animate-in fade-in duration-200">
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { name: 'Plex Media', cat: 'Media Server', port: '32400', initial: 'P', color: previewColors.primary },
                                                    { name: 'AdGuard Home', cat: 'DNS Sinkhole', port: '53', initial: 'A', color: previewColors.secondary },
                                                    { name: 'Nextcloud', cat: 'Cloud Drive', port: '8080', initial: 'N', color: previewColors.primary },
                                                    { name: 'Portainer', cat: 'Containers', port: '9443', initial: 'O', color: previewColors.secondary }
                                                ].map((svc) => (
                                                    <div 
                                                        key={svc.name}
                                                        className="p-2 rounded-xl border flex items-center justify-between transition-all"
                                                        style={{ 
                                                            backgroundColor: previewColors.surface, 
                                                            borderColor: previewColors.border || 'rgba(255,255,255,0.08)' 
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <div 
                                                                className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                                                                style={{ backgroundColor: previewColors.surfaceHighlight, color: svc.color }}
                                                            >
                                                                {svc.initial}
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-semibold leading-tight">{svc.name}</div>
                                                                <div className="text-[8px] opacity-60">:{svc.port}</div>
                                                            </div>
                                                        </div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div 
                                                className="p-2 rounded-xl border text-[9px] flex items-center justify-between"
                                                style={{ 
                                                    backgroundColor: previewColors.surfaceHighlight,
                                                    borderColor: previewColors.border || 'rgba(255,255,255,0.08)'
                                                }}
                                            >
                                                <span className="flex items-center gap-1 font-medium">
                                                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> All 4 services healthy
                                                </span>
                                                <span className="font-mono opacity-60">Ping: avg 4ms</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

