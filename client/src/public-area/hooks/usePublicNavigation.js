import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth-area/contexts/AuthContext.jsx";
import { useTheme } from "../../shared/contexts/ThemeContext";

export const usePublicNavigation = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  // Auto scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSmoothNavigation = (to, delay = 300) => {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.3s ease-out";
    
    setTimeout(() => {
      navigate(to);
    }, delay);
  };

  const handleGetStarted = (e) => {
  e?.preventDefault();
  
  // Set the fade-out animation
  document.body.style.transition = "opacity 0.2s ease-out";
  document.body.style.opacity = "0";

  // Navigate after fade completes
  setTimeout(() => {
    if (currentUser) {
      navigate("/dashboard");
    } else {
      // Check if we're on pricing page - suggest Pro plan
      if (window.location.pathname === "/pricing") {
        navigate("/signup?plan=pro&billing=monthly&redirect=billing");
      } else {
        // Default free signup
        navigate("/signup");
      }
    }
  }, 300);
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
      onSettingsClick: openSettings
    },
    settingsProps: {
      isOpen: showSettings,
      onClose: closeSettings,
      theme,
      toggleTheme
    }
  };
};