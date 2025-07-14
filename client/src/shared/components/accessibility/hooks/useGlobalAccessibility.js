import { useState } from "react";
import { useTheme } from "@shared/contexts/ThemeContext";

export const useGlobalAccessibility = () => {
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const openAccessibilitySettings = () => {
    setShowAccessibilityModal(true);
  };

  const closeAccessibilitySettings = () => {
    setShowAccessibilityModal(false);
  };

  return {
    showAccessibilityModal,
    openAccessibilitySettings,
    closeAccessibilitySettings,
    theme,
    toggleTheme,
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
