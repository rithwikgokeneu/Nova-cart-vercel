/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e6f0ec',
          100: '#b3d4c5',
          200: '#80b89e',
          500: '#005c3e',
          600: '#003d29',
          700: '#002e1e',
        },
        heading: '#231f1e',
        accent: { 500: '#f97316', 600: '#ea580c' },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        pill: '50px',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [],
}
