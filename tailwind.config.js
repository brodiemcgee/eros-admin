/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6B2E5F',
        secondary: '#1C7C7C',
      },
    },
  },
  plugins: [],
}
