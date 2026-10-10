/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        venture: {
          cream: "#FAF7F2",
          creamWarm: "#F5F1E8",
          creamSurface: "#FFFFFF",
          creamBorder: "#E8E2D5",
          sand: "#EDE7DC",
          espresso: "#1C1917",
          cognac: "#B45309",
          gold: "#C28E47",
          amber: "#D97706",
          amberHover: "#B45309",
          amberLight: "#FEF3C7",
          amberMuted: "#FFFBEB",
          navy: "#1C1917",
          navyLight: "#292524",
          navyMuted: "#44403C",
          teal: "#2D5A46",
          tealHover: "#1E3E30",
          tealLight: "#E8F0EC",
          tealMuted: "#F4F8F5",
          parchment: "#FAF7F2",
          parchmentWarm: "#F5F1E8",
          surface: "#FFFFFF",
          slate: "#78716C",
          slateLight: "#A8A29E",
          border: "#E8E2D5",
          borderSubtle: "#D6CEBF",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "-apple-system", "BlinkMacSystemFont", "Roboto", "Segoe UI", "sans-serif"],
        serif: ["'Playfair Display'", "Georgia", "Cambria", "'Times New Roman'", "serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
