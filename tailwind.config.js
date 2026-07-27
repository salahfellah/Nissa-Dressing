/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orDore: '#C8A96A',
        beigeClair: '#F6F1E8',
        sable: '#E8E1D6',
        taupe: '#B8ADA0',
        brunProfond: '#4A4136',
        noirIntense: '#111111',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
