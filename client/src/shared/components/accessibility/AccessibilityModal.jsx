import React, { useEffect } from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useAccessibilitySettings } from "./hooks/useAccessibilitySettings";

// Components
import ModalHeader from "./components/ModalHeader";
import AppearanceSettings from "./components/AppearanceSettings";
import ContrastSettings from "./components/ContrastSettings";
import FontSettings from "./components/FontSettings";
import MotionSettings from "./components/MotionSettings";
import AudioSettings from "./components/AudioSettings";
import LanguageSettings from "./components/LanguageSettings";

// Icons
import { InformationCircleIcon } from "@heroicons/react/24/outline";

const AccessibilityModal = ({ isOpen, onClose, theme, toggleTheme }) => {
  const modalRef = useClickOutside(() => {
    if (isOpen) onClose();
  });

  const accessibilitySettings = useAccessibilitySettings();

  // Apply settings when modal opens (backup to ensure settings are applied)
  useEffect(() => {
    if (isOpen && accessibilitySettings.isInitialized) {
      const root = document.documentElement;
      
      // Apply font size
      const fontSizeMap = {
        small: "14px",
        medium: "16px", 
        large: "18px"
      };
      root.style.fontSize = fontSizeMap[accessibilitySettings.fontSize] || "16px";

      // Apply high contrast
      if (accessibilitySettings.highContrast) {
        root.classList.add("high-contrast-mode");
      } else {
        root.classList.remove("high-contrast-mode");
      }

      // Apply reduced motion
      if (accessibilitySettings.reducedMotion) {
        root.classList.add("reduce-motion");
      } else {
        root.classList.remove("reduce-motion");
      }
    }
  }, [isOpen, accessibilitySettings.fontSize, accessibilitySettings.highContrast, accessibilitySettings.reducedMotion, accessibilitySettings.isInitialized]);

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
        aria-labelledby="accessibility-title"
      >
        <div
          ref={modalRef}
          className="accessibility-modal bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: isOpen
              ? "slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "slideOut 0.3s ease-out forwards",
          }}
        >
          {/* Header */}
          <ModalHeader onClose={onClose} />

          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Appearance Section */}
            <AppearanceSettings 
              theme={theme} 
              toggleTheme={toggleTheme} 
            />

            {/* Visual Accessibility Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Visual Accessibility
              </h3>
              <div className="space-y-3">
                <FontSettings {...accessibilitySettings} />
                <ContrastSettings {...accessibilitySettings} />
                <MotionSettings {...accessibilitySettings} />
              </div>
            </div>

            {/* Audio Section */}
            <AudioSettings {...accessibilitySettings} />

            {/* Language Section */}
            <LanguageSettings {...accessibilitySettings} />
          </div>

          {/* Footer */}
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

      {/* Animation Styles */}
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
      `}</style>
    </>
  );
};

export default AccessibilityModal;