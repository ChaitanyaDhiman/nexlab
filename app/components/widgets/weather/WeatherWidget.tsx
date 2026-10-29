"use client";

import { BaseWidget } from '../BaseWidget';
import { WidgetProps } from '@/app/types/widgets';
import { useEffect, useState, useCallback } from 'react';
import { Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, Wind, CloudFog, CloudLightning, RefreshCw, MapPin, Check, X } from 'lucide-react';

interface WeatherData {
    temperature: number;
    description: string;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    isDay: boolean;
    location: string;
}

const CITY_STORAGE_KEY = 'homelab_weather_city';

export function WeatherWidget({ isEditMode, onRemove }: WidgetProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditingCity, setIsEditingCity] = useState(false);
    const [cityInput, setCityInput] = useState('');

    const getWeatherIcon = (code: number, isDay: boolean) => {
        if (code === 0) return isDay ? Sun : Cloud;
        if (code >= 1 && code <= 3) return Cloud;
        if (code === 45 || code === 48) return CloudFog;
        if (code >= 51 && code <= 67) return CloudRain;
        if (code >= 71 && code <= 86) return CloudSnow;
        if (code >= 95) return CloudLightning;
        return Sun;
    };

    const fetchWeather = useCallback(async (customCity?: string) => {
        try {
            setError(null);
            const savedCity = customCity ?? (typeof window !== 'undefined' ? localStorage.getItem(CITY_STORAGE_KEY) : null);
            
            let url = '/api/weather';
            if (savedCity && savedCity.trim()) {
                url += `?city=${encodeURIComponent(savedCity.trim())}`;
            }

            const res = await fetch(url);
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Failed to fetch weather');
            }

            setWeather(json.data);
        } catch (err: unknown) {
            console.error('Weather error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load weather');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWeather();
        // Auto refresh every 15 minutes
        const interval = setInterval(() => fetchWeather(), 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchWeather]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchWeather();
    };

    const handleSaveCity = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = cityInput.trim();
        if (trimmed) {
            localStorage.setItem(CITY_STORAGE_KEY, trimmed);
            setLoading(true);
            setIsEditingCity(false);
            await fetchWeather(trimmed);
        } else {
            // Clear custom city and revert to IP geolocation
            localStorage.removeItem(CITY_STORAGE_KEY);
            setLoading(true);
            setIsEditingCity(false);
            await fetchWeather();
        }
    };

    const handleResetCity = async () => {
        localStorage.removeItem(CITY_STORAGE_KEY);
        setCityInput('');
        setIsEditingCity(false);
        setLoading(true);
        await fetchWeather();
    };

    return (
        <BaseWidget
            title="Weather"
            isEditMode={isEditMode}
            onRemove={onRemove}
            actions={
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => {
                            setCityInput(weather?.location || '');
                            setIsEditingCity(!isEditingCity);
                        }}
                        className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                        title="Set location"
                    >
                        <MapPin className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className={`p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors ${
                            refreshing ? 'animate-spin text-blue-400' : ''
                        }`}
                        title="Refresh weather"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            }
        >
            {isEditingCity && (
                <div className="p-2 mb-2 bg-white/5 rounded-lg border border-white/10 text-xs">
                    <form onSubmit={handleSaveCity} className="flex items-center gap-1.5">
                        <input
                            type="text"
                            placeholder="Enter city (e.g. London or Delhi)"
                            value={cityInput}
                            onChange={(e) => setCityInput(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/15 rounded px-2 py-1 text-white placeholder-white/40 focus:outline-none focus:border-primary text-xs"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="p-1 bg-primary/20 text-primary hover:bg-primary/30 rounded transition-colors"
                            title="Save"
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleResetCity}
                            className="px-1.5 py-1 text-[10px] text-white/60 hover:text-white bg-white/10 rounded transition-colors"
                            title="Use auto IP location"
                        >
                            Auto
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditingCity(false)}
                            className="p-1 text-white/50 hover:text-white rounded transition-colors"
                            title="Cancel"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-full min-h-[140px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-center p-4">
                    <Cloud className="w-8 h-8 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-400">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="text-xs text-primary mt-2 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            ) : weather ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2 py-1">
                    <div className="flex items-center gap-4">
                        {(() => {
                            const Icon = getWeatherIcon(weather.weatherCode, weather.isDay);
                            return <Icon className="w-12 h-12 text-primary" />;
                        })()}
                        <div className="text-4xl font-bold text-white tracking-tight">
                            {weather.temperature}°
                        </div>
                    </div>
                    <div className="text-center w-full px-2">
                        <p className="text-sm font-medium text-gray-200 truncate">{weather.description}</p>
                        <button
                            onClick={() => {
                                setCityInput(weather.location);
                                setIsEditingCity(true);
                            }}
                            className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto my-1 max-w-full"
                            title="Click to edit location"
                        >
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{weather.location}</span>
                        </button>
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-1 border-t border-white/5">
                            <span className="flex items-center gap-1" title="Wind speed">
                                <Wind className="w-3 h-3 text-cyan-400" />
                                {weather.windSpeed} km/h
                            </span>
                            <span className="flex items-center gap-1" title="Relative humidity">
                                <CloudDrizzle className="w-3 h-3 text-blue-400" />
                                {weather.humidity}%
                            </span>
                        </div>
                    </div>
                </div>
            ) : null}
        </BaseWidget>
    );
}
