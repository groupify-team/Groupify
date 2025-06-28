// DashboardLayout.jsx - Main dashboard layout wrapper
import React from "react";
import { useDashboardLayout } from "@dashboard/hooks/useDashboardLayout";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import DashboardSidebar from "@dashboard/components/layout/DashboardSidebar";
import DashboardHeader from "@dashboard/components/layout/DashboardHeader";
import MobileBottomNav from "@dashboard/components/layout/MobileBottomNav";

const DashboardLayout = ({ children }) => {
  const {
    layout,
    utils: { getLayoutClasses, shouldShowMobileNav, shouldShowDesktopSidebar },
  } = useDashboardLayout();

  const { loading } = useDashboardData();

  const layoutClasses = getLayoutClasses();

  // Show loading screen while data is loading
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex flex-col items-center justify-center transition-all duration-500">
        <div className="text-center">
          {/* Site Logo */}
          <div className="relative mb-8">
            <img
              src="/groupifyLogo.png"
              alt="Groupify Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain animate-pulse drop-shadow-2xl mx-auto"
            />
            {/* Glow Effect around logo */}
            <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl animate-pulse mx-auto"></div>
          </div>

          {/* Brand Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-8 animate-pulse leading-relaxed pb-2">
            Groupify
          </h1>

          {/* Loading Spinner */}
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-6"></div>

          {/* Loading Text */}
          <p className="text-xl text-gray-800 dark:text-white font-medium mb-2">
            Loading your dashboard...
          </p>

          {/* Subtitle */}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Preparing your personalized experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex w-full transition-colors duration-500">
      {/* Desktop Sidebar */}
      {shouldShowDesktopSidebar() && <DashboardSidebar />}

      {/* Sidebar Overlay for Mobile */}
      {layout.sidebarOpen && layout.isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            // This will be handled by the parent component's sidebar toggle
          }}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${layoutClasses.main} overflow-hidden`}
      >
        {/* Header */}
        <DashboardHeader />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div
            className={`w-full px-2 sm:px-4 lg:px-8 max-w-full ${layoutClasses.content}`}
          >
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {shouldShowMobileNav() && <MobileBottomNav />}
      </div>
    </div>
  );
};

export default DashboardLayout;
