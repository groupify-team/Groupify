/** @type {import('tailwindcss').Config} */
/* eslint-env node */
/* eslint-disable no-undef */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      // Custom animations
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in-left": "slideInLeft 0.3s ease-in-out",
        "slide-in-right": "slideInRight 0.3s ease-in-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s infinite",
        "modal-enter": "modalEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bounce-gentle": "bounceGentle 0.6s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },

      // Custom keyframes
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        modalEnter: {
          "0%": { opacity: "0", transform: "scale(0.9) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        bounceGentle: {
          "0%": { transform: "scale(0.95)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },

      // Custom colors for better dark mode support
      colors: {
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
      },

      // Custom spacing
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },

      // Custom font sizes
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },

      // Custom z-index values
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },

      // Custom backdrop blur
      backdropBlur: {
        xs: "2px",
      },

      // Custom border radius
      borderRadius: {
        "4xl": "2rem",
      },

      // Custom box shadows
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        "soft-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },

      // Custom transition timing functions
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bounce-soft": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },

      // Custom transition durations
      transitionDuration: {
        400: "400ms",
        600: "600ms",
        800: "800ms",
        1200: "1200ms",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),

    // Custom plugin for additional utilities
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-balance": {
          "text-wrap": "balance",
        },
        ".bg-pattern": {
          "background-image":
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
          "background-size": "20px 20px",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
