import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "var(--text-primary)",
        mute: "var(--text-secondary)",
        faint: "var(--text-muted)",
        line: "var(--surface-border)",
        edge: "var(--border-strong)",
        nav: "var(--nav-bg)",
        panel: "var(--panel-bg)",
        fill: "var(--fill-subtle)",
        brand: "var(--brand-400)",
      },
    },
  },
  plugins: [],
};

export default config;
