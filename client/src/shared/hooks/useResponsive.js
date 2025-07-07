// useResponsive Hook - Shared responsive utilities
import { useState, useEffect } from "react";
import { BREAKPOINTS } from "@/shared/constants/ui";

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width < BREAKPOINTS.mobile) return "mobile";
    if (width < BREAKPOINTS.tablet) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });

      // Update breakpoint
      if (width < BREAKPOINTS.mobile) {
        setBreakpoint("mobile");
      } else if (width < BREAKPOINTS.tablet) {
        setBreakpoint("tablet");
      } else {
        setBreakpoint("desktop");
      }
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call once to set initial state
    handleResize();

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    screenSize,
    breakpoint,
    isMobile: breakpoint === "mobile",
    isTablet: breakpoint === "tablet",
    isDesktop: breakpoint === "desktop",
    isMobileOrTablet: breakpoint === "mobile" || breakpoint === "tablet",
    isTabletOrDesktop: breakpoint === "tablet" || breakpoint === "desktop",
  };
};
