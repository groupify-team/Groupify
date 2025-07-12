import React from "react";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";
import PublicHeader from "./PublicHeader";
import HomeHeader from "./HomeHeader";
import PublicFooter from "./PublicFooter";

const PublicLayout = ({
  children,
  headerType = "public", // "public", "home", "none"
  footerType = "default", // "default", "simple", "extended", "none"
  headerProps = {},
  footerProps = {},
  className = "",
  containerClassName = "",
}) => {
  const {
    handleSmoothNavigation,
    handleFooterNavigation,
    footerProps: defaultFooterProps,
  } = usePublicNavigation();

  // Debug: Let's make sure we have both functions
  console.log("Layout functions:", {
    hasHandleFooterNavigation: !!handleFooterNavigation,
    hasHandleSmoothNavigation: !!handleSmoothNavigation,
  });

  const renderHeader = () => {
    // Pass the logo animation function to headers
    const headerPropsWithNavigation = {
      ...headerProps,
      handleSmoothNavigation, // Logo animation for headers
    };

    switch (headerType) {
      case "home":
        return <HomeHeader {...headerPropsWithNavigation} />;
      case "public":
        return <PublicHeader {...headerPropsWithNavigation} />;
      case "none":
        return null;
      default:
        return <PublicHeader {...headerPropsWithNavigation} />;
    }
  };

  const renderFooter = () => {
    // Use the preconfigured footer props from the hook, merged with any custom props
    const allFooterProps = {
      ...defaultFooterProps, // This includes handleSmoothNavigation: handleFooterNavigation
      ...footerProps, // Allow overrides
    };

    console.log("Footer props:", allFooterProps); // Debug

    switch (footerType) {
      case "simple":
        return <PublicFooter variant="simple" {...allFooterProps} />;
      case "extended":
        return <PublicFooter variant="extended" {...allFooterProps} />;
      case "default":
        return <PublicFooter variant="default" {...allFooterProps} />;
      case "none":
        return null;
      default:
        return <PublicFooter variant="default" {...allFooterProps} />;
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500 ${className}`}
    >
      {renderHeader()}

      <main className={containerClassName}>{children}</main>

      {renderFooter()}
    </div>
  );
};

export default PublicLayout;
