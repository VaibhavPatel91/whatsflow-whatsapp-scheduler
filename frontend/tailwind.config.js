/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          light: '#25D366',
          DEFAULT: '#075E54',
          dark: '#128C7E',
          teal: '#00a884',
          bg: '#111b21',
          panel: '#202c33'
        }
      }
    }
  },
  plugins: []
};
