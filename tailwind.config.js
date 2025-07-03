/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // Add this line if not already present
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // Add this line for your components folder
  ],
  theme: {
    extend: {
      animation: {
        // Defines a slow, pulsing blob animation
        blob: 'blob 7s infinite',
        // Defines a slow bounce animation
        'bounce-slow': 'bounce 2s infinite',
        // Defines a fade-in animation
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        // Keyframes for the blob animation
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        // Keyframes for the fade-in animation
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
