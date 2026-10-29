'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { THEMES, ThemeColors, applyTheme } from '@/app/lib/themes';

type TimeFormat = 'auto' | '12h' | '24h';
type DateFormat = 'auto' | 'short' | 'medium' | 'long';
type Theme = 'auto' | 'light' | 'dark';

interface SettingsContextType {
    timeFormat: TimeFormat;
    setTimeFormat: (format: TimeFormat) => void;
    dateFormat: DateFormat;
    setDateFormat: (format: DateFormat) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    activeThemeKey: string;
    setThemeKey: (key: string) => Promise<void>;
    customThemes: Record<string, ThemeColors>;
    saveCustomTheme: (id: string, theme: ThemeColors) => Promise<void>;
    deleteCustomTheme: (id: string) => Promise<void>;
    allThemes: Record<string, ThemeColors>;
    getEffectiveTimeFormat: () => '12h' | '24h';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [timeFormat, setTimeFormatState] = useState<TimeFormat>('auto');
    const [dateFormat, setDateFormatState] = useState<DateFormat>('auto');
    const [theme, setThemeState] = useState<Theme>('dark');
    const [activeThemeKey, setActiveThemeKeyState] = useState<string>('deepSpace');
    const [customThemes, setCustomThemes] = useState<Record<string, ThemeColors>>({});
    const [mounted, setMounted] = useState(false);

    // Initial load from localStorage for instant render
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const savedTimeFormat = localStorage.getItem('timeFormat') as TimeFormat;
        const savedDateFormat = localStorage.getItem('dateFormat') as DateFormat;
        const savedTheme = localStorage.getItem('theme') as Theme;
        const savedThemeKey = localStorage.getItem('homelab_theme');

        if (savedTimeFormat === 'auto' || savedTimeFormat === '12h' || savedTimeFormat === '24h') {
            setTimeFormatState(savedTimeFormat);
        }
        if (savedDateFormat === 'auto' || savedDateFormat === 'short' || savedDateFormat === 'medium' || savedDateFormat === 'long') {
            setDateFormatState(savedDateFormat);
        }
        if (savedTheme === 'auto' || savedTheme === 'light' || savedTheme === 'dark') {
            setThemeState(savedTheme);
        }
        if (savedThemeKey) {
            setActiveThemeKeyState(savedThemeKey);
        }

        // Fetch server-persisted themes
        const fetchThemes = async () => {
            try {
                const res = await fetch('/api/themes');
                if (res.ok) {
                    const data = await res.json();
                    if (data.customThemes) {
                        setCustomThemes(data.customThemes);
                    }
                    const chosen = savedThemeKey || data.activeTheme || 'deepSpace';
                    setActiveThemeKeyState(chosen);
                    setThemeState(chosen === 'light' ? 'light' : 'dark');
                    applyTheme(chosen, data.customThemes);
                }
            } catch (err) {
                console.error('Failed to load server themes:', err);
                // Fallback to local
                if (savedThemeKey) {
                    applyTheme(savedThemeKey);
                }
            }
        };

        fetchThemes();
    }, []);

    const setTimeFormat = (format: TimeFormat) => {
        setTimeFormatState(format);
        if (mounted) {
            localStorage.setItem('timeFormat', format);
        }
    };

    const setDateFormat = (format: DateFormat) => {
        setDateFormatState(format);
        if (mounted) {
            localStorage.setItem('dateFormat', format);
        }
    };

    // Legacy theme toggle adapter
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (mounted) {
            localStorage.setItem('theme', newTheme);
        }
        const mappedKey = newTheme === 'light' ? 'light' : 'deepSpace';
        setThemeKey(mappedKey);
    };

    // Modern theme switcher
    const setThemeKey = useCallback(async (key: string) => {
        setActiveThemeKeyState(key);
        setThemeState(key === 'light' ? 'light' : 'dark');
        if (typeof window !== 'undefined') {
            localStorage.setItem('homelab_theme', key);
            localStorage.setItem('theme', key === 'light' ? 'light' : 'dark');
            applyTheme(key, customThemes);
        }
        try {
            await fetch('/api/themes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeTheme: key })
            });
        } catch (e) {
            console.error('Failed to sync active theme to server:', e);
        }
    }, [customThemes]);

    const saveCustomTheme = useCallback(async (id: string, themeObj: ThemeColors) => {
        const updated = { ...customThemes, [id]: themeObj };
        setCustomThemes(updated);
        try {
            await fetch('/api/themes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customThemes: updated, activeTheme: id })
            });
            await setThemeKey(id);
        } catch (e) {
            console.error('Failed to save custom theme:', e);
        }
    }, [customThemes, setThemeKey]);

    const deleteCustomTheme = useCallback(async (id: string) => {
        const updated = { ...customThemes };
        delete updated[id];
        setCustomThemes(updated);
        const nextActive = activeThemeKey === id ? 'deepSpace' : activeThemeKey;
        try {
            await fetch('/api/themes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customThemes: updated, activeTheme: nextActive })
            });
            if (activeThemeKey === id) {
                await setThemeKey('deepSpace');
            }
        } catch (e) {
            console.error('Failed to delete custom theme:', e);
        }
    }, [customThemes, activeThemeKey, setThemeKey]);

    const allThemes = { ...THEMES, ...customThemes };

    const getEffectiveTimeFormat = (): '12h' | '24h' => {
        if (timeFormat !== 'auto') {
            return timeFormat;
        }

        const testDate = new Date(2000, 0, 1, 13, 0, 0);
        const formatted = testDate.toLocaleTimeString();
        return formatted.includes('PM') || formatted.includes('AM') ? '12h' : '24h';
    };

    return (
        <SettingsContext.Provider value={{
            timeFormat,
            setTimeFormat,
            dateFormat,
            setDateFormat,
            theme,
            setTheme,
            activeThemeKey,
            setThemeKey,
            customThemes,
            saveCustomTheme,
            deleteCustomTheme,
            allThemes,
            getEffectiveTimeFormat
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
