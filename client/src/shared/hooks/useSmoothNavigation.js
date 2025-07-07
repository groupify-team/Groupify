import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

// Enhanced navigation with smooth transitions
export const useSmoothNavigation = () => {
  const navigate = useNavigate();

  // Smooth navigation with improved loading states
  const navigateWithTransition = useCallback(
    (targetPath, options = {}) => {
      const {
        duration = 300,
        showLoadingOverlay = true,
        onTransitionStart,
        onTransitionComplete,
      } = options;

      // Call start callback
      if (onTransitionStart) {
        onTransitionStart();
      }

      // Create loading overlay if requested
      if (showLoadingOverlay) {
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
          navigate(targetPath);

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

            // Call completion callback
            if (onTransitionComplete) {
              onTransitionComplete();
            }
          }, 100);
        }, duration);
      } else {
        // Simple navigation without overlay
        setTimeout(() => {
          navigate(targetPath);
          if (onTransitionComplete) {
            onTransitionComplete();
          }
        }, duration);
      }
    },
    [navigate]
  );

  // Quick navigation for immediate transitions
  const navigateQuick = useCallback(
    (targetPath) => {
      navigate(targetPath);
    },
    [navigate]
  );

  // Page transition with fade effect
  const navigateWithFade = useCallback(
    (targetPath, duration = 300) => {
      document.body.style.transition = `opacity ${duration}ms ease-in-out`;
      document.body.style.opacity = "0";

      setTimeout(() => {
        navigate(targetPath);
        // Reset opacity when new page loads
        setTimeout(() => {
          document.body.style.opacity = "1";
        }, 50);
      }, duration);
    },
    [navigate]
  );

  // Navigation with slide effect
  const navigateWithSlide = useCallback(
    (targetPath, direction = "left", duration = 300) => {
      document.body.style.transition = `transform ${duration}ms ease-in-out, opacity ${duration}ms ease-in-out`;
      document.body.style.transform = `translateX(${
        direction === "left" ? "-100%" : "100%"
      })`;
      document.body.style.opacity = "0";

      setTimeout(() => {
        navigate(targetPath);
        // Reset transform when new page loads
        setTimeout(() => {
          document.body.style.transform = "translateX(0)";
          document.body.style.opacity = "1";
        }, 50);
      }, duration);
    },
    [navigate]
  );

  // Reset any body styles that might have been applied
  const resetBodyStyles = useCallback(() => {
    document.body.style.transition = "";
    document.body.style.opacity = "1";
    document.body.style.transform = "";
  }, []);

  return {
    navigateWithTransition,
    navigateQuick,
    navigateWithFade,
    navigateWithSlide,
    resetBodyStyles,
  };
};

export default useSmoothNavigation;
