import type { Config } from 'tailwindcss';

const config: Config = {
  // Mobile-First Sticky Hover Fix: prevents sticky active state on touch devices
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Corporate Ultra-Clean Color Tokens
        surface: '#FCFCFC',
        'surface-elevated': '#FFFFFF',
        ink: '#09090B',
        'ink-muted': '#71717A',
        primary: '#09090B', // Jet Black
        'accent-blue': '#0066CC', // Deep Apple Blue
        'ios-gray': '#F2F2F7', // Subtle Pill/Glass Accent
        'border-subtle': 'rgba(0, 0, 0, 0.04)',
        background: '#FCFCFC',
        secondary: '#71717A',
        accent: '#0066CC',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        'serif-italic': ['var(--font-instrument-serif)', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        eyebrow: '0.15em',
      },
      lineHeight: {
        relaxed: '1.65',
      },
      fontSize: {
        // Fluid typography clamp scaling between 320px and 1920px viewports
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.85rem, 1vw, 1rem)',
        'fluid-base': 'clamp(0.95rem, 1.2vw, 1.125rem)',
        'fluid-lg': 'clamp(1.15rem, 1.8vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 2vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.35rem, 2.5vw, 2rem)',
        'fluid-3xl': 'clamp(1.75rem, 3.5vw, 2.75rem)',
        'fluid-4xl': 'clamp(2rem, 4vw, 3.5rem)',
        'fluid-hero': 'clamp(2.5rem, 5vw, 5rem)',
      },
      backgroundImage: {
        'accent-cta': 'linear-gradient(180deg, #09090B 0%, #18181B 100%)',
        'blue-glow': 'radial-gradient(circle, rgba(0, 102, 204, 0.15) 0%, rgba(252, 252, 252, 0) 70%)',
      },
      height: {
        dvh: '100dvh',
        screen: '100dvh',
      },
      minHeight: {
        dvh: '100dvh',
        screen: '100dvh',
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
};

export default config;
