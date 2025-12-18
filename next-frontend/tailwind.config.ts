import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Avenir", "Montserrat", "Nunito", "sans-serif"],
      },
      colors: {
        "elvee-blue": "#0E244D",
        "feather-gold": "#AE8135",
        ivory: "#F8F5F0",
        "warm-gold": "#927038",
        steel: "#B6B6B6",
        navy: "#0A1F47",
        ink: "#0C1424",
      },
    },
  },
  plugins: [forms],
};
export default config;
