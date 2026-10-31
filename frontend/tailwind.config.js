/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          DEFAULT: '#4B2D47',
          deep: '#4B2D47',
          light: '#5D3858',
          dark: '#382235',
        },
        purple: {
          odoo: '#79516F',
          muted: '#79516F',
          light: '#916586',
        },
        teal: {
          soft: '#CDECEF',
          accent: '#259DA5',
          dark: '#1C7980',
        },
        charcoal: {
          DEFAULT: '#252329',
          light: '#3C3942',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F4F4F5',
        },
        border: {
          DEFAULT: '#E4E1E5',
          subtle: '#ECE9ED',
          dark: '#CBC6CC',
        },
        muted: {
          DEFAULT: '#77727A',
          foreground: '#77727A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        brutal: '2px 2px 0px 0px rgba(75, 45, 71, 0.15)',
        'brutal-sm': '1px 1px 0px 0px rgba(75, 45, 71, 0.1)',
        'brutal-lg': '4px 4px 0px 0px rgba(75, 45, 71, 0.2)',
      },
    },
  },
  plugins: [],
}
