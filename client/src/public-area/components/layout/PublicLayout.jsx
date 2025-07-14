import React from "react";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";
import PublicHeader from "./PublicHeader";
import HomeHeader from "./HomeHeader";
import PublicFooter from "./PublicFooter";
import FloatingAccessibilityButton from "@shared/components/accessibility/FloatingAccessibilityButton";

const PublicLayout = ({
  children,
  headerType = "public",
  footerType = "default",
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
  const renderHeader = () => {
    const headerPropsWithNavigation = {
      ...headerProps,
      handleSmoothNavigation,
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
    const allFooterProps = {
      ...defaultFooterProps,
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

      {/* Floating Accessibility Button */}
      <FloatingAccessibilityButton
        onSettingsClick={
          defaultFooterProps.onSettingsClick || headerProps.onSettingsClick
        }
      />
    </div>
  );
};

export default PublicLayout;
