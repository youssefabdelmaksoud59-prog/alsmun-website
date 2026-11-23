import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 50: "#eef4fb", 100: "#d7e4f4", 200: "#adc7e8", 300: "#7aa4d8", 400: "#4a80c4", 500: "#2763ab", 600: "#1b4e8c", 700: "#163f72", 800: "#11305a", 900: "#0b1f3d", 950: "#071429" },
        sky: { 50: "#eff8fd", 100: "#d9eefa", 200: "#b3ddf4", 300: "#7fc6ec", 400: "#4aaee2", 500: "#2894d0", 600: "#1a77ad" },
        gold: { 50: "#fffbea", 100: "#fff3c4", 200: "#ffe78a", 300: "#ffd84d", 400: "#fbc81f", 500: "#efb30a", 600: "#cc8a04", 700: "#a26207", 800: "#844d0d" },
        ink: "#0b0f17",
      },
      fontFamily: {
        sans: ["'Inter Variable'", "Inter", "system-ui", "sans-serif"],
        display: ["Cinzel", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,31,61,.06), 0 4px 16px -4px rgba(11,31,61,.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
