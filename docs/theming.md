# Theming System Architecture

NexLab Dashboard utilizes a decoupled, single-file color token architecture designed for theme customization without modifying individual UI components.

---

## 1. Overview & Standard

Similar to other homelab systems like Homarr, Dashy, and Flame, NexLab uses standard CSS custom properties (variables) defined at the root level and mapped into Tailwind CSS v4's `@theme` block.

### Core Semantic Tokens

Each theme defines the following 8 semantic tokens:

| Token | Variable | Role |
| :--- | :--- | :--- |
| **`background`** | `--background` | Main page canvas background color |
| **`foreground`** | `--foreground` | Primary text and high-contrast typography |
| **`surface`** | `--surface` | Widget cards, sidebar, modal background containers |
| **`surfaceHighlight`** | `--surface-highlight` | Hover states, active pill backgrounds, tab selectors |
| **`primary`** | `--primary` | Main accent color (active icons, buttons, glowing borders) |
| **`secondary`** | `--secondary` | Complementary accent (gradients, badges, secondary highlights) |
| **`glass`** | `--glass` | Translucent overlay color for glassmorphism panels |
| **`border`** | `--border` | Subtle panel and card divider borders |

---

## 2. Defining Themes (`app/lib/themes.ts`)

Themes are stored in a centralized dictionary at [`app/lib/themes.ts`](file:///home/chaitanyadhiman/Documents/homelab-web/homelab-web/app/lib/themes.ts).

```typescript
export interface ThemeColors {
    name: string;
    description: string;
    colors: {
        background: string;
        foreground: string;
        surface: string;
        surfaceHighlight: string;
        primary: string;
        secondary: string;
        glass: string;
        border: string;
    };
    gradient?: string; // Optional body background gradient
}
```

### Pre-Configured Themes

The dashboard includes pre-configured palettes:
1. **Deep Space** (Default Neon Cyan & Violet on cosmic navy/black)
2. **Dracula** (Gothic dark purple, pink, and muted slate)
3. **Catppuccin Macchiato** (Soft lavender and sapphire pastel tones)
4. **Nord** (Arctic frost cyan and clean muted slate)
5. **Tokyo Night** (Vibrant neon blue and magenta over midnight navy)
6. **Cyberpunk 2077** (High-contrast electric yellow and cyan)

---

## 3. How to Add a New Theme

To add a new theme, add an entry to the `THEMES` object in [`app/lib/themes.ts`](file:///home/chaitanyadhiman/Documents/homelab-web/homelab-web/app/lib/themes.ts):

```typescript
emeraldForest: {
    name: "Emerald Forest",
    description: "Deep jungle greens and vibrant mint accents",
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
}
```

No UI components or CSS files need to be edited. The theme becomes immediately available to the theme switcher and persists across browser sessions.
