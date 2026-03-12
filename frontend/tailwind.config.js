/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        night: {
          950: '#060810',
          900: '#0c1020',
          800: '#131826',
          700: '#1a2035',
          600: '#232b45',
        },
        electric: {
          400: '#4fffb0',
          500: '#00e87a',
          600: '#00c96b',
        },
        crimson: {
          400: '#ff4d6d',
          500: '#e63950',
          600: '#c82d42',
        },
        amber: {
          400: '#ffb547',
          500: '#f59e0b',
        },
        ice: {
          400: '#7dd3fc',
          500: '#38bdf8',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        blink: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
        slideIn: { from: { transform: 'translateY(-8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      }
    }
  },
  plugins: []
}
