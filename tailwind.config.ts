import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
        income: "var(--income)",
        expense: "var(--expense)",
        transfer: "var(--transfer)",
      },
      fontFamily: {
        sans: ["Sora", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
