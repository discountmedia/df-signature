import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        df: {
          black: "#000000",
          red: "#E71D2C",
          green: "#3FCB3F",
          cyan: "#3CCFC8",
          orange: "#F26B1F",
          yellow: "#FFD200",
        },
      },
      fontFamily: {
        anton: ["var(--font-anton)", "Impact", "sans-serif"],
        sans: ["var(--font-open-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
