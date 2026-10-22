/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#05BFDB'
        },
        secondary: {
          DEFAULT: '#088395'
        },
        tertiary: {
          DEFAULT: '#00FFCA'
        },
        quaternary: {
          DEFAULT: '#0A4D68'
        }
      }
    }
  },
  plugins: []
}
