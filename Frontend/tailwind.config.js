/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9', // Core cyan accent
          900: '#0c4a6e',
        },
        clinical: {
          red: '#ef4444',    // Immediate RED triage flag
          orange: '#f97316', // ORANGE triage flag
          yellow: '#eab308', // YELLOW triage flag
          green: '#22c55e',  // Standard GREEN triage flag
        }
      }
    },
  },
  plugins: [],
}
