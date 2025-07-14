import { useEffect, useRef } from "react";

export const useRenderTracker = (componentName, dependencies = {}) => {
  const renderCount = useRef(0);
  const lastDependencies = useRef(dependencies);

  useEffect(() => {
    renderCount.current += 1;
    const changedDeps = Object.keys(dependencies).filter(
      (key) => dependencies[key] !== lastDependencies.current[key]
    );
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
      console.warn(
        `⚠️ ${componentName} slow render #${
          renderCount.current
        }: ${renderTime.toFixed(2)}ms`
      );
    } else {
    }

    renderStartTime.current = performance.now();
  });
};
