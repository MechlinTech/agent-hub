import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#9333ea",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(30, 27, 75, 0.04), 0 8px 24px rgba(30, 27, 75, 0.06)",
        "card-hover":
          "0 4px 12px rgba(30, 27, 75, 0.06), 0 16px 40px rgba(30, 27, 75, 0.08)",
        float: "0 8px 32px rgba(109, 40, 217, 0.24), 0 2px 8px rgba(30, 27, 75, 0.06)",
        nav: "0 4px 24px rgba(30, 27, 75, 0.08), 0 1px 2px rgba(30, 27, 75, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
