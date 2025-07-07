// Page Transition Wrapper Component (CSS-based)
import React, { useState, useEffect } from "react";

const PageTransition = ({
  children,
  variant = "fadeIn",
  className = "",
  duration = 300,
  trigger = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Small delay to ensure smooth transitions
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [trigger]);

  const getTransitionClasses = () => {
    const base = `transition-all duration-${duration} ease-smooth`;

    switch (variant) {
      case "fadeIn":
        return `${base} ${isVisible ? "opacity-100" : "opacity-0"}`;
      case "slideInFromRight":
        return `${base} ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
        }`;
      case "slideInFromLeft":
        return `${base} ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
        }`;
      case "slideInFromBottom":
        return `${base} ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`;
      case "slideInFromTop":
        return `${base} ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
        }`;
      case "scaleIn":
        return `${base} ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`;
      default:
        return `${base} ${isVisible ? "opacity-100" : "opacity-0"}`;
    }
  };

  return (
    <div className={`${getTransitionClasses()} ${className}`}>{children}</div>
  );
};

// Section transition wrapper with intersection observer
export const SectionTransition = ({
  children,
  variant = "slideInFromBottom",
  className = "",
  threshold = 0.1,
}) => {
  const [ref, setRef] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref); // Only animate once
        }
      },
      { threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return (
    <div ref={setRef}>
      <PageTransition
        variant={variant}
        trigger={isVisible}
        className={className}
      >
        {children}
      </PageTransition>
    </div>
  );
};

// Stagger children animation
export const StaggeredTransition = ({
  children,
  variant = "slideInFromBottom",
  staggerDelay = 100,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  const childrenArray = React.Children.toArray(children);

  return (
    <div ref={setRef} className={className}>
      {childrenArray.map((child, index) => (
        <PageTransition
          key={index}
          variant={variant}
          trigger={isVisible}
          duration={300 + index * staggerDelay}
          className="transform-gpu"
        >
          {child}
        </PageTransition>
      ))}
    </div>
  );
};

export default PageTransition;
