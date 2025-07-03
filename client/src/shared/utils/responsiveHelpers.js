/**
 * Responsive design utilities and breakpoint helpers
 * Handles responsive classes, grid patterns, and screen size utilities
 */

export const BREAKPOINTS = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export const getResponsiveClasses = (base, variants = {}) => {
  const classes = [base];

  Object.entries(variants).forEach(([breakpoint, className]) => {
    classes.push(`${breakpoint}:${className}`);
  });

  return classes.join(" ");
};

// Grid responsive patterns
export const GRID_PATTERNS = {
  photoGrid:
    "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8",
  cardGrid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  statsGrid: "grid-cols-2 sm:grid-cols-4",
};
