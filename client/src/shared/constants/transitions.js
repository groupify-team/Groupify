// Shared Transition Constants and Utilities
export const TRANSITIONS = {
  // Duration presets
  duration: {
    instant: "75ms",
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
    slower: "700ms",
    slowest: "1000ms",
  },

  // Easing functions
  easing: {
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  // Common transition classes
  classes: {
    // Basic transitions
    all: "transition-all duration-300 ease-smooth",
    colors: "transition-colors duration-200 ease-smooth",
    opacity: "transition-opacity duration-300 ease-smooth",
    transform: "transition-transform duration-300 ease-smooth",

    // Interactive elements
    button:
      "transition-all duration-200 ease-smooth transform-gpu hover:scale-105 active:scale-95",
    buttonSoft: "transition-all duration-200 ease-smooth",
    card: "transition-all duration-300 ease-smooth hover:shadow-lg hover:-translate-y-1",
    cardSoft: "transition-all duration-300 ease-smooth hover:shadow-md",

    // Page transitions
    pageEnter: "transition-all duration-500 ease-spring",
    pageExit: "transition-all duration-300 ease-sharp",

    // Modal transitions
    modalBackdrop: "transition-opacity duration-300 ease-smooth",
    modalContent: "transition-all duration-400 ease-spring",

    // Dropdown/menu transitions
    dropdown: "transition-all duration-200 ease-smooth origin-top",
    slideDown: "transition-all duration-300 ease-smooth",
    slideUp: "transition-all duration-300 ease-smooth",

    // Focus states
    focus:
      "transition-all duration-200 ease-smooth focus:ring-2 focus:ring-opacity-50",
  },

  // Animation variants
  variants: {
    // Fade animations
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
    },

    // Scale animations
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 0.4, ease: "spring" },
    },

    // Slide animations
    slideInFromRight: {
      initial: { opacity: 0, x: 100 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 100 },
      transition: { duration: 0.4, ease: "smooth" },
    },

    slideInFromLeft: {
      initial: { opacity: 0, x: -100 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -100 },
      transition: { duration: 0.4, ease: "smooth" },
    },

    slideInFromBottom: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 },
      transition: { duration: 0.4, ease: "spring" },
    },

    // Page transitions
    pageSlideLeft: {
      initial: { opacity: 0, x: "100%" },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: "-100%" },
      transition: { duration: 0.5, ease: "smooth" },
    },

    // Modal transitions
    modalBackdrop: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
    },

    modalContent: {
      initial: { opacity: 0, scale: 0.9, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.9, y: 20 },
      transition: { duration: 0.4, ease: "spring" },
    },
  },
};

// Utility functions for transitions
export const createTransition = (
  property,
  duration = "300ms",
  easing = "ease-smooth"
) => `transition-${property} duration-${duration} ${easing}`;

export const combineTransitions = (...transitions) => transitions.join(" ");

// Stagger animation helper
export const staggerChildren = (children, delay = 0.1) => ({
  animate: {
    transition: {
      staggerChildren: delay,
    },
  },
});

// Spring preset configs
export const springConfigs = {
  gentle: { type: "spring", stiffness: 120, damping: 20 },
  wobbly: { type: "spring", stiffness: 180, damping: 12 },
  stiff: { type: "spring", stiffness: 210, damping: 20 },
  slow: { type: "spring", stiffness: 80, damping: 20 },
};
