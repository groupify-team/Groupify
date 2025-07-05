import { useState, useEffect } from "react";

/**
 * Main accessibility settings hook
 * Manages all accessibility settings and localStorage persistence
 */
export const useAccessibilitySettings = () => {
  // State for all accessibility settings
  const [soundEffects, setSoundEffects] = useState(true);
  const [language, setLanguage] = useState("en");
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Language modal state
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState("");

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem("groupify-accessibility-settings");
        
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          
          setSoundEffects(settings.soundEffects ?? true);
          setLanguage(settings.language ?? "en");
          setFontSize(settings.fontSize ?? "medium");
          setHighContrast(settings.highContrast ?? false);
          setReducedMotion(settings.reducedMotion ?? false);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
        setIsInitialized(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage when they change - BUT ONLY AFTER INITIALIZATION
  useEffect(() => {
    if (!isInitialized) return;

    const saveSettings = () => {
      try {
        const settings = {
          soundEffects,
          language,
          fontSize,
          highContrast,
          reducedMotion,
        };
        
        localStorage.setItem("groupify-accessibility-settings", JSON.stringify(settings));
        
        // Dispatch custom event to notify GlobalAccessibilityProvider
        window.dispatchEvent(new CustomEvent('accessibilitySettingsUpdated', { 
          detail: settings 
        }));
      } catch (error) {
        console.error('Failed to save accessibility settings:', error);
      }
    };

    saveSettings();
  }, [soundEffects, language, fontSize, highContrast, reducedMotion, isInitialized]);

  // Helper functions
  const toggleSetting = (setter, currentValue) => {
    setter(!currentValue);
  };

  const resetSettings = () => {
    setSoundEffects(true);
    setLanguage("en");
    setFontSize("medium");
    setHighContrast(false);
    setReducedMotion(false);
    localStorage.removeItem("groupify-accessibility-settings");
  };

  const handleLanguageChange = (langCode) => {
    if (langCode !== "en") {
      setPendingLanguage(langCode);
      setShowLanguageModal(true);
      setLanguageDropdownOpen(false);
    } else {
      setLanguage(langCode);
      setLanguageDropdownOpen(false);
    }
  };

  return {
    // Settings state
    soundEffects,
    setSoundEffects,
    language,
    setLanguage,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    
    // Language modal state
    languageDropdownOpen,
    setLanguageDropdownOpen,
    showLanguageModal,
    setShowLanguageModal,
    pendingLanguage,
    setPendingLanguage,
    
    // Helper functions
    toggleSetting,
    resetSettings,
    handleLanguageChange,
    
    // Initialization state
    isInitialized,
  };
};