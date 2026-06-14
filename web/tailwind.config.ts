import type { Config } from "tailwindcss";

// Design tokens follow the ui-ux-pro-max guidance: a calm, professional
// "AI-native dashboard" palette (navy ink + slate neutrals + a single accent),
// avoiding AI-purple gradients. WCAG AA contrast on text.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A1A",
        navy: "#1F3A5F",
        accent: "#2563EB",
        muted: "#565656",
        surface: "#F7F8FA",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
