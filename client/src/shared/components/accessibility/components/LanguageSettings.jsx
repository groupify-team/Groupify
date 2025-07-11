import React from "react";
import {
  LanguageIcon,
  ChevronDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
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
  // Flag component
  const FlagImage = ({ langCode, size = "small", className = "" }) => {
    const sizes = {
      small: "w-6 h-4",
      medium: "w-8 h-6",
      large: "w-24 h-16",
      badge: "w-4 h-3",
    };

    const [imageError, setImageError] = React.useState(false);

    const handleImageError = () => {
      setImageError(true);
    };

    // Fallback to emoji if image fails
    if (imageError) {
      const emojiFlags = {
        en: "🇺🇸",
        es: "🇪🇸",
        fr: "🇫🇷",
        de: "🇩🇪",
        he: "🇮🇱",
        ar: "🇸🇦",
        ru: "🇷🇺",
      };

      return (
        <span
          className={`${sizes[size]} ${className} flex items-center justify-center text-lg`}
          style={{ fontFamily: "system-ui, -apple-system" }}
          title={`${
            LANGUAGES.find((lang) => lang.code === langCode)?.name
          } flag`}
        >
          {emojiFlags[langCode] || "🌐"}
        </span>
      );
    }

    return (
      <img
        src={`/flags/${langCode}.png`}
        alt={`${LANGUAGES.find((lang) => lang.code === langCode)?.name} flag`}
        className={`${sizes[size]} object-cover rounded-sm border border-gray-200 dark:border-gray-600 flex-shrink-0 ${className}`}
        onError={handleImageError}
        loading="lazy"
      />
    );
  };

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
                <FlagImage langCode={language} size="small" className="mr-3" />
                <span>
                  {LANGUAGES.find((lang) => lang.code === language)?.name ||
                    "English"}
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
                    <FlagImage
                      langCode={lang.code}
                      size="small"
                      className="mr-3"
                    />
                    <div className="flex-1">
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

      {/* SIMPLE: Language modal with backdrop that blocks everything */}
      {showLanguageModal && (
        <>
          {/* Backdrop that blocks all clicks */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 rounded-2xl animate-fade-in"
            onClick={() => setShowLanguageModal(false)}
          />

          {/* Modal positioned above footer */}
          <div
            className="absolute inset-x-4 z-30"
            style={{
              top: "20%",
              bottom: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-xs p-6 shadow-2xl border border-gray-200 dark:border-gray-700 relative animate-slide-in-scale"
              style={{ pointerEvents: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mb-4">
                  <FlagImage
                    langCode={pendingLanguage}
                    size="large"
                    className="mx-auto shadow-lg border-2"
                  />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Language Coming Soon!
                </h3>

                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    <FlagImage
                      langCode={pendingLanguage}
                      size="badge"
                      className="mr-2"
                    />
                    {
                      LANGUAGES.find((lang) => lang.code === pendingLanguage)
                        ?.name
                    }
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {LANGUAGE_MESSAGES[pendingLanguage]?.english}
                  </p>
                  <div className="border-t pt-3">
                    <p
                      className="text-gray-600 dark:text-gray-400 leading-relaxed"
                      style={{
                        fontFamily:
                          pendingLanguage === "he" || pendingLanguage === "ar"
                            ? "system-ui, -apple-system"
                            : "inherit",
                        direction:
                          pendingLanguage === "he" || pendingLanguage === "ar"
                            ? "rtl"
                            : "ltr",
                      }}
                    >
                      {LANGUAGE_MESSAGES[pendingLanguage]?.native}
                    </p>
                  </div>
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
        </>
      )}
    </>
  );
};

export default LanguageSettings;
