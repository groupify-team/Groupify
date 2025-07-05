import React from "react";
import { LanguageIcon, ChevronDownIcon, CheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { LANGUAGES, LANGUAGE_MESSAGES } from "../utils/accessibilityConstants";

const LanguageSettings = ({
  language,
  setLanguage,
  languageDropdownOpen,
  setLanguageDropdownOpen,
  showLanguageModal,
  setShowLanguageModal,
  pendingLanguage,
  handleLanguageChange,
}) => {
  return (
    <>
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
              onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
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
                  {LANGUAGES.find((lang) => lang.code === language)?.flag || "🇺🇸"}
                </span>
                <span>
                  {LANGUAGES.find((lang) => lang.code === language)?.name || "English"}
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
                {LANGUAGES.map((lang) => (
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
                      {lang.flag}
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

      {/* Language Coming Soon Modal - FIXED: Proper positioning with higher z-index */}
      {showLanguageModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 60
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 relative z-[61]">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {LANGUAGES.find((lang) => lang.code === pendingLanguage)?.flag || "🌐"}
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationCircleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Language Coming Soon!
              </h3>
              <div className="space-y-3 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  {LANGUAGE_MESSAGES[pendingLanguage]?.english}
                </p>
                <p className="text-gray-600 dark:text-gray-400 border-t pt-3">
                  {LANGUAGE_MESSAGES[pendingLanguage]?.native}
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
    </>
  );
};

export default LanguageSettings;