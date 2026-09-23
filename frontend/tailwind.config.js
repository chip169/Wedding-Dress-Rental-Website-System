/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Tắt preflight của Tailwind để tránh xung đột với Ant Design CSS reset
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        wedding: {
          primary: '#B76E79',     // Rose gold
          primaryHover: '#9F5560',
          secondary: '#D4AF37',   // Champagne Gold
          accent: '#E0A96D',
          dark: '#2C3E50',
          light: '#FFF9F5',
          cream: '#FAF7F2',
          border: '#E8DFD8',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
