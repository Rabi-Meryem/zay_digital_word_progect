/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1E3A5F', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#2D6A9F', foreground: '#FFFFFF' },
        accent: { DEFAULT: '#E8A020', foreground: '#FFFFFF' },
        success: '#27AE60',
        warning: '#E67E22',
        danger: '#C0392B',
      },
      fontFamily: { sans: ['Inter', 'Arial', 'sans-serif'] },
    }
  },
  plugins: [require('tailwindcss-animate')],
}
