import { 
  STORAGE_KEY, 
  DEFAULT_SETTINGS, 
  HIGH_CONTRAST_CSS_VARIABLES,
  FONT_SIZES 
} from './accessibilityConstants';

/**
 * Load accessibility settings from localStorage
 * @returns {Object} Settings object with defaults applied
 */
export const loadAccessibilitySettings = () => {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return { ...DEFAULT_SETTINGS, ...settings };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.warn('Failed to load accessibility settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save accessibility settings to localStorage
 * @param {Object} settings - Settings object to save
 */
export const saveAccessibilitySettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save accessibility settings:', error);
  }
};

/**
 * Apply high contrast CSS variables to document root
 * @param {boolean} enabled - Whether high contrast is enabled
 */
export const applyHighContrastMode = (enabled) => {
  const root = document.documentElement;
  
  if (enabled) {
    root.classList.add('high-contrast-mode');
    
    // Apply CSS custom properties
    Object.entries(HIGH_CONTRAST_CSS_VARIABLES).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  } else {
    root.classList.remove('high-contrast-mode');
    
    // Remove custom properties
    Object.keys(HIGH_CONTRAST_CSS_VARIABLES).forEach(property => {
      root.style.removeProperty(property);
    });
  }
};

/**
 * Apply font size to document root
 * @param {string} size - Font size key (small, medium, large)
 */
export const applyFontSize = (size) => {
  const root = document.documentElement;
  const fontSizeConfig = FONT_SIZES.find(config => config.value === size);
  
  if (fontSizeConfig) {
    root.style.fontSize = fontSizeConfig.size;
  } else {
    root.style.fontSize = '16px'; // Default fallback
  }
};

/**
 * Apply reduced motion setting
 * @param {boolean} enabled - Whether reduced motion is enabled
 */
export const applyReducedMotion = (enabled) => {
  const root = document.documentElement;
  
  if (enabled) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
};

/**
 * Get language display name by code
 * @param {string} langCode - Language code
 * @param {Array} languages - Array of language objects
 * @returns {string} Display name or fallback
 */
export const getLanguageDisplayName = (langCode, languages) => {
  const language = languages.find(lang => lang.code === langCode);
  return language ? language.name : 'English';
};

/**
 * Check if browser supports reduced motion preference
 * @returns {boolean} True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if browser supports high contrast preference
 * @returns {boolean} True if user prefers high contrast
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Detect system theme preference
 * @returns {string} 'dark' or 'light'
 */
export const getSystemThemePreference = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Apply all accessibility settings at once
 * @param {Object} settings - Complete settings object
 */
export const applyAllAccessibilitySettings = (settings) => {
  applyHighContrastMode(settings.highContrast);
  applyFontSize(settings.fontSize);
  applyReducedMotion(settings.reducedMotion);
};

/**
 * Reset all accessibility settings to defaults
 * @returns {Object} Default settings object
 */
export const resetAccessibilitySettings = () => {
  const root = document.documentElement;
  
  // Remove all accessibility classes and styles
  root.classList.remove('high-contrast-mode', 'reduce-motion');
  
  // Remove CSS custom properties
  Object.keys(HIGH_CONTRAST_CSS_VARIABLES).forEach(property => {
    root.style.removeProperty(property);
  });
  
  // Reset font size
  root.style.fontSize = '16px';
  
  // Clear localStorage
  localStorage.removeItem(STORAGE_KEY);
  
  return DEFAULT_SETTINGS;
};

/**
 * Validate settings object
 * @param {Object} settings - Settings to validate
 * @returns {Object} Validated settings with defaults applied
 */
export const validateSettings = (settings) => {
  const validated = { ...DEFAULT_SETTINGS };
  
  if (typeof settings.soundEffects === 'boolean') {
    validated.soundEffects = settings.soundEffects;
  }
  
  if (typeof settings.language === 'string') {
    validated.language = settings.language;
  }
  
  if (['small', 'medium', 'large'].includes(settings.fontSize)) {
    validated.fontSize = settings.fontSize;
  }
  
  if (typeof settings.highContrast === 'boolean') {
    validated.highContrast = settings.highContrast;
  }
  
  if (typeof settings.reducedMotion === 'boolean') {
    validated.reducedMotion = settings.reducedMotion;
  }
  
  return validated;
};

/**
 * Check if accessibility features are supported
 * @returns {Object} Support status for various features
 */
export const getAccessibilitySupport = () => {
  return {
    localStorage: typeof Storage !== 'undefined',
    matchMedia: typeof window.matchMedia === 'function',
    cssVariables: CSS.supports('color', 'var(--test)'),
    reducedMotion: window.matchMedia('(prefers-reduced-motion)').media !== 'not all',
    highContrast: window.matchMedia('(prefers-contrast)').media !== 'not all',
    colorScheme: window.matchMedia('(prefers-color-scheme)').media !== 'not all',
  };
};