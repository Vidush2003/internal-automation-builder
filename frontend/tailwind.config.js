/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // App backgrounds
        background: "#0a0a0f", // Deep dark background
        "background-light": "#FAFAFA", // Light mode background
        
        // Semantic colors
        primary: {
          DEFAULT: "#ff4a00",
          hover: "#e04200",
          light: "rgba(255, 74, 0, 0.1)",
        },
        success: {
          DEFAULT: "#10b981",
          light: "rgba(16, 185, 129, 0.1)",
        },
        error: {
          DEFAULT: "#f43f5e",
          light: "rgba(244, 63, 94, 0.1)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "rgba(245, 158, 11, 0.1)",
        },
        info: {
          DEFAULT: "#3b82f6",
          light: "rgba(59, 130, 246, 0.1)",
        }
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        'premium': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'premium-dark': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(255, 74, 0, 0.15)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
