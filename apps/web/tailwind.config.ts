import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0B0D10",
          secondary: "#101319",
        },
        surface: {
          DEFAULT: "#15191F",
          hover: "#1C222B",
        },
        border: "#2A3039",
        foreground: {
          DEFAULT: "#F2F5F7",
          secondary: "#9AA5B1",
          muted: "#727D89",
        },
        accent: {
          DEFAULT: "#C8FF4D", // Acid lime for primary actions
          hover: "#d4ff6e",
          cyan: "#50E6FF",   // Cyan for AI analysis
        },
        warning: "#FFB454",
        error: "#FF647C",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scan 4s linear infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
