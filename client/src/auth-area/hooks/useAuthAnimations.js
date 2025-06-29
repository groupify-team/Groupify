import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export const useAuthAnimations = () => {
  const navigate = useNavigate();

  // Navigate with smooth transition
  const navigateWithTransition = useCallback((targetPath, options = {}) => {
    document.body.style.transition = "opacity 0.3s ease-out";
    document.body.style.opacity = "0";

    setTimeout(() => {
      navigate(targetPath, options);
    }, 300);
  }, [navigate]);

  // Smooth page transition with fade
  const smoothTransition = useCallback((targetPath, delay = 300) => {
    document.body.style.transition = "opacity 0.3s ease-out";
    document.body.style.opacity = "0";

    setTimeout(() => {
      navigate(targetPath);
    }, delay);
  }, [navigate]);

  // Fade in effect for page load
  const fadeIn = useCallback((duration = 500) => {
    document.body.style.transition = `opacity ${duration}ms ease-in-out`;
    document.body.style.opacity = "1";
  }, []);

  // Reset body styles
  const resetBodyStyles = useCallback(() => {
    document.body.style.transition = "";
    document.body.style.opacity = "1";
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
    shakeForm
  };
};