import React from "react";
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
    switch (footerType) {
      case "simple":
        return <PublicFooter variant="simple" {...footerProps} />;
      case "extended":
        return <PublicFooter variant="extended" {...footerProps} />;
      case "default":
        return <PublicFooter variant="default" {...footerProps} />;
      case "none":
        return null;
      default:
        return <PublicFooter variant="default" {...footerProps} />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500 ${className}`}>
      {renderHeader()}
      
      <main className={containerClassName}>
        {children}
      </main>
      
      {renderFooter()}
    </div>
  );
};

export default PublicLayout;