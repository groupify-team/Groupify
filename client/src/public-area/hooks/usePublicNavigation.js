import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/hooks/useAuth";
import { useTheme } from "@shared/contexts/ThemeContext";

export const usePublicNavigation = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  // Auto scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Enhanced smooth navigation with loading overlay
  const handleSmoothNavigation = (to, delay = 300) => {
    // Create loading overlay
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center transition-opacity duration-300";
    overlay.style.opacity = "0";
    overlay.innerHTML = `
      <div class="flex flex-col items-center space-y-4">
        <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p class="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    `;
    document.body.appendChild(overlay);

    // Fade in overlay
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    // Navigate after overlay is visible
    setTimeout(() => {
      navigate(to);

      // Remove overlay after navigation
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.style.opacity = "0";
          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, 300);
        }
      }, 100);
    }, delay);
  };

  const handleGetStarted = (e) => {
    e?.preventDefault();

    // Determine target path
    const targetPath = currentUser
      ? "/dashboard"
      : window.location.pathname === "/pricing"
      ? "/signup?plan=pro&billing=monthly&redirect=billing"
      : "/signup";

    handleSmoothNavigation(targetPath);
  };

  const handleSignIn = (e) => {
    e?.preventDefault();
    handleSmoothNavigation("/signin");
  };

  const handleSignUp = (e) => {
    e?.preventDefault();
    handleSmoothNavigation("/signup");
  };

  // Settings functionality
  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  return {
    // Navigation
    handleSmoothNavigation,
    handleGetStarted,
    handleSignIn,
    handleSignUp,
    currentUser,

    // Settings & Theme
    theme,
    toggleTheme,
    showSettings,
    openSettings,
    closeSettings,

    // Pre-configured props for components
    headerProps: {
      onSettingsClick: openSettings,
    },
    settingsProps: {
      isOpen: showSettings,
      onClose: closeSettings,
      theme,
      toggleTheme,
    },
  };
};
