/**
 * Design tokens for Glen AI Demo
 * Minimal, clean color palette
 */

export const tokens = {
  colors: {
    // Primary teal accent
    teal: {
      light: "hsl(180 65% 45%)",
      DEFAULT: "hsl(180 65% 40%)",
      dark: "hsl(180 65% 35%)",
    },
    
    // Alternative blue-green
    blueGreen: {
      light: "hsl(175 55% 50%)",
      DEFAULT: "hsl(175 55% 45%)",
      dark: "hsl(175 55% 40%)",
    },
    
    // Text colors
    ink: {
      light: "hsl(220 15% 25%)",
      DEFAULT: "hsl(220 15% 20%)",
      dark: "hsl(220 15% 15%)",
    },
    
    // Muted/secondary text
    muted: {
      light: "hsl(220 10% 55%)",
      DEFAULT: "hsl(220 10% 50%)",
      dark: "hsl(220 10% 45%)",
    },
    
    // Surface backgrounds
    surface: {
      light: "hsl(0 0% 100%)",
      DEFAULT: "hsl(0 0% 98%)",
      dark: "hsl(220 15% 96%)",
    },
    
    // Alternative surface
    surfaceAlt: {
      light: "hsl(220 15% 98%)",
      DEFAULT: "hsl(220 15% 96%)",
      dark: "hsl(220 15% 94%)",
    },
  },
} as const;

