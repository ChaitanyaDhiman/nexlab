import fs from 'fs';
import path from 'path';
import { ThemeColors } from './themes';

const THEMES_CONFIG_PATH = path.join(process.cwd(), 'config/themes.json');

export interface ThemesConfigFile {
    activeTheme: string;
    customThemes: Record<string, ThemeColors>;
}

export function loadThemesConfig(): ThemesConfigFile {
    try {
        if (fs.existsSync(THEMES_CONFIG_PATH)) {
            const raw = fs.readFileSync(THEMES_CONFIG_PATH, 'utf-8');
            const parsed = JSON.parse(raw);
            return {
                activeTheme: parsed.activeTheme || 'deepSpace',
                customThemes: parsed.customThemes || {}
            };
        }
    } catch (e) {
        console.error('Failed to read config/themes.json:', e);
    }

    return {
        activeTheme: 'deepSpace',
        customThemes: {}
    };
}

export function saveThemesConfig(data: ThemesConfigFile): void {
    try {
        const dir = path.dirname(THEMES_CONFIG_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(THEMES_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Failed to save config/themes.json:', e);
        throw new Error('Failed to save themes configuration');
    }
}
