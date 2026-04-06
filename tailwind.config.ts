import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8eccff",
          400: "#59aeff",
          500: "#338bfc",
          600: "#1d6cf1",
          700: "#1555de",
          800: "#1847b4",
          900: "#193f8d",
          950: "#142856",
        },
      },
    },
  },
  plugins: [],
};
export default config;
