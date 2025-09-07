import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/streamdown/dist/index.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist)', 'Inter', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Menlo', 'monospace'],
      },
      screens: {
        'toast-mobile': '600px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
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
        layer: {
          DEFAULT: '#9333ea', // purple-600
          foreground: '#c4b5fd', // purple-300
          background: '#f5f3ff', // purple-50
          darkBackground: 'rgba(76, 29, 149, 0.1)', // custom dark bg
        },
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            color: theme('colors.foreground'),
            a: {
              color: theme('colors.blue.600'),
              '&:hover': {
                color: theme('colors.blue.800'),
              },
            },
            strong: {
              color: theme('colors.purple.700'),
              fontWeight: theme('fontWeight.semibold'),
            },
            h3: {
              color: theme('colors.layer.DEFAULT'),
              fontWeight: theme('fontWeight.semibold'),
              borderLeft: `4px solid ${theme('colors.layer.foreground')}`,
              paddingLeft: '0.75rem',
              backgroundColor: theme('colors.layer.background'),
              borderRadius: theme('borderRadius.md'),
              marginTop: '1.5rem',
              marginBottom: '1rem',
            },
            code: {
              backgroundColor: theme('colors.muted.DEFAULT'),
              padding: '0.25rem 0.5rem',
              borderRadius: theme('borderRadius.sm'),
              fontSize: theme('fontSize.sm'),
              fontFamily: theme('fontFamily.mono').join(', '),
            },
            pre: {
              backgroundColor: theme('colors.zinc.900'),
              color: theme('colors.white'),
              padding: '1rem',
              borderRadius: theme('borderRadius.lg'),
              overflowX: 'auto',
            },
            ul: {
              paddingLeft: '1.5rem',
              listStyleType: 'disc',
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.foreground'),
            h3: {
              color: theme('colors.layer.foreground'),
              backgroundColor: theme('colors.layer.darkBackground'),
              borderLeftColor: theme('colors.layer.foreground'),
            },
            strong: {
              color: theme('colors.purple.300'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};

export default config;
