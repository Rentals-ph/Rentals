/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'mobile': '478px',
        // Tailwind defaults:
        // 'sm': '640px',
        // 'md': '768px',
        // 'lg': '1024px',
        // 'xl': '1280px',
        // '2xl': '1536px',
      },
      fontFamily: {
        outfit: ['Outfit', 'Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      colors: {
        'rental-blue': {
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#205ED7', // Primary brand blue
          600: '#205ED7', // Primary brand blue
          700: '#1a4bb8',
          800: '#153a99',
          900: '#0f2a7a',
        },
        'rental-orange': {
          50: '#fff4e6',
          100: '#ffe0b3',
          200: '#ffcc80',
          300: '#ffb84d',
          400: '#ffa31a',
          500: '#FE8E0A', // Primary brand orange
          600: '#ff7700',
          700: '#cc6000',
          800: '#995400',
          900: '#663800',
        },
      },
      keyframes: {
        'partners-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'heroBackgroundAnimation': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        'slideInRight': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'chat-bubble-float': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-4px) scale(1.02)' },
        },
        'chat-bubble-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
      animation: {
        'partners-scroll': 'partners-scroll 18s linear infinite',
        'heroBackgroundAnimation': 'heroBackgroundAnimation 20s ease-in-out infinite',
        'slideInRight': 'slideInRight 0.3s ease-out',
        'chat-bubble-float': 'chat-bubble-float 2s ease-in-out infinite',
        'chat-bubble-pulse': 'chat-bubble-pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

