import React, { useEffect, useRef } from 'react';

/**
 * Global Accessibility Provider
 * Ensures accessibility settings are always applied,
 * regardless of whether the modal is open or closed.
 */
const GlobalAccessibilityProvider = ({ children }) => {
  const initialLoadRef = useRef(false);

  // Function to load and apply settings
  const loadAndApplySettings = () => {
    try {
      const savedSettings = localStorage.getItem("groupify-accessibility-settings");
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const root = document.documentElement;
        
        // Apply font size
        const fontSizeMap = {
          small: "14px",
          medium: "16px", 
          large: "18px"
        };
        const fontSize = settings.fontSize || "medium";
        root.style.fontSize = fontSizeMap[fontSize];

        // Apply high contrast
        if (settings.highContrast) {
          root.classList.add("high-contrast-mode");
          
          // Check if dark mode is currently active
          const isDarkMode = root.classList.contains('dark') || 
                           document.documentElement.getAttribute('data-theme') === 'dark' ||
                           window.matchMedia('(prefers-color-scheme: dark)').matches;
          
          // Ensure dark class is present if needed for proper high contrast styling
          if (isDarkMode && !root.classList.contains('dark')) {
            root.classList.add('dark');
          }
        } else {
          root.classList.remove("high-contrast-mode");
        }

        // Apply reduced motion
        if (settings.reducedMotion) {
          root.classList.add("reduce-motion");
        } else {
          root.classList.remove("reduce-motion");
        }
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  };

  // Load settings on component mount
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadAndApplySettings();
    }
  }, []);

  // Listen for localStorage changes (when settings are updated from other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "groupify-accessibility-settings") {
        loadAndApplySettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for custom events (when settings are updated in the same tab)
  useEffect(() => {
    const handleSettingsUpdate = () => {
      loadAndApplySettings();
    };

    window.addEventListener('accessibilitySettingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('accessibilitySettingsUpdated', handleSettingsUpdate);
  }, []);

  // Listen for page visibility changes (when user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => loadAndApplySettings(), 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Listen for focus events (when user clicks back into the window)
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => loadAndApplySettings(), 100);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return <>{children}</>;
};

export default GlobalAccessibilityProvider;


