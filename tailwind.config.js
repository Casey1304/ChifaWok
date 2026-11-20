/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#af101a",
        "primary-container": "#d32f2f",
        "on-primary": "#ffffff",
        "on-primary-container": "#fff2f0",
        "primary-fixed": "#ffdad6",
        "primary-fixed-dim": "#ffb3ac",
        "on-primary-fixed": "#410003",
        "on-primary-fixed-variant": "#930010",
        "inverse-primary": "#ffb3ac",

        "secondary": "#795900",
        "secondary-container": "#fec330",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#6f5100",
        "secondary-fixed": "#ffdfa0",
        "secondary-fixed-dim": "#f8bd2a",
        "on-secondary-fixed": "#261a00",
        "on-secondary-fixed-variant": "#5c4300",

        "tertiary": "#0058a2",
        "tertiary-container": "#0770cc",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#f0f4ff",
        "tertiary-fixed": "#d4e3ff",
        "tertiary-fixed-dim": "#a5c8ff",
        "on-tertiary-fixed": "#001c3a",
        "on-tertiary-fixed-variant": "#004786",

        "background": "#fcf9f8",
        "on-background": "#1b1c1c",

        "surface": "#fcf9f8",
        "on-surface": "#1b1c1c",
        "surface-bright": "#fcf9f8",
        "surface-dim": "#dcd9d9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "surface-container": "#f0eded",
        "surface-container-high": "#eae7e7",
        "surface-container-highest": "#e5e2e1",
        "surface-variant": "#e5e2e1",
        "on-surface-variant": "#5b403d",
        "surface-tint": "#ba1a20",
        "inverse-surface": "#303030",
        "inverse-on-surface": "#f3f0ef",

        "outline": "#8f6f6c",
        "outline-variant": "#e4beba",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        // Gold & Asian Wok accents
        "wok-gold": "#F5C042",
        "wok-gold-light": "#FFF3C4",
        "wok-gold-dark": "#D49B28",
        "wok-crimson": "#5F0910"
      },
      fontFamily: {
        "montserrat": ["Montserrat", "sans-serif"],
        "inter": ["Inter", "sans-serif"],
        "display-lg": ["Montserrat", "sans-serif"],
        "headline-lg": ["Montserrat", "sans-serif"],
        "headline-md": ["Montserrat", "sans-serif"],
        "headline-lg-mobile": ["Montserrat", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"]
      },
      spacing: {
        "xs": "4px",
        "base": "8px",
        "sm": "12px",
        "margin-mobile": "16px",
        "md": "24px",
        "gutter": "24px",
        "margin-desktop": "40px",
        "lg": "48px",
        "xl": "80px"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "full": "9999px"
      }
    },
  },
  plugins: [],
}
