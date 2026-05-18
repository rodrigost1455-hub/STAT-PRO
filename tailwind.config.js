/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Core backgrounds — layered depth system
        bg: {
          base:    '#050810',
          deep:    '#060A14',
          surface: '#0B1220',
          panel:   '#0F1829',
          card:    '#111D33',
          card2:   '#152038',
          hover:   '#1A2840',
        },
        // Border hierarchy
        border: {
          dim:    '#152038',
          base:   '#1C2E50',
          mid:    '#243858',
          bright: '#2E4870',
        },
        // Accent — cyan/blue system
        accent: {
          DEFAULT: '#00B4D8',
          dim:     '#0089A8',
          bright:  '#00D4FF',
          glow:    '#4DE0FF',
          muted:   'rgba(0,180,216,0.15)',
        },
        // Status semantics
        pass: {
          DEFAULT: '#00E5A0',
          dim:     '#00B87A',
          bg:      'rgba(0,229,160,0.06)',
          border:  'rgba(0,229,160,0.25)',
        },
        fail: {
          DEFAULT: '#FF3B5C',
          dim:     '#CC2243',
          bg:      'rgba(255,59,92,0.06)',
          border:  'rgba(255,59,92,0.25)',
        },
        warn: {
          DEFAULT: '#FFB800',
          dim:     '#CC8F00',
          bg:      'rgba(255,184,0,0.06)',
          border:  'rgba(255,184,0,0.25)',
        },
        info: {
          DEFAULT: '#60A5FA',
          bg:      'rgba(96,165,250,0.08)',
          border:  'rgba(96,165,250,0.2)',
        },
        // Text hierarchy
        tx: {
          primary:   '#E2E8F0',
          secondary: '#94A3B8',
          muted:     '#475569',
          dim:       '#2D3F5A',
        },
      },
      spacing: {
        // Consistent spatial scale for engineering density
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '68':  '17rem',
        '76':  '19rem',
        '84':  '21rem',
        '88':  '22rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.1em' }],
        'xs':  ['0.75rem',  { lineHeight: '1rem' }],
        'sm':  ['0.8125rem',{ lineHeight: '1.25rem' }],
      },
      borderRadius: {
        'sm':  '4px',
        'md':  '6px',
        'lg':  '10px',
        'xl':  '14px',
        '2xl': '18px',
      },
      boxShadow: {
        'card':    '0 2px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        'glow-sm': '0 0 12px rgba(0,180,216,0.2)',
        'glow':    '0 0 24px rgba(0,180,216,0.15)',
        'pass':    '0 0 16px rgba(0,229,160,0.08)',
        'fail':    '0 0 16px rgba(255,59,92,0.08)',
        'warn':    '0 0 16px rgba(255,184,0,0.08)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'grid-dark': 'linear-gradient(rgba(28,46,80,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(28,46,80,0.3) 1px, transparent 1px)',
        'noise':     "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.03'/%3E%3C/svg%3E\")",
        'panel-gradient': 'linear-gradient(135deg, rgba(0,180,216,0.03) 0%, transparent 50%)',
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
      animation: {
        'fade-up':       'fadeUp 0.35s ease both',
        'fade-in':       'fadeIn 0.25s ease both',
        'slide-in-r':    'slideInRight 0.25s ease both',
        'count-up':      'countUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-border':  'pulseBorder 2s ease-in-out infinite',
        'shimmer':       'shimmer 1.8s linear infinite',
        'spin-slow':     'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp:       { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        fadeIn:       { from: { opacity: '0' },                                to: { opacity: '1' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'none' } },
        countUp:      { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        pulseBorder:  { '0%,100%': { borderColor: 'rgba(0,180,216,0.3)' }, '50%': { borderColor: 'rgba(0,212,255,0.7)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      transitionDuration: { DEFAULT: '200ms' },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
