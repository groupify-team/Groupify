// ===== Accessibility Constants =====

export const FONT_SIZES = [
  { value: "small", label: "Small", size: "14px" },
  { value: "medium", label: "Medium", size: "16px" },
  { value: "large", label: "Large", size: "18px" },
];

export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
];

export const LANGUAGE_MESSAGES = {
  es: {
    english: "We're working on Spanish language support. Coming soon!",
    native: "Estamos trabajando en el soporte del idioma español. ¡Próximamente!",
  },
  fr: {
    english: "We're working on French language support. Coming soon!",
    native: "Nous travaillons sur le support de la langue française. Bientôt disponible !",
  },
  de: {
    english: "We're working on German language support. Coming soon!",
    native: "Wir arbeiten an der deutschen Sprachunterstützung. Bald verfügbar!",
  },
  he: {
    english: "We're working on Hebrew language support. Coming soon!",
    native: "אנחנו עובדים על תמיכה בשפה העברית. בקרוב!",
  },
};

export const DEFAULT_SETTINGS = {
  soundEffects: true,
  language: "en",
  fontSize: "medium",
  highContrast: false,
  reducedMotion: false,
};

export const STORAGE_KEY = "groupify-accessibility-settings";

export const HIGH_CONTRAST_CSS_VARIABLES = {
  '--contrast-text-primary': '#000000',
  '--contrast-text-secondary': '#000000',
  '--contrast-bg-primary': '#ffffff',
  '--contrast-bg-secondary': '#f5f5f5',
  '--contrast-border': '#000000',
  '--contrast-link': '#0000ee',
  '--contrast-link-visited': '#551a8b',
  '--contrast-button-bg': '#000000',
  '--contrast-button-text': '#ffffff',
  '--contrast-input-bg': '#ffffff',
  '--contrast-input-border': '#000000',
  '--contrast-focus-color': '#ffff00'
};

export const WCAG_COMPLIANCE = {
  FONT_SIZE_AA: "14px", // Minimum for WCAG AA
  FONT_SIZE_AAA: "18px", // Recommended for WCAG AAA
  CONTRAST_RATIO_AA: 4.5, // Normal text
  CONTRAST_RATIO_AAA: 7, // Enhanced contrast
  FOCUS_OUTLINE_WIDTH: "3px",
};

export const ANIMATION_CLASSES = {
  REDUCE_MOTION: "reduce-motion",
  HIGH_CONTRAST: "high-contrast-mode",
};


