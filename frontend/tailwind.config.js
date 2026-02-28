const palette = require("./tailwind.palette.json");

module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // central brand palette (used throughout project)
        brand: {
          DEFAULT: palette.Vibrant, // primary accent #bc9c71
          light: palette.LightVibrant, // #c3ac7d
          dark: palette.DarkVibrant, // #1c140c
          muted: palette.Muted, // #b49c74
          "muted-dark": palette.DarkMuted, // #4c3c34
          // semantic variants from brand palette
          surface: palette.Muted, // for backgrounds that need subtle brand feel
          "surface-light": palette.LightVibrant,
        },
        accent: palette.Vibrant, // alias for backwards compatibility
        // neutral palette (only grays, all from single scale)
        neutral: {
          50: "#f9fafb", // lightest
          100: "#f3f4f6",
          150: "#ececf1", // custom neutral tier
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827", // darkest
        },
        // semantic colors (derived from brand or purpose)
        success: {
          light: "#d1fae5",
          DEFAULT: "#10b981",
          dark: "#047857",
        },
        warning: {
          light: "#fef3c7",
          DEFAULT: "#f59e0b",
          dark: "#b45309",
        },
        error: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#991b1b",
        },
        info: {
          light: "#cffafe",
          DEFAULT: "#06b6d4",
          dark: "#0e7490",
        },
      },
      spacing: {
        // 4px base unit scale for consistency
        0.5: "0.125rem", // 2px
        1.5: "0.375rem", // 6px
        2.5: "0.625rem", // 10px
        3.5: "0.875rem", // 14px
        4.5: "1.125rem", // 18px
        5.5: "1.375rem", // 22px
        6.5: "1.625rem", // 26px
        7.5: "1.875rem", // 30px
        8.5: "2.125rem", // 34px
        9.5: "2.375rem", // 38px
        10.5: "2.625rem", // 42px
        11: "2.75rem", // 44px
        11.5: "2.875rem", // 46px
        12.5: "3.125rem", // 50px
        13: "3.25rem", // 52px
        14: "3.5rem", // 56px
        15: "3.75rem", // 60px
        16: "4rem", // 64px
        18: "4.5rem", // 72px
        20: "5rem", // 80px
        22: "5.5rem", // 88px
        24: "6rem", // 96px
      },
      fontSize: {
        // typography scale
        xs: ["0.75rem", { lineHeight: "1rem", fontWeight: "500" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem", fontWeight: "500" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }], // 36px
        "5xl": ["3rem", { lineHeight: "3.5rem", fontWeight: "800" }], // 48px
      },
      borderRadius: {
        xs: "0.25rem", // 4px
        sm: "0.375rem", // 6px
        md: "0.5rem", // 8px (default)
        lg: "0.75rem", // 12px
        xl: "1rem", // 16px
        "2xl": "1.25rem", // 20px
        "3xl": "1.5rem", // 24px
      },
      boxShadow: {
        // shadow system from brand-light to dark
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        base: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        // brand-tinted shadows
        "brand-sm": `0 2px 4px -1px ${palette.Vibrant}15`,
        "brand-md": `0 10px 15px -3px ${palette.Vibrant}20`,
        "brand-lg": `0 20px 25px -5px ${palette.Vibrant}25`,
      },
      transitionDuration: {
        250: "250ms",
      },
      keyframes: {
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        menuOpen: {
          "0%": { maxHeight: "0", opacity: "0" },
          "100%": { maxHeight: "500px", opacity: "1" },
        },
        menuClose: {
          "0%": { maxHeight: "500px", opacity: "1" },
          "100%": { maxHeight: "0", opacity: "0" },
        },
      },
      animation: {
        slideUp: "slideUp 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        fadeIn: "fadeIn 300ms ease-in-out",
        menuOpen: "menuOpen 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        menuClose: "menuClose 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
