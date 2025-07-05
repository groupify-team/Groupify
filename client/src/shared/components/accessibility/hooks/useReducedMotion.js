import { useEffect } from "react";

/**
 * Custom hook to manage reduced motion
 * NOTE: This hook only manages the logic, not the DOM application  
 * DOM application is handled centrally in AccessibilityModal
 */
export const useReducedMotion = (reducedMotion) => {
  // This hook is now just for organization - the actual DOM manipulation
  // is handled centrally in AccessibilityModal to avoid conflicts
  
  useEffect(() => {
    // Any non-DOM logic for reduced motion can go here
    console.log('Reduced motion:', reducedMotion ? 'enabled' : 'disabled');
  }, [reducedMotion]);

  // Check system preference
  const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  return {
    isReducedMotion: reducedMotion,
    systemPrefersReducedMotion: prefersReducedMotion()
  };
};