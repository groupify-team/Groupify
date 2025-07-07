import React, { useEffect } from "react";
import AuthHeader from "./AuthHeader";
import AccessibilityModal from "@shared/components/accessibility/AccessibilityModal";
import AccessibilityButton from "@shared/components/accessibility/AccessibilityButton";
import { useGlobalAccessibility } from "@shared/components/accessibility/hooks/useGlobalAccessibility";

const AuthLayout = ({
  children,
  showHeader = true,
  headerProps = {},
  layoutType = "split", // "split", "centered", "full"
  leftContent = null,
  className = "",
}) => {
  const { accessibilityModalProps, openAccessibilitySettings } =
    useGlobalAccessibility();
  // Enhanced fade-in effect on mount with proper cleanup
  useEffect(() => {
    // Reset any previous styles and add smooth entrance
    document.body.style.opacity = "1";
    document.body.style.transition = "opacity 0.5s ease-in-out";
    document.body.style.transform = "translateY(0)";

    // Cleanup function to reset styles when component unmounts
    return () => {
      document.body.style.transition = "";
      document.body.style.transform = "";
    };
  }, []);

  // Split layout (SignIn/SignUp style with left content, right form)
  if (layoutType === "split") {
    return (
      <div
        className={`min-h-screen flex route-transition-enter route-transition-enter-active ${className}`}
      >
        {/* Left Side - Content/Visual */}
        {leftContent && (
          <div className="hidden md:flex md:flex-1">{leftContent}</div>
        )}

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {showHeader && <AuthHeader {...headerProps} />}

          {/* Floating Accessibility Button when header is hidden */}
          {!showHeader && (
            <div className="absolute top-4 right-4 z-50">
              <AccessibilityButton
                onSettingsClick={openAccessibilitySettings}
                size="default"
                variant="default"
              />
            </div>
          )}

          <main className="flex-1">{children}</main>
        </div>

        {/* Global Accessibility Modal */}
        <AccessibilityModal {...accessibilityModalProps} />
      </div>
    );
  }

  // Centered layout (for forgot password, confirm email, etc.)
  if (layoutType === "centered") {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-800 dark:to-gray-900 ${className}`}
      >
        {showHeader && <AuthHeader {...headerProps} />}

        {/* Floating Accessibility Button when header is hidden */}
        {!showHeader && (
          <div className="absolute top-4 right-4 z-50">
            <AccessibilityButton
              onSettingsClick={openAccessibilitySettings}
              size="default"
              variant="default"
            />
          </div>
        )}

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          {children}
        </main>

        {/* Global Accessibility Modal */}
        <AccessibilityModal {...accessibilityModalProps} />
      </div>
    );
  }

  // Full layout (for special pages)
  return (
    <div className={`min-h-screen ${className}`}>
      {showHeader && <AuthHeader {...headerProps} />}

      {/* Floating Accessibility Button when header is hidden */}
      {!showHeader && (
        <div className="absolute top-4 right-4 z-50">
          <AccessibilityButton
            onSettingsClick={openAccessibilitySettings}
            size="default"
            variant="default"
          />
        </div>
      )}

      <main className="flex-1">{children}</main>

      {/* Global Accessibility Modal */}
      <AccessibilityModal {...accessibilityModalProps} />
    </div>
  );
};

export default AuthLayout;
