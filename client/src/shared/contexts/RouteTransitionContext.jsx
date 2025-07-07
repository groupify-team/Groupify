import React, { createContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

// Route Transition Context
// eslint-disable-next-line react-refresh/only-export-components
export const RouteTransitionContext = createContext();

// Route Transition Provider Component
const RouteTransitionProvider = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState("fade");
  const [transitionDirection, setTransitionDirection] = useState("forward");
  const [transitionStage, setTransitionStage] = useState("idle"); // idle, leaving, entering, complete
  const location = useLocation();

  // Reset transition state when location changes
  useEffect(() => {
    if (transitionStage === "idle") {
      setTransitionStage("entering");
      setIsTransitioning(true);

      // Complete the entering transition
      const timer = setTimeout(() => {
        setTransitionStage("complete");
        setIsTransitioning(false);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, transitionStage]);

  // Initiate transition
  const startTransition = useCallback(
    (type = "fade", direction = "forward") => {
      setTransitionType(type);
      setTransitionDirection(direction);
      setTransitionStage("leaving");
      setIsTransitioning(true);

      // After leaving animation completes, we'll be ready for the new route
      const timer = setTimeout(() => {
        setTransitionStage("idle");
      }, 300);

      return () => clearTimeout(timer);
    },
    []
  );

  // Get transition classes based on current state
  const getTransitionClasses = useCallback(() => {
    const baseClasses = "transition-all duration-300 ease-in-out";

    if (transitionStage === "leaving") {
      switch (transitionType) {
        case "slideLeft":
          return `${baseClasses} -translate-x-full opacity-0`;
        case "slideRight":
          return `${baseClasses} translate-x-full opacity-0`;
        case "slideUp":
          return `${baseClasses} -translate-y-full opacity-0`;
        case "slideDown":
          return `${baseClasses} translate-y-full opacity-0`;
        case "fade":
        default:
          return `${baseClasses} opacity-0 scale-95`;
      }
    } else if (transitionStage === "entering") {
      switch (transitionType) {
        case "slideLeft":
          return `${baseClasses} translate-x-full opacity-0`;
        case "slideRight":
          return `${baseClasses} -translate-x-full opacity-0`;
        case "slideUp":
          return `${baseClasses} translate-y-full opacity-0`;
        case "slideDown":
          return `${baseClasses} -translate-y-full opacity-0`;
        case "fade":
        default:
          return `${baseClasses} opacity-0 scale-95`;
      }
    } else if (transitionStage === "complete") {
      return `${baseClasses} opacity-100 scale-100 translate-x-0 translate-y-0`;
    }

    return `${baseClasses} opacity-100 scale-100 translate-x-0 translate-y-0`;
  }, [transitionStage, transitionType]);

  const value = {
    isTransitioning,
    transitionType,
    transitionDirection,
    transitionStage,
    startTransition,
    getTransitionClasses,
  };

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
    </RouteTransitionContext.Provider>
  );
};

export default RouteTransitionProvider;
