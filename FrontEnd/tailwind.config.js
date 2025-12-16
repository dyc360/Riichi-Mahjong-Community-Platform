import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 启用类模式的深色模式
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#4f46e5',
          400: '#6366f1',
          300: '#818cf8'
        }
      },
    },
  },
  plugins: [
    typography,
  ],
}