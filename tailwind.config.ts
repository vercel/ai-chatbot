import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      sans: ['geist'],
      mono: ['geist-mono'],
    },
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Custom nature-inspired color palette
        hunter_green: {
          DEFAULT: '#386641',
          100: '#0b140d',
          200: '#16291a',
          300: '#223d27',
          400: '#2d5234',
          500: '#386641',
          600: '#51935e',
          700: '#77b483',
          800: '#a4cdac',
          900: '#d2e6d6',
        },
        asparagus: {
          DEFAULT: '#6a994e',
          100: '#151e10',
          200: '#2a3d1f',
          300: '#3f5b2f',
          400: '#54793e',
          500: '#6a994e',
          600: '#85b36b',
          700: '#a4c690',
          800: '#c2d9b5',
          900: '#e1ecda',
        },
        cornsilk: {
          DEFAULT: '#fefae0',
          100: '#5d5103',
          200: '#baa206',
          300: '#f8dc27',
          400: '#fbeb84',
          500: '#fefae0',
          600: '#fefbe7',
          700: '#fefced',
          800: '#fffdf3',
          900: '#fffef9',
        },
        earth_yellow: {
          DEFAULT: '#dda15e',
          100: '#34210b',
          200: '#684216',
          300: '#9d6321',
          400: '#d1842c',
          500: '#dda15e',
          600: '#e4b57f',
          700: '#ebc79f',
          800: '#f1dabf',
          900: '#f8ecdf',
        },
        tigers_eye: {
          DEFAULT: '#bc6c25',
          100: '#251507',
          200: '#4b2b0f',
          300: '#704016',
          400: '#96561e',
          500: '#bc6c25',
          600: '#d98840',
          700: '#e3a570',
          800: '#ecc3a0',
          900: '#f6e1cf',
        },

        // Theme UI colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
export default config;