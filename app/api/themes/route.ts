import { NextResponse } from 'next/server';
import { loadThemesConfig, saveThemesConfig } from '@/app/lib/themesConfig';
import { THEMES } from '@/app/lib/themes';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const config = loadThemesConfig();
        return NextResponse.json({
            success: true,
            presets: THEMES,
            customThemes: config.customThemes || {},
            activeTheme: config.activeTheme || 'deepSpace'
        });
    } catch (error) {
        console.error('Error loading themes:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load themes' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const current = loadThemesConfig();

        const updated = {
            activeTheme: body.activeTheme ?? current.activeTheme,
            customThemes: body.customThemes ?? current.customThemes
        };

        saveThemesConfig(updated);

        return NextResponse.json({
            success: true,
            activeTheme: updated.activeTheme,
            customThemes: updated.customThemes
        });
    } catch (error) {
        console.error('Error saving themes:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save themes' },
            { status: 500 }
        );
    }
}
