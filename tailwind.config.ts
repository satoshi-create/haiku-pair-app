import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        "theme-primary": "var(--theme-primary)",
        "theme-accent": "var(--theme-accent)",
        "theme-surface": "var(--theme-surface)",
        "theme-surface-muted": "var(--theme-surface-muted)",
        "theme-ring": "var(--theme-ring)",
      },
    },
  },
};

export default config;
