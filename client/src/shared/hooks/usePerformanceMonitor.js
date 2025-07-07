// Performance monitoring hook to track component re-renders
import { useEffect, useRef } from "react";

export const useRenderTracker = (componentName, dependencies = {}) => {
  const renderCount = useRef(0);
  const lastDependencies = useRef(dependencies);

  useEffect(() => {
    renderCount.current += 1;

    const changedDeps = Object.keys(dependencies).filter(
      (key) => dependencies[key] !== lastDependencies.current[key]
    );

    if (changedDeps.length > 0) {
      console.log(
        `🔄 ${componentName} re-render #${renderCount.current} - Changed:`,
        changedDeps
      );
      console.log(
        "  Previous:",
        Object.fromEntries(
          changedDeps.map((key) => [key, lastDependencies.current[key]])
        )
      );
      console.log(
        "  Current:",
        Object.fromEntries(changedDeps.map((key) => [key, dependencies[key]]))
      );
    } else {
      console.log(
        `🔄 ${componentName} re-render #${renderCount.current} - No dependency changes detected`
      );
    }

    lastDependencies.current = dependencies;
  });

  return renderCount.current;
};

export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - renderStartTime.current;

    if (renderTime > 16) {
      // Longer than 1 frame (60fps)
      console.warn(
        `⚠️ ${componentName} slow render #${
          renderCount.current
        }: ${renderTime.toFixed(2)}ms`
      );
    } else {
      console.log(
        `✅ ${componentName} fast render #${
          renderCount.current
        }: ${renderTime.toFixed(2)}ms`
      );
    }

    renderStartTime.current = performance.now();
  });
};
