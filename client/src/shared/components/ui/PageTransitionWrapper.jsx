import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const PageTransitionWrapper = ({ children }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(location.pathname);

  useEffect(() => {
    // When location changes, fade out first
    if (location.pathname !== currentLocation) {
      setIsVisible(false);

      // Update location and fade in after a short delay
      const timer = setTimeout(() => {
        setCurrentLocation(location.pathname);
        setIsVisible(true);
      }, 150);

      return () => clearTimeout(timer);
    } else {
      // Initial load
      setIsVisible(true);
    }
  }, [location.pathname, currentLocation]);

  return (
    <div
      className={`page-content-enter ${
        isVisible ? "page-content-enter-active" : ""
      }`}
    >
      {children}
    </div>
  );
};

export default PageTransitionWrapper;
