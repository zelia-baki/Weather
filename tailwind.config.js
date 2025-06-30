/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse-slower': 'spin-reverse 12s linear infinite',
        'ping-fast': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ping-delay': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s',
        'ping-delay-2': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 1s',
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
      },
    }
    ,
  },
  plugins: [],
}