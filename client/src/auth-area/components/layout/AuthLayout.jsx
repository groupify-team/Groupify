import React, { useEffect } from "react";
import AuthHeader from "./AuthHeader";

const AuthLayout = ({
  children,
  showHeader = true,
  headerProps = {},
  layoutType = "split",
  leftContent = null,
  className = "",
}) => {
  useEffect(() => {
    document.body.style.opacity = "1";
    document.body.style.transition = "opacity 0.5s ease-in-out";
    document.body.style.transform = "translateY(0)";
    return () => {
      document.body.style.transition = "";
      document.body.style.transform = "";
    };
  }, []);

  if (layoutType === "split") {
    return (
      <div
        className={`min-h-screen flex route-transition-enter route-transition-enter-active ${className}`}
      >
        {leftContent && (
          <div className="hidden md:flex md:flex-1">{leftContent}</div>
        )}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {showHeader && <AuthHeader {...headerProps} />}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    );
  }
  if (layoutType === "centered") {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-800 dark:to-gray-900 ${className}`}
      >
        {showHeader && <AuthHeader {...headerProps} />}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          {children}
        </main>
      </div>
    );
  }
  return (
    <div className={`min-h-screen ${className}`}>
      {showHeader && <AuthHeader {...headerProps} />}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default AuthLayout;
