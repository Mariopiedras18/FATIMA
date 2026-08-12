/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      colors: {
        espresso: {
          50: '#F9F6F0',
          100: '#F3ECE0',
          200: '#E5D6C0',
          300: '#D2B998',
          400: '#BD966F',
          500: '#A66E38',
          600: '#8C5A32',
          700: '#6C4325',
          800: '#4A2E1A',
          900: '#3D2314',
          950: '#23130A',
        },
        primary: {
          50: '#F9F6F0',
          100: '#F3ECE0',
          200: '#E5D6C0',
          300: '#D2B998',
          400: '#BD966F',
          500: '#A66E38',
          600: '#8C5A32',
          700: '#6C4325',
          800: '#4A2E1A',
          900: '#3D2314',
          950: '#23130A',
        }
      }
    },
  },
  plugins: [],
}