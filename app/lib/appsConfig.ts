import fs from 'fs';
import path from 'path';
import { AppsConfig } from '@/app/types/apps';
import { getIconComponent as getIconComponentFromUtils } from './iconUtils';

const APPS_CONFIG_PATH = path.join(process.cwd(), 'config/apps.json');
const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'config/default.json');

/**
 * Loads the apps configuration.
 * Priority: apps.json → default.json (apps section) → empty default
 */
export function loadAppsConfig(): AppsConfig {
    try {
        // If apps.json exists, use it
        if (fs.existsSync(APPS_CONFIG_PATH)) {
            const fileContent = fs.readFileSync(APPS_CONFIG_PATH, 'utf-8');
            const config = JSON.parse(fileContent) as AppsConfig;
            return resolveEnvVariables(config);
        }

        // Fall back to default.json → apps section
        if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
            const fileContent = fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8');
            const defaults = JSON.parse(fileContent);
            if (defaults.apps) {
                return resolveEnvVariables(defaults.apps as AppsConfig);
            }
        }

        // Ultimate fallback
        return getDefaultConfig();
    } catch (error) {
        console.error('Error loading apps config:', error);
        return getDefaultConfig();
    }
}

/**
 * Saves the apps configuration to apps.json (never writes to default.json)
 */
export function saveAppsConfig(config: AppsConfig): void {
    try {
        const fileContent = JSON.stringify(config, null, 2);
        fs.writeFileSync(APPS_CONFIG_PATH, fileContent, 'utf-8');
    } catch (error) {
        console.error('Error saving apps config:', error);
        throw new Error('Failed to save apps configuration');
    }
}

/**
 * Resolves environment variables in the configuration
 */
function resolveEnvVariables(config: AppsConfig): AppsConfig {
    return {
        ...config,
        categories: (config.categories || []).map(category => ({
            ...category,
            apps: category.apps.map(app => ({
                ...app,
                url: resolveEnvVar(app.url),
                healthCheckUrl: app.healthCheckUrl ? resolveEnvVar(app.healthCheckUrl) : undefined,
            })),
        })),
    };
}

/**
 * Resolves a single environment variable
 */
function resolveEnvVar(value: string): string {
    return value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        return process.env[varName] || `/unavailable?service=${varName}`;
    });
}

/**
 * Returns the default configuration
 */
function getDefaultConfig(): AppsConfig {
    return {
        categories: [],
    };
}

// Re-export from iconUtils to maintain backward compatibility if needed, 
// strictly speaking we should just remove it and update imports, but to be safe:

/**
 * Maps icon name to Lucide icon component
 * @deprecated Use app/lib/iconUtils.ts instead
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIconComponent(iconName: string): any {
    return getIconComponentFromUtils(iconName);
}
