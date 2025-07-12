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
  const { handleSmoothNavigation } = usePublicNavigation();

  const renderHeader = () => {
    switch (headerType) {
      case "home":
        return <HomeHeader {...headerProps} />;
      case "public":
        return <PublicHeader {...headerProps} />;
      case "none":
        return null;
      default:
        return <PublicHeader {...headerProps} />;
    }
  };

  const renderFooter = () => {
    const allFooterProps = {
      handleSmoothNavigation,
      ...footerProps,
    };

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
