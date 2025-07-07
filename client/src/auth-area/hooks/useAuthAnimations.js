import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export const useAuthAnimations = () => {
  const navigate = useNavigate();

  // Enhanced navigation with smooth loading overlay
  const navigateWithTransition = useCallback(
    (targetPath, options = {}) => {
      const { replace = false, showLoadingOverlay = true } = options;

      if (showLoadingOverlay) {
        // Create and show loading overlay
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

        // Fade in overlay smoothly
        requestAnimationFrame(() => {
          overlay.style.opacity = "1";
        });

        // Navigate after overlay is visible
        setTimeout(() => {
          navigate(targetPath, { replace });

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
        }, 300);
      } else {
        // Simple navigation without overlay
        setTimeout(() => {
          navigate(targetPath, { replace });
        }, 150);
      }
    },
    [navigate]
  );

  // Legacy smooth transition for backward compatibility
  const smoothTransition = useCallback(
    (targetPath) => {
      navigateWithTransition(targetPath, { showLoadingOverlay: true });
    },
    [navigateWithTransition]
  );

  // Fade in effect for page load
  const fadeIn = useCallback((duration = 500) => {
    document.body.style.transition = `opacity ${duration}ms ease-in-out`;
    document.body.style.opacity = "1";
  }, []);

  // Reset body styles
  const resetBodyStyles = useCallback(() => {
    document.body.style.transition = "";
    document.body.style.opacity = "1";
    document.body.style.transform = "";
  }, []);

  // Form shake animation for errors
  const shakeForm = useCallback((formRef) => {
    if (formRef.current) {
      formRef.current.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.style.animation = "";
        }
      }, 500);
    }
  }, []);

  return {
    navigateWithTransition,
    smoothTransition,
    fadeIn,
    resetBodyStyles,
    shakeForm,
  };
};
