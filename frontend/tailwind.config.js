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
        bridal: {
          rose: '#B8737D',
          roseLight: '#C98A90',
          roseSoft: '#FCEEE9',
          rosePill: '#FFDADC',
          champagne: '#E6DAC8',
          charcoal: '#2C2523',
          warmGray: '#514344',
          subtleGray: '#847374',
          darkGray: '#695C4E',
          bgPage: '#FDFBF7',
          bgBlush: '#FFF7F5',
          bgReview: '#FAF6F0',
          bgFooter: '#FBF7F4',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
