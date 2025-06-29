import React, { useEffect } from "react";
import AuthHeader from "./AuthHeader";

const AuthLayout = ({ 
  children, 
  showHeader = true,
  headerProps = {},
  layoutType = "split", // "split", "centered", "full"
  leftContent = null,
  rightContent = null,
  className = ""
}) => {
  // Add fade-in effect on mount
  useEffect(() => {
    document.body.style.opacity = "1";
    document.body.style.transition = "opacity 0.5s ease-in-out";
  }, []);

  // Split layout (SignIn/SignUp style with left content, right form)
  if (layoutType === "split") {
    return (
      <div className={`min-h-screen flex ${className}`}>
        {/* Left Side - Content/Visual */}
        {leftContent && (
          <div className="hidden lg:flex lg:flex-1">
            {leftContent}
          </div>
        )}

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {showHeader && (
            <AuthHeader {...headerProps} />
          )}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Centered layout (for forgot password, confirm email, etc.)
  if (layoutType === "centered") {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-800 dark:to-gray-900 ${className}`}>
        {showHeader && (
          <AuthHeader {...headerProps} />
        )}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          {children}
        </main>
      </div>
    );
  }

  // Full layout (for special pages)
  return (
    <div className={`min-h-screen ${className}`}>
      {showHeader && (
        <AuthHeader {...headerProps} />
      )}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;