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
        rotary: {
          blue: "#17458f",
          "blue-dark": "#0f2d5c",
          "blue-light": "#1e5ab8",
          gold: "#f7a81b",
          "gold-dark": "#c78515",
          "gold-light": "#f9bc4a",
        },
        semaforo: {
          verde: "#22c55e",
          "verde-oscuro": "#15803d",
          rojo: "#dc2626",
          "rojo-oscuro": "#b91c1c",
        },
      },
      fontSize: {
        "ui-base": ["1.125rem", { lineHeight: "1.5" }],
        "ui-lg": ["1.25rem", { lineHeight: "1.5" }],
        "ui-xl": ["1.5rem", { lineHeight: "1.4" }],
        "ui-2xl": ["2rem", { lineHeight: "1.3" }],
        "ui-3xl": ["2.5rem", { lineHeight: "1.2" }],
      },
      minHeight: {
        "touch": "3.5rem",
        "touch-lg": "4.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
