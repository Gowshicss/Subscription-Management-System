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
          DEFAULT: '#5E3A54',
          deep: '#5E3A54',
          light: '#724867',
          dark: '#4B2D43',
        },
        purple: {
          odoo: '#79516F',
          muted: '#79516F',
          light: '#916586',
        },
        teal: {
          soft: '#E8F6F7',
          accent: '#259DA5',
          dark: '#1C7980',
        },
        charcoal: {
          DEFAULT: '#1F1E22',
          light: '#3C3942',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#FAF9F6',
          muted: '#F4F3F1',
        },
        border: {
          DEFAULT: '#E7E5E4',
          subtle: '#F0EFF1',
          dark: '#D6D3D1',
        },
        muted: {
          DEFAULT: '#737078',
          foreground: '#737078',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        brutal: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
        'brutal-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'brutal-lg': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

