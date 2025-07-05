import { useEffect } from "react";

/**
 * Custom hook to manage font size
 * NOTE: This hook only manages the logic, not the DOM application
 * DOM application is handled centrally in AccessibilityModal
 */
export const useFontSize = (fontSize) => {
  // This hook is now just for organization - the actual DOM manipulation
  // is handled centrally in AccessibilityModal to avoid conflicts
  
  useEffect(() => {
    // Any non-DOM logic for font size can go here
    console.log('Font size changed to:', fontSize);
  }, [fontSize]);

  // Return utility functions
  const getFontSizePixels = () => {
    const fontSizeMap = {
      small: "14px",
      medium: "16px", 
      large: "18px"
    };
    return fontSizeMap[fontSize] || "16px";
  };

  return {
    currentSize: fontSize,
    sizeInPixels: getFontSizePixels()
  };
};