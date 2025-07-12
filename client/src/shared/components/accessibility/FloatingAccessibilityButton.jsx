import React, { useState, useEffect } from "react";
import AccessibilityButton from "./AccessibilityButton";

const FloatingAccessibilityButton = ({ onSettingsClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsVisible(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 transition-all duration-300 transform hover:scale-110">
      <div className="bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-1.5">
        <AccessibilityButton
          onSettingsClick={onSettingsClick}
          size="default"
          variant="floating"
        />
      </div>
    </div>
  );
};

export default FloatingAccessibilityButton;
