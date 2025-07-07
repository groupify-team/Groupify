import { useState } from "react";
import { useTheme } from "@shared/contexts/ThemeContext";

/**
 * Global Accessibility Hook
 * Provides consistent accessibility functionality across all app areas
 */
export const useGlobalAccessibility = () => {
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const openAccessibilitySettings = () => {
    console.log("Opening accessibility settings...");
    setShowAccessibilityModal(true);
  };

  const closeAccessibilitySettings = () => {
    setShowAccessibilityModal(false);
  };

  // Return consistent props for AccessibilityButton and AccessibilityModal
  return {
    // Modal state
    showAccessibilityModal,
    openAccessibilitySettings,
    closeAccessibilitySettings,

    // Theme integration
    theme,
    toggleTheme,

    // Pre-configured props for components
    accessibilityButtonProps: {
      onSettingsClick: openAccessibilitySettings,
    },

    accessibilityModalProps: {
      isOpen: showAccessibilityModal,
      onClose: closeAccessibilitySettings,
      theme,
      toggleTheme,
    },
  };
};
