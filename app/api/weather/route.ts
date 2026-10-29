import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface WeatherCache {
    data: any;
    timestamp: number;
    key: string;
}

let cachedWeather: WeatherCache | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getWeatherDescription(code: number): string {
    if (code === 0) return 'Clear sky';
    if (code === 1 || code === 2 || code === 3) return 'Mainly clear, partly cloudy';
    if (code === 45 || code === 48) return 'Fog';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 56 && code <= 57) return 'Freezing Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 66 && code <= 67) return 'Freezing Rain';
    if (code >= 71 && code <= 75) return 'Snow fall';
    if (code === 77) return 'Snow grains';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 85 && code <= 86) return 'Snow showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Clear sky';
}

/**
 * GET /api/weather
 * Resolves weather via coordinates, custom city, or server IP fallback.
 * Works seamlessly on both HTTP and HTTPS.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let lat = searchParams.get('lat');
        let lon = searchParams.get('lon');
        const cityQuery = searchParams.get('city');

        let locationName = '';

        // 1. If custom city is requested, geocode it using Open-Meteo geocoding API
        if (cityQuery) {
            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=en&format=json`
            );
            if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results.length > 0) {
                    const result = geoData.results[0];
                    lat = result.latitude.toString();
                    lon = result.longitude.toString();
                    locationName = [result.name, result.admin1, result.country_code]
                        .filter(Boolean)
                        .join(', ');
                }
            }
        }

        // 2. If lat/lon not provided, resolve via IP Geolocation fallback
        if (!lat || !lon) {
            try {
                // Try ip-api.com
                const ipRes = await fetch('http://ip-api.com/json/?fields=status,country,regionName,city,lat,lon', {
                    cache: 'no-store'
                });
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    if (ipData.status === 'success') {
                        lat = ipData.lat.toString();
                        lon = ipData.lon.toString();
                        locationName = [ipData.city, ipData.regionName].filter(Boolean).join(', ');
                    }
                }
            } catch {
                // Try secondary IP lookup if first fails
                try {
                    const ipapiRes = await fetch('https://ipapi.co/json/');
                    if (ipapiRes.ok) {
                        const ipapiData = await ipapiRes.json();
                        if (ipapiData.latitude && ipapiData.longitude) {
                            lat = ipapiData.latitude.toString();
                            lon = ipapiData.longitude.toString();
                            locationName = [ipapiData.city, ipapiData.region].filter(Boolean).join(', ');
                        }
                    }
                } catch {
                    // Ignore fallback errors
                }
            }
        }

        // Default coordinates if everything failed (New Delhi, India fallback)
        if (!lat || !lon) {
            lat = '28.6139';
            lon = '77.2090';
            locationName = 'New Delhi, India';
        }

        const cacheKey = `${lat}_${lon}`;
        if (cachedWeather && cachedWeather.key === cacheKey && Date.now() - cachedWeather.timestamp < CACHE_TTL_MS) {
            return NextResponse.json({ success: true, data: cachedWeather.data });
        }

        // 3. Fetch current weather from Open-Meteo
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&temperature_unit=celsius`;
        const weatherRes = await fetch(weatherUrl);

        if (!weatherRes.ok) {
            throw new Error(`Open-Meteo returned status ${weatherRes.status}`);
        }

        const weatherData = await weatherRes.json();
        const current = weatherData.current;

        // If locationName wasn't set yet, do reverse geocoding
        if (!locationName) {
            try {
                const revRes = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
                );
                if (revRes.ok) {
                    const revData = await revRes.json();
                    locationName = revData.locality || revData.city || revData.principalSubdivision || 'Local Area';
                }
            } catch {
                locationName = 'Current Location';
            }
        }

        const result = {
            temperature: Math.round(current.temperature_2m),
            description: getWeatherDescription(current.weather_code),
            weatherCode: current.weather_code,
            windSpeed: current.wind_speed_10m,
            humidity: current.relative_humidity_2m,
            isDay: current.is_day === 1,
            location: locationName,
            latitude: lat,
            longitude: lon
        };

        cachedWeather = {
            data: result,
            timestamp: Date.now(),
            key: cacheKey
        };

        return NextResponse.json({ success: true, data: result });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
