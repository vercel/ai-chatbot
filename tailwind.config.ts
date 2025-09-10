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
                        sans: [
                                'var(--font-geist-sans)',
                                'var(--font-sans)'
                        ],
                        mono: [
                                'var(--font-geist-mono)',
                                'var(--font-mono)'
                        ]
                },
  		screens: {
  			'toast-mobile': '600px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			'bg-primary': 'var(--bg-primary)',
  			'bg-elevated': 'var(--bg-elevated)',
  			'border-default': 'var(--border-default)',
  			'border-hover': 'var(--border-hover)',
  			'border-active': 'var(--border-active)',
  			'text-primary': 'var(--text-primary)',
  			'text-secondary': 'var(--text-secondary)',
  			'text-muted': 'var(--text-muted)',
  			'brand-grad-from': 'var(--brand-grad-from)',
  			'brand-grad-mid': 'var(--brand-grad-mid)',
  			'brand-grad-to': 'var(--brand-grad-to)',
  			error: 'var(--error)',
  			success: 'var(--success)',
  			solar: {
  				50: 'hsl(45 100% 97%)',
  				100: 'hsl(45 100% 92%)',
  				200: 'hsl(45 100% 82%)',
  				300: 'hsl(45 100% 72%)',
  				400: 'hsl(45 100% 62%)',
  				500: 'hsl(27 100% 50%)',
  				600: 'hsl(27 100% 40%)',
  				700: 'hsl(27 100% 30%)',
  				800: 'hsl(27 100% 20%)',
  				900: 'hsl(27 100% 10%)',
  			},
  			eco: {
  				50: 'hsl(142 76% 95%)',
  				100: 'hsl(142 76% 88%)',
  				200: 'hsl(142 76% 78%)',
  				300: 'hsl(142 76% 68%)',
  				400: 'hsl(142 76% 58%)',
  				500: 'hsl(142 76% 48%)',
  				600: 'hsl(142 76% 38%)',
  				700: 'hsl(142 76% 28%)',
  				800: 'hsl(142 76% 18%)',
  				900: 'hsl(142 76% 8%)',
  			},
  		},
  		backgroundImage: {
  			solar: 'linear-gradient(135deg,var(--brand-grad-from),var(--brand-grad-mid) 50%,var(--brand-grad-to))'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
export default config;
