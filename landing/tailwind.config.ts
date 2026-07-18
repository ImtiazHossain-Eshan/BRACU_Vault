import type { Config } from "tailwindcss";

/**
 * Two themes share one set of semantic tokens (CSS variables defined in
 * globals.css). Tailwind colors point at those vars so every utility —
 * `text-fg/60`, `bg-bg`, `from-accent` — is theme-aware with zero `dark:` churn.
 * `.dark` on <html> swaps the variable values.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        "bg-2": "rgb(var(--bg-2) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-2": "rgb(var(--accent-2) / <alpha-value>)",
        "accent-3": "rgb(var(--accent-3) / <alpha-value>)",
        "accent-4": "rgb(var(--accent-4) / <alpha-value>)",
        highlight: "rgb(var(--highlight) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      maxWidth: {
        content: "1200px",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        "glow-cyan": "var(--shadow-accent)",
        "glow-violet": "var(--shadow-accent-2)",
        soft: "var(--shadow-soft)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-16px)" },
        },
        spinSlow: {
          to: { transform: "rotate(360deg)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(40px, -30px) scale(1.1)" },
          "66%": { transform: "translate(-30px, 20px) scale(0.95)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
        gradientPan: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        marquee: {
          to: { transform: "translateX(-50%)" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "20%": { transform: "translate(-6%, 4%)" },
          "40%": { transform: "translate(4%, -6%)" },
          "60%": { transform: "translate(-3%, 5%)" },
          "80%": { transform: "translate(5%, -2%)" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "float 11s ease-in-out infinite",
        "spin-slow": "spinSlow 26s linear infinite",
        "spin-med": "spinSlow 17s linear infinite",
        "pulse-glow": "pulseGlow 4.5s ease-in-out infinite",
        aurora: "aurora 22s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
        "gradient-pan": "gradientPan 7s ease infinite",
        marquee: "marquee 40s linear infinite",
        grain: "grain 8s steps(6) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
