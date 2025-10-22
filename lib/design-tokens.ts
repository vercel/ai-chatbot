/**
 * Design Tokens
 * Central source for design system values.
 * These map to CSS variables defined in globals.css
 */

export const colors = {
  // Glen AI brand colors
  glen: {
    teal: "hsl(180 65% 40%)",
    tealDark: "hsl(180 70% 30%)",
    blueGreen: "hsl(175 55% 45%)",
    ink: "hsl(220 15% 20%)",
    mutedText: "hsl(220 10% 50%)",
    surface: "hsl(0 0% 98%)",
    surfaceAlt: "hsl(220 15% 96%)",
  },

  // Transcarent-inspired colors
  transcarent: {
    blue: "hsl(245 60% 55%)",
    blueDark: "hsl(245 60% 48%)",
    blueLight: "hsl(245 60% 62%)",
    gold: "hsl(30 80% 65%)",
    goldDark: "hsl(30 80% 58%)",
    goldLight: "hsl(35 85% 68%)",
  },

  // Accent colors
  accent: {
    cyan: "hsl(195 70% 60%)",
    indigo: "hsl(245 60% 70%)",
  },

  // Semantic colors
  semantic: {
    success: "hsl(142 76% 36%)",
    warning: "hsl(38 92% 50%)",
    error: "hsl(0 84% 60%)",
    info: "hsl(199 89% 48%)",
  },
} as const;

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
} as const;

export const borderRadius = {
  sm: "0.375rem", // 6px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  "2xl": "1.5rem", // 24px
  "3xl": "2rem", // 32px
  full: "9999px",
} as const;

export const typography = {
  fontFamily: {
    sans: "var(--font-geist)",
    mono: "var(--font-geist-mono)",
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "0.9375rem", // 15px
    md: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
} as const;

export const animation = {
  duration: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
  easing: {
    // Smooth, polished easing for Transcarent-like feel
    default: "cubic-bezier(0.23, 1, 0.32, 1)",
    bounce: "cubic-bezier(0.22, 1, 0.36, 1)",
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
} as const;

// Utility function to get nested token values
export function getToken<T extends Record<string, any>>(
  obj: T,
  path: string
): string {
  return path.split(".").reduce((acc, part) => acc?.[part], obj as any) || "";
}

// Convenience functions
export const getColor = (path: string) => getToken(colors, path);
export const getSpacing = (key: keyof typeof spacing) => spacing[key];
export const getRadius = (key: keyof typeof borderRadius) => borderRadius[key];
export const getFontSize = (key: keyof typeof typography.fontSize) =>
  typography.fontSize[key];
