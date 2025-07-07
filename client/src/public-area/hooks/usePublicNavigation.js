import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@auth/hooks/useAuth";
import { useGlobalAccessibility } from "@shared/components/accessibility/hooks/useGlobalAccessibility";

export const usePublicNavigation = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    theme,
    toggleTheme,
    showAccessibilityModal,
    openAccessibilitySettings,
    closeAccessibilitySettings,
    accessibilityButtonProps,
    accessibilityModalProps,
  } = useGlobalAccessibility();

  const [showSettings, setShowSettings] = useState(false);

  // Auto scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSmoothNavigation = (to, delay = 350) => {
    // Prevent multiple rapid clicks
    if (window.navigationInProgress) return;
    window.navigationInProgress = true;

    // Step 1: Immediately lock interactions and prepare for transition
    document.body.classList.add("navigation-locked");

    // Step 2: Hide current page content immediately for cleaner transition
    const currentPage = document.querySelector("main");
    if (currentPage) {
      currentPage.classList.add("page-fade-out");
    }

    // Step 3: Create and show overlay immediately with instant appearance
    const overlay = document.createElement("div");
    overlay.className = "enhanced-loading-overlay";
    overlay.style.cssText = `
      opacity: 0;
      transform: scale(0.98);
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;

    overlay.innerHTML = `
      <div class="flex flex-col items-center space-y-6">
        <div class="gradient-spinner"></div>
        <div class="text-center">
          <p class="text-gray-700 dark:text-gray-300 font-medium mb-2">Loading...</p>
          <div class="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full loading-shimmer"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Step 4: Animate overlay entrance immediately
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.opacity = "1";
        overlay.style.transform = "scale(1)";
      });
    });

    // Step 5: Wait for overlay to fully appear before navigating
    setTimeout(() => {
      navigate(to);

      // Step 6: Wait for new page to be ready, then clean up
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.style.opacity = "0";
          overlay.style.transform = "scale(0.98)";

          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
            document.body.classList.remove("navigation-locked");
            window.navigationInProgress = false;
          }, 400);
        } else {
          document.body.classList.remove("navigation-locked");
          window.navigationInProgress = false;
        }

        // Clean up current page styles
        if (currentPage) {
          currentPage.classList.remove("page-fade-out");
        }
      }, 150);
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

    // Accessibility
    showAccessibilityModal,
    openAccessibilitySettings,
    closeAccessibilitySettings,
    accessibilityButtonProps,
    accessibilityModalProps,

    // Pre-configured props for components
    headerProps: {
      onSettingsClick: openAccessibilitySettings, // Use accessibility settings instead
    },
    settingsProps: {
      isOpen: showSettings,
      onClose: closeSettings,
      theme,
      toggleTheme,
    },
  };
};
