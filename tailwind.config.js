/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./constants.ts",
    "./types.ts"
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#dae3fd',
          300: '#bccafb',
          400: '#95a9f7',
          500: '#6d82f1',
          600: '#4e5ee6',
          700: '#3e49d2',
          800: '#383eab',
          900: '#313888',
        },
      },
    },
  },
  plugins: [],
}