import React, { useState, useEffect } from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import {
  XMarkIcon,
  SunIcon,
  MoonIcon,
  EyeIcon,
  LanguageIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  InformationCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

// Accessibility icon (iPhone-style)
const AccessibilityIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L13.5 7.5C13.1 7.4 12.6 7.2 12.1 7.1L12 7L11.9 7.1C11.4 7.2 10.9 7.4 10.5 7.5L3 7V9L10.5 9.5L8.5 16.5C8.4 16.9 8.6 17.4 9 17.5C9.4 17.6 9.9 17.4 10 17L12 10.5L14 17C14.1 17.4 14.6 17.6 15 17.5C15.4 17.4 15.6 16.9 15.5 16.5L13.5 9.5L21 9Z" />
  </svg>
);

// Country flags as emoji components
const CountryFlags = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  he: "🇮🇱",
};

const SettingsModal = ({ isOpen, onClose, theme, toggleTheme }) => {
  const modalRef = useClickOutside(() => {
    if (isOpen) onClose();
  });

  // Settings state
  const [soundEffects, setSoundEffects] = useState(true);
  const [language, setLanguage] = useState("en");
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState("");

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(
      "groupify-accessibility-settings"
    );
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSoundEffects(settings.soundEffects ?? true);
      setLanguage(settings.language ?? "en");
      setFontSize(settings.fontSize ?? "medium");
      setHighContrast(settings.highContrast ?? false);
      setReducedMotion(settings.reducedMotion ?? false);
    }
  }, []);

  // Save settings to localStorage when they change
  const saveSettings = () => {
    const settings = {
      soundEffects,
      language,
      fontSize,
      highContrast,
      reducedMotion,
    };
    localStorage.setItem(
      "groupify-accessibility-settings",
      JSON.stringify(settings)
    );
  };

  useEffect(() => {
    saveSettings();
  }, [soundEffects, language, fontSize, highContrast, reducedMotion]);

  // Apply accessibility settings to document
  useEffect(() => {
    // Font size
    if (fontSize === "large") {
      document.documentElement.style.fontSize = "18px";
    } else if (fontSize === "small") {
      document.documentElement.style.fontSize = "14px";
    } else {
      document.documentElement.style.fontSize = "16px";
    }

    // High contrast - apply only to the modal
    const modalElement = document.querySelector(".settings-modal");
    if (modalElement) {
      if (highContrast) {
        modalElement.classList.add("high-contrast-modal");
      } else {
        modalElement.classList.remove("high-contrast-modal");
      }
    }

    // Reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [fontSize, highContrast, reducedMotion]);

  // Handle theme toggle
  const handleThemeToggle = () => {
    if (toggleTheme) {
      toggleTheme();
    }
  };

  const toggleSetting = (setter, value) => {
    setter(!value);
  };

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "he", name: "Hebrew", nativeName: "עברית" },
  ];

  const fontSizes = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  const currentTheme = theme || "light";

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

  const getLanguageMessage = (langCode) => {
    const messages = {
      es: {
        english: "We're working on Spanish language support. Coming soon!",
        native:
          "Estamos trabajando en el soporte del idioma español. ¡Próximamente!",
      },
      fr: {
        english: "We're working on French language support. Coming soon!",
        native:
          "Nous travaillons sur le support de la langue française. Bientôt disponible !",
      },
      de: {
        english: "We're working on German language support. Coming soon!",
        native:
          "Wir arbeiten an der deutschen Sprachunterstützung. Bald verfügbar!",
      },
      he: {
        english: "We're working on Hebrew language support. Coming soon!",
        native: "אנחנו עובדים על תמיכה בשפה העברית. בקרוב!",
      },
    };
    return messages[langCode];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div
          ref={modalRef}
          className="settings-modal bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: isOpen
              ? "slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "slideOut 0.3s ease-out forwards",
          }}
        >
          {/* Fixed Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <AccessibilityIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  id="settings-title"
                  className="text-xl font-bold text-gray-900 dark:text-white"
                >
                  Accessibility Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize your experience
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close settings"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Theme Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                {currentTheme === "dark" ? (
                  <MoonIcon className="w-5 h-5 mr-2" />
                ) : (
                  <SunIcon className="w-5 h-5 mr-2" />
                )}
                Appearance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    {currentTheme === "dark" ? (
                      <MoonIcon className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <SunIcon className="w-5 h-5 mr-3 text-yellow-600" />
                    )}
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Dark Mode
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Switch between light and dark themes
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleThemeToggle}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      currentTheme === "dark" ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={currentTheme === "dark"}
                    aria-label="Toggle dark mode"
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        currentTheme === "dark"
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Accessibility Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <EyeIcon className="w-5 h-5 mr-2" />
                Visual Accessibility
              </h3>
              <div className="space-y-3">
                {/* Font Size */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-gray-900 dark:text-white">
                      Font Size
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      WCAG AA Compliant
                    </span>
                  </div>
                  <div
                    className="flex space-x-2"
                    role="radiogroup"
                    aria-label="Font size options"
                  >
                    {fontSizes.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => setFontSize(size.value)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          fontSize === size.value
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                        }`}
                        role="radio"
                        aria-checked={fontSize === size.value}
                        aria-label={`Set font size to ${size.label}`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      High Contrast Mode
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Applies only to this settings panel
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSetting(setHighContrast, highContrast)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      highContrast ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={highContrast}
                    aria-label="Toggle high contrast mode"
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        highContrast ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Reduce Motion
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Minimizes animations for motion sensitivity
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      toggleSetting(setReducedMotion, reducedMotion)
                    }
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      reducedMotion ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={reducedMotion}
                    aria-label="Toggle reduced motion"
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        reducedMotion ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Sound Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                {soundEffects ? (
                  <SpeakerWaveIcon className="w-5 h-5 mr-2" />
                ) : (
                  <SpeakerXMarkIcon className="w-5 h-5 mr-2" />
                )}
                Audio Preferences
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    {soundEffects ? (
                      <SpeakerWaveIcon className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <SpeakerXMarkIcon className="w-5 h-5 mr-3 text-gray-400" />
                    )}
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Sound Effects
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enable audio feedback for interactions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSetting(setSoundEffects, soundEffects)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      soundEffects ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={soundEffects}
                    aria-label="Toggle sound effects"
                  >
                    <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        soundEffects ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Language Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <LanguageIcon className="w-5 h-5 mr-2" />
                Language & Region
              </h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label
                  htmlFor="language-select"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Select Language
                </label>
                <div className="relative">
                  <button
                    onClick={() =>
                      setLanguageDropdownOpen(!languageDropdownOpen)
                    }
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-left text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex items-center justify-between"
                    aria-haspopup="listbox"
                    aria-expanded={languageDropdownOpen}
                    aria-label="Language selection"
                  >
                    <div className="flex items-center">
                      <span
                        className="text-xl mr-2"
                        style={{ fontFamily: "system-ui, -apple-system" }}
                      >
                        {CountryFlags[language]}
                      </span>
                      <span>
                        {languages.find((lang) => lang.code === language)
                          ?.name || "English"}
                      </span>
                    </div>
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform ${
                        languageDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {languageDropdownOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                          role="option"
                          aria-selected={language === lang.code}
                        >
                          <span
                            className="text-xl mr-3"
                            style={{ fontFamily: "system-ui, -apple-system" }}
                          >
                            {CountryFlags[lang.code]}
                          </span>
                          <div>
                            <div className="text-gray-900 dark:text-white">
                              {lang.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {lang.nativeName}
                            </div>
                          </div>
                          {language === lang.code && (
                            <CheckIcon className="w-4 h-4 ml-auto text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <InformationCircleIcon className="w-4 h-4 mr-1" />
                Settings saved automatically
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Language Coming Soon Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {CountryFlags[pendingLanguage]}
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationCircleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Language Coming Soon!
              </h3>
              <div className="space-y-3 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  {getLanguageMessage(pendingLanguage)?.english}
                </p>
                <p className="text-gray-600 dark:text-gray-400 border-t pt-3">
                  {getLanguageMessage(pendingLanguage)?.native}
                </p>
              </div>
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Got it!
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  We'll notify you when it's available
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes slideOut {
          from { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to { 
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
        }

        /* High contrast mode for modal only */
        .high-contrast-modal {
          filter: contrast(200%) brightness(1.2);
        }
        
        .high-contrast-modal .bg-gray-50 {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        
        .high-contrast-modal .text-gray-600,
        .high-contrast-modal .text-gray-500,
        .high-contrast-modal .text-gray-400 {
          color: #ffffff !important;
        }
        
        .high-contrast-modal .border-gray-200,
        .high-contrast-modal .border-gray-300 {
          border-color: #ffffff !important;
        }
        
        /* Reduced motion styles */
        .reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        /* Smooth scrolling override for reduced motion */
        .reduce-motion .settings-modal {
          scroll-behavior: auto !important;
        }
        
        /* Better scrollbar for the modal */
        .settings-modal .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .settings-modal .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .settings-modal .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        
        .settings-modal .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
        
        /* Dark mode scrollbar */
        .dark .settings-modal .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
        }
        
        .dark .settings-modal .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }
      `}</style>
    </>
  );
};

export default SettingsModal;
