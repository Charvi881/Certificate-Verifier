/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#edfff9", 100: "#d5fff3", 200: "#aefee8",
          300: "#70fbda", 400: "#2bf0c6", 500: "#00e6b4",
          600: "#00b890", 700: "#009274", 800: "#00735e",
          900: "#005f4e",
        },
        dark: {
          50: "#e8f0fe", 100: "#c2d4f8", 200: "#9ab5f2",
          300: "#6b90e8", 400: "#4070d8",
          900: "#060b14", 800: "#0c1220", 700: "#111929",
          600: "#182035", 500: "#1e2a42",
        }
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        mono:    ["'DM Mono'", "monospace"],
        body:    ["'DM Sans'", "sans-serif"],
      },
      animation: {
        "fade-up":   "fadeUp 0.5s ease both",
        "fade-in":   "fadeIn 0.4s ease both",
        "pulse-slow":"pulse 3s ease infinite",
        "spin-slow": "spin 3s linear infinite",
        "glow":      "glow 2s ease infinite",
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        glow:    { "0%,100%": { boxShadow: "0 0 20px rgba(0,230,180,0.3)" }, "50%": { boxShadow: "0 0 40px rgba(0,230,180,0.6)" } },
      }
    }
  },
  plugins: []
};
