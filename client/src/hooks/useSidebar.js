// client/src/hooks/useSidebar.js
import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing sidebar state
 * Provides persistent sidebar state across page navigation
 */
export const useSidebar = (defaultOpen = false) => {
  // Initialize state from localStorage or default
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-open");
      if (saved !== null) {
        return JSON.parse(saved);
      }
    }
    return defaultOpen;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-open", JSON.stringify(isOpen));
    }
  }, [isOpen]);

  // Toggle sidebar state
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Open sidebar
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close sidebar
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close sidebar on mobile when clicking outside
  const handleOutsideClick = useCallback(
    (event) => {
      const sidebar = document.getElementById("sidebar");
      const toggleButton = document.getElementById("sidebar-toggle");

      if (
        sidebar &&
        !sidebar.contains(event.target) &&
        !toggleButton?.contains(event.target)
      ) {
        // Only close on mobile
        if (window.innerWidth < 1024) {
          close();
        }
      }
    },
    [close]
  );

  // Handle escape key to close sidebar
  const handleEscapeKey = useCallback(
    (event) => {
      if (event.key === "Escape" && isOpen) {
        close();
      }
    },
    [isOpen, close]
  );

  // Auto-close on mobile when route changes
  const handleRouteChange = useCallback(() => {
    if (window.innerWidth < 1024 && isOpen) {
      close();
    }
  }, [isOpen, close]);

  // Set up event listeners
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscapeKey);

      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [handleOutsideClick, handleEscapeKey]);

  return {
    isOpen,
    toggle,
    open,
    close,
    handleRouteChange,
  };
};

/**
 * Hook for detecting mobile screen size
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);

    // Check initial size
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

/**
 * Hook for managing sidebar breakpoints and responsive behavior
 */
export const useSidebarResponsive = () => {
  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width >= 1280) return "xl";
      if (width >= 1024) return "lg";
      if (width >= 768) return "md";
      if (width >= 640) return "sm";
      return "xs";
    }
    return "lg";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const width = window.innerWidth;
      let newBreakpoint;

      if (width >= 1280) newBreakpoint = "xl";
      else if (width >= 1024) newBreakpoint = "lg";
      else if (width >= 768) newBreakpoint = "md";
      else if (width >= 640) newBreakpoint = "sm";
      else newBreakpoint = "xs";

      setBreakpoint(newBreakpoint);
    };

    window.addEventListener("resize", handleResize);

    // Check initial size
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile =
    breakpoint === "xs" || breakpoint === "sm" || breakpoint === "md";
  const isTablet = breakpoint === "md";
  const isDesktop = breakpoint === "lg" || breakpoint === "xl";

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    shouldShowOverlay: isMobile,
    shouldAutoClose: isMobile,
  };
};

export default useSidebar;
