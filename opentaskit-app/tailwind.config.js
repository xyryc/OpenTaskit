/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0094F7',
          dark: '#0072C4',
          deep: '#071C33',
          tint: '#E6F4FE',
          soft: '#CCE8FD',
        },
        ink: {
          DEFAULT: '#0C1417',
          800: '#18242A',
          700: '#2B3A41',
          500: '#5B6A72',
          400: '#8A959B',
          300: '#B9C2C7',
          200: '#E2E7E9',
          100: '#F0F3F4',
        },
        canvas: '#F4F6F7',
        success: '#0F8A5F',
        warning: '#B4690E',
        danger: '#C7382F',
        info: '#1D5FD8',
        gold: '#E0A400',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      fontFamily: {
        geist: ["Geist-Regular", "sans-serif"],
        "geist-medium": ["Geist-Medium", "sans-serif"],
        "geist-semibold": ["Geist-SemiBold", "sans-serif"],
        "geist-bold": ["Geist-Bold", "sans-serif"],
        "geist-mono": ["GeistMono-Regular", "monospace"],
        "geist-mono-medium": ["GeistMono-Medium", "monospace"],
        "geist-mono-semibold": ["GeistMono-SemiBold", "monospace"],
        "geist-mono-bold": ["GeistMono-Bold", "monospace"],
        sans: ["Geist-Regular", "sans-serif"],
        heading: ["Geist-Bold", "sans-serif"],
        mono: ["GeistMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
}