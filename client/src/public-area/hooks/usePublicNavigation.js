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

  // Enhanced smooth navigation with dark mode support for AUTH pages
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

    // Check if dark mode is active
    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Step 3: Create and show overlay immediately with dark mode support
    const overlay = document.createElement("div");
    overlay.className = "enhanced-loading-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${
        isDarkMode ? "rgba(17, 24, 39, 0.95)" : "rgba(255, 255, 255, 0.95)"
      };
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transform: scale(0.98);
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;

    overlay.innerHTML = `
      <div class="flex flex-col items-center space-y-6">
        <!-- Groupify Logo Spinner with Dark Mode Support -->
        <div class="relative">
          <!-- Rotating ring around logo -->
          <div class="absolute inset-0 w-16 h-16 border-4 border-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 rounded-2xl animate-spin opacity-60" 
               style="mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite: xor; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; animation-duration: 2s;"></div>
          
          <!-- Logo container with pulse effect -->
          <div class="relative w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
            <!-- Camera Icon -->
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            
            <!-- Glow effect -->
            <div class="absolute inset-0 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
          </div>
        </div>
        
        <div class="text-center">
          <p class="${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          } font-medium mb-2">Loading...</p>
          <div class="w-32 h-1 ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          } rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full loading-shimmer"></div>
          </div>
        </div>
      </div>
    `;

    // Add shimmer animation styles
    const style = document.createElement("style");
    style.textContent = `
      @keyframes loading-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
      .loading-shimmer {
        animation: loading-shimmer 2s infinite;
      }
    `;
    document.head.appendChild(style);

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
            if (style.parentNode) {
              style.parentNode.removeChild(style);
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

  // Simple footer navigation (no animation, just scroll up and navigate)
  const handleFooterNavigation = (to) => {
    // Prevent multiple rapid clicks
    if (window.footerNavigationInProgress) return;
    window.footerNavigationInProgress = true;

    // Simply scroll to top immediately and navigate
    window.scrollTo(0, 0);

    // Navigate immediately after scroll
    setTimeout(() => {
      navigate(to);
      window.footerNavigationInProgress = false;
    }, 100); // Very short delay just to ensure scroll completes
  };

  const handleGetStarted = (e) => {
    e?.preventDefault();

    // Determine target path
    const targetPath = currentUser
      ? "/dashboard"
      : window.location.pathname === "/pricing"
      ? "/signup?plan=pro&billing=monthly&redirect=billing"
      : "/signup";

    // Use logo animation for auth navigation
    handleSmoothNavigation(targetPath);
  };

  const handleSignIn = (e) => {
    e?.preventDefault();
    // Use logo animation for sign in
    handleSmoothNavigation("/signin");
  };

  const handleSignUp = (e) => {
    e?.preventDefault();
    // Use logo animation for sign up
    handleSmoothNavigation("/signup");
  };

  // Settings functionality
  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  return {
    // Navigation functions
    handleSmoothNavigation, // Logo animation (for auth and CTAs)
    handleFooterNavigation, // Simple scroll (for footer links)
    handleGetStarted, // Logo animation (goes to auth)
    handleSignIn, // Logo animation (goes to auth)
    handleSignUp, // Logo animation (goes to auth)
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
      onSettingsClick: openAccessibilitySettings,
      handleSmoothNavigation, // Headers should use logo animation
    },
    footerProps: {
      handleSmoothNavigation: handleFooterNavigation, // Footer uses simple scroll for non-auth
      handleAuthNavigation: handleSmoothNavigation, // Footer auth links use logo animation
    },
    settingsProps: {
      isOpen: showSettings,
      onClose: closeSettings,
      theme,
      toggleTheme,
    },
  };
};
