/**
 * Hook for monitoring component render performance in development
 * Tracks render times and identifies slow-rendering components
 */

import { useEffect, useRef } from "react";

export const usePerformanceMonitoring = (componentName) => {
  const renderStartTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - renderStartTime.current;

    // Log performance in development
    if (process.env.NODE_ENV === "development") {
      // Warn about slow renders
      if (renderTime > 100) {
        console.warn(
          `⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(
            2
          )}ms`
        );
      }
    }

    // Reset timer for next render
    renderStartTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
  };
};
