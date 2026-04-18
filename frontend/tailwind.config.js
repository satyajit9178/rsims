/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'Outfit'", "sans-serif"],
        mono:    ["'IBM Plex Mono'", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0d0f14",
          900: "#0d0f14",
          800: "#141720",
          700: "#1c1f2e",
          600: "#252a3a",
          500: "#2f3547"
        },
        amber: {
          DEFAULT: "#f59e0b",
          dim:  "#d97706",
          glow: "#fbbf24"
        },
        slate2: {
          DEFAULT: "#94a3b8",
          dim:    "#64748b",
          bright: "#cbd5e1"
        },
        good: "#22c55e",
        bad:  "#ef4444",
        warn: "#f59e0b",
        info: "#38bdf8",
      },
      boxShadow: {
        amber: "0 0 20px rgba(245,158,11,0.15)",
        card:  "0 2px 16px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};