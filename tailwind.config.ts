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
        // Charcoal / near-black — used for primary buttons, active states, headings, logo
        primary: {
          50: "#f5f5f5",
          100: "#e5e5e5",
          200: "#d4d4d4",
          300: "#a3a3a3",
          400: "#737373",
          500: "#525252",
          600: "#262626",
          700: "#1a1a1a",
          800: "#111111",
          900: "#0a0a0a",
          950: "#050505",
        },
        // Warm understated accent — used sparingly for status highlights only
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        surface: {
          50: "#fafafa",
          100: "#f5f5f4",
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
        // Functional status colors — kept distinct from the UI palette
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
        sidebar: "260px",
        topbar: "64px",
        "sidebar-collapsed": "72px",
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
