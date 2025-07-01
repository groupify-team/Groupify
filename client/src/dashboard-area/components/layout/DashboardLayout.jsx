// DashboardLayout.jsx - Complete simple solution following PublicHeader pattern
import React, { useState, useEffect } from "react";
import { useDashboardData } from "@dashboard/hooks/useDashboardData";
import DashboardSidebar from "@dashboard/components/layout/DashboardSidebar";
import DashboardHeader from "@dashboard/components/layout/DashboardHeader";
import MobileBottomNav from "@dashboard/components/layout/MobileBottomNav";
import SettingsModal from "@dashboard/features/settings/components/SettingsModal";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useAuth } from "@/auth-area/contexts/AuthContext";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useNavigate } from "react-router-dom";

const DashboardLayout = ({ children }) => {
  const { loading } = useDashboardData();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Simple states - just like PublicHeader pattern
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const logoutModalRef = useClickOutside(() => setShowLogoutModal(false));

  // Escape key support
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (showLogoutModal) setShowLogoutModal(false);
        if (showSettingsModal) setShowSettingsModal(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showLogoutModal, showSettingsModal]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);

      // Auto-open sidebar on desktop, auto-close on mobile
      if (width >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Simple callback functions - like PublicHeader pattern
  const handleSettingsClick = () => {
    console.log("🎯 Settings clicked!");
    setShowSettingsModal(true);
  };

  const handleLogoutClick = () => {
    console.log("🎯 Logout clicked!");
    setShowLogoutModal(true);
  };

  const handleSidebarToggle = () => {
    console.log("🎯 Sidebar toggle clicked!");
    setSidebarOpen((prev) => !prev);
  };

  const closeSettingsModal = () => {
    console.log("🎯 Closing settings modal");
    setShowSettingsModal(false);
  };

  const closeLogoutModal = () => {
    console.log("🎯 Closing logout modal");
    setShowLogoutModal(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      console.log("🎯 Logging out user...");
      await logout(); // Call the real logout function
      closeLogoutModal();
      navigate("/", { replace: true }); // Redirect to HomePage
      console.log("✅ User logged out successfully");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // You could show an error message here if needed
    }
  };

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
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border-r border-white/20 dark:border-gray-700/50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <DashboardSidebar
          sidebarOpen={sidebarOpen}
          onSidebarClose={() => setSidebarOpen(false)}
          onLogoutClick={handleLogoutClick}
        />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          marginLeft: !isMobile && sidebarOpen ? "256px" : "0px",
        }}
      >
        {/* Header */}
        <DashboardHeader
          onSettingsClick={handleSettingsClick}
          onLogoutClick={handleLogoutClick}
          onSidebarToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-4 lg:px-8 max-w-full py-2 sm:py-4">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileBottomNav />}
      </div>

      {/* Settings Modal - Just like PublicHeader pattern */}
      {showSettingsModal && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={closeSettingsModal}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={closeLogoutModal}
        >
          <div
            ref={logoutModalRef}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Confirm Logout
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeLogoutModal}
                  className="smooth-hover flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="smooth-hover flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
