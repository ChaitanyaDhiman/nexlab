/**
 * NexLab Dashboard Theme System (Proof of Concept)
 * 
 * Standardized theme definitions following Homarr/Dashy architecture.
 * Updating or adding a theme here provides the color tokens for the whole UI.
 */

export interface ThemeColors {
    name: string;
    description: string;
    colors: {
        background: string;         // Main canvas background
        foreground: string;         // Primary text
        surface: string;            // Card and widget background
        surfaceHighlight: string;   // Hover states, active pill backgrounds
        primary: string;            // Main accent (buttons, icons, highlights)
        secondary: string;          // Secondary accent (gradients, badges)
        glass: string;              // Translucent overlay (rgba)
        border: string;             // Card and panel borders (rgba)
    };
    gradient?: string;              // Atmospheric background gradient
}

export const THEMES: Record<string, ThemeColors> = {
    deepSpace: {
        name: "Deep Space",
        description: "Neon Cyan & Violet on deep cosmic black",
        colors: {
            background: "#050510",
            foreground: "#e0e0e0",
            surface: "#0f0f1f",
            surfaceHighlight: "#1a1a2e",
            primary: "#00f0ff",
            secondary: "#bd00ff",
            glass: "rgba(255, 255, 255, 0.05)",
            border: "rgba(255, 255, 255, 0.08)"
        },
        gradient: "radial-gradient(circle at 10% 20%, rgba(189, 0, 255, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(0, 240, 255, 0.1) 0%, transparent 20%), radial-gradient(ellipse at top, rgba(15, 23, 42, 0.8), #0f0f1f, #000000)"
    },

    dracula: {
        name: "Dracula",
        description: "Classic gothic dark palette with purple & pink accents",
        colors: {
            background: "#21222c",
            foreground: "#f8f8f2",
            surface: "#282a36",
            surfaceHighlight: "#44475a",
            primary: "#bd93f9",
            secondary: "#ff79c6",
            glass: "rgba(255, 255, 255, 0.04)",
            border: "rgba(189, 147, 249, 0.15)"
        },
        gradient: "radial-gradient(circle at 10% 20%, rgba(189, 147, 249, 0.12) 0%, transparent 40%), #21222c"
    },

    catppuccin: {
        name: "Catppuccin Macchiato",
        description: "Soothing pastel lavender and sapphire tones",
        colors: {
            background: "#181926",
            foreground: "#cad3f5",
            surface: "#24273a",
            surfaceHighlight: "#363a4f",
            primary: "#b7bdf8",
            secondary: "#8aadf4",
            glass: "rgba(255, 255, 255, 0.04)",
            border: "rgba(183, 189, 248, 0.12)"
        },
        gradient: "radial-gradient(circle at 80% 20%, rgba(138, 173, 244, 0.1) 0%, transparent 40%), #181926"
    },

    nord: {
        name: "Nord",
        description: "Arctic frost blue and clean muted slate",
        colors: {
            background: "#2e3440",
            foreground: "#eceff4",
            surface: "#3b4252",
            surfaceHighlight: "#434c5e",
            primary: "#88c0d0",
            secondary: "#81a1c1",
            glass: "rgba(255, 255, 255, 0.04)",
            border: "rgba(136, 192, 208, 0.15)"
        },
        gradient: "radial-gradient(circle at 50% 0%, rgba(136, 192, 208, 0.12) 0%, transparent 60%), #2e3440"
    },

    tokyoNight: {
        name: "Tokyo Night",
        description: "Vibrant neon blue and magenta over midnight navy",
        colors: {
            background: "#16161e",
            foreground: "#c0caf5",
            surface: "#1a1b26",
            surfaceHighlight: "#24283b",
            primary: "#7aa2f7",
            secondary: "#bb9af7",
            glass: "rgba(255, 255, 255, 0.03)",
            border: "rgba(122, 162, 247, 0.15)"
        },
        gradient: "radial-gradient(circle at 20% 80%, rgba(187, 154, 247, 0.1) 0%, transparent 40%), #16161e"
    },

    cyberpunk: {
        name: "Cyberpunk 2077",
        description: "High-contrast electric yellow and cyan",
        colors: {
            background: "#08080a",
            foreground: "#eaeaea",
            surface: "#121217",
            surfaceHighlight: "#1f1f29",
            primary: "#fcee0a",
            secondary: "#00f0ff",
            glass: "rgba(252, 238, 10, 0.04)",
            border: "rgba(252, 238, 10, 0.2)"
        },
        gradient: "radial-gradient(ellipse at top, rgba(252, 238, 10, 0.08), #121217, #08080a)"
    },

    emeraldForest: {
        name: "Emerald Forest",
        description: "Deep organic greens and vibrant mint accents",
        colors: {
            background: "#0a140f",
            foreground: "#d8f3dc",
            surface: "#12251b",
            surfaceHighlight: "#1b3829",
            primary: "#52b788",
            secondary: "#74c69d",
            glass: "rgba(255, 255, 255, 0.04)",
            border: "rgba(82, 183, 136, 0.15)"
        },
        gradient: "radial-gradient(circle at 50% 0%, rgba(82, 183, 136, 0.1) 0%, transparent 60%), #0a140f"
    },

    light: {
        name: "Clean Light",
        description: "Crisp white canvas with indigo and violet accents",
        colors: {
            background: "#f8fafc",
            foreground: "#0f172a",
            surface: "#ffffff",
            surfaceHighlight: "#f1f5f9",
            primary: "#4f46e5",
            secondary: "#8b5cf6",
            glass: "rgba(255, 255, 255, 0.9)",
            border: "rgba(15, 23, 42, 0.08)"
        },
        gradient: "radial-gradient(at top left, #dbeafe, #ddd6fe, #e5e7eb)"
    }
};

/**
 * Helper to apply a theme dynamically by writing to document root CSS variables.
 * Can accept either a registered theme key (from presets or custom) or a direct ThemeColors object.
 */
export function applyTheme(themeOrKey: string | ThemeColors, customThemes?: Record<string, ThemeColors>) {
    if (typeof window === 'undefined') return;

    let theme: ThemeColors;
    if (typeof themeOrKey === 'string') {
        theme = customThemes?.[themeOrKey] || THEMES[themeOrKey] || THEMES.deepSpace;
        localStorage.setItem('homelab_theme', themeOrKey);
    } else {
        theme = themeOrKey;
    }

    const root = document.documentElement;

    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    root.style.setProperty('--surface', theme.colors.surface);
    root.style.setProperty('--surface-highlight', theme.colors.surfaceHighlight);
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--glass', theme.colors.glass);
    root.style.setProperty('--border', theme.colors.border);

    // Light vs dark class management
    const isLight = theme.name.toLowerCase().includes('light') || 
                    theme.colors.background.toLowerCase() === '#ffffff' || 
                    theme.colors.background.toLowerCase() === '#f8fafc';

    if (isLight) {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
    } else {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
    }

    if (theme.gradient) {
        document.body.style.backgroundImage = theme.gradient;
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = theme.colors.background;
    }
}
