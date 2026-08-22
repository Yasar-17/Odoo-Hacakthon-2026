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
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        surface: {
          50: "#f5f5f4",
          100: "#efefee",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
          950: "#0c0a09",
        },
        success: { light: "#dcfce7", DEFAULT: "#16a34a", text: "#15803d" },
        danger: { light: "#fee2e2", DEFAULT: "#dc2626", text: "#b91c1c" },
        warning: { light: "#fef3c7", DEFAULT: "#d97706", text: "#b45309" },
        info: { light: "#dbeafe", DEFAULT: "#2563eb", text: "#1d4ed8" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        lg: "8px",
      },
      spacing: {
        "page-desktop": "24px",
        "page-mobile": "16px",
      },
      width: {
        sidebar: "260px",
        "sidebar-collapsed": "72px",
      },
      height: {
        topbar: "64px",
      },
    },
  },
  plugins: [],
};

export default config;
