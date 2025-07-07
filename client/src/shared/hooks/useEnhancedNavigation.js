// Enhanced Navigation Hook - Centralized smooth transitions
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

/**
 * Enhanced navigation hook that provides smooth transitions between routes
 * This replaces the old body opacity manipulation with proper loading overlays
 */
export const useEnhancedNavigation = () => {
  const navigate = useNavigate();

  const createLoadingOverlay = useCallback(() => {
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 bg-white/95 dark:bg-gray-900/95 z-50 flex items-center justify-center loading-overlay-enter";
    overlay.style.backdropFilter = "blur(4px)";
    overlay.style.WebkitBackdropFilter = "blur(4px)";
    overlay.innerHTML = `
      <div class="flex flex-col items-center space-y-6">
        <div class="relative">
          <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div class="absolute inset-0 w-10 h-10 border-4 border-transparent border-t-purple-400 rounded-full animate-spin opacity-30" 
               style="animation-direction: reverse; animation-duration: 1.5s;"></div>
        </div>
        <div class="text-center">
          <p class="text-gray-700 dark:text-gray-300 text-lg font-medium mb-3">Loading...</p>
          <div class="flex space-x-1 justify-center">
            <div class="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
            <div class="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
            <div class="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.4s;"></div>
          </div>
        </div>
      </div>
    `;
    return overlay;
  }, []);

  const removeLoadingOverlay = useCallback((overlay) => {
    if (overlay && overlay.parentNode) {
      overlay.classList.add("loading-overlay-exit-active");
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  }, []);

  const smoothNavigate = useCallback(
    (targetPath, options = {}) => {
      const { delay = 300, showLoader = true, replace = false } = options;

      if (showLoader) {
        const overlay = createLoadingOverlay();
        document.body.appendChild(overlay);

        // Fade in overlay
        requestAnimationFrame(() => {
          overlay.classList.add("loading-overlay-enter-active");
        });

        // Navigate after overlay is visible
        setTimeout(() => {
          navigate(targetPath, { replace });

          // Remove overlay after navigation
          setTimeout(() => {
            removeLoadingOverlay(overlay);
          }, 100);
        }, delay);
      } else {
        // Simple navigation without overlay
        setTimeout(() => {
          navigate(targetPath, { replace });
        }, delay);
      }
    },
    [navigate, createLoadingOverlay, removeLoadingOverlay]
  );

  return {
    smoothNavigate,
    navigate, // Keep original for backwards compatibility
  };
};

export default useEnhancedNavigation;
