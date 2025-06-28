import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/contexts/AuthContext";
import { ThemeProvider } from "@/shared/contexts/ThemeContext";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import CloudflareTurnstileGate from "@/shared/components/ui/CloudFlareTurnstileGate";
import SignIn from "@/features/auth/components/SignIn";
import SignUp from "@/features/auth/components/SignUp";
import ConfirmEmail from "@/features/auth/components/ConfirmEmail";
import HomePage from "@/pages/HomePage";
import LaunchAnimation from "@/features/auth/components/LaunchAnimation";
import Dashboard from "@/features/dashboard/pages/DashboardPage/DashboardPage";
import ForgotPassword from "@/features/auth/components/ForgotPassword";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import ContactUs from "@/pages/ContactUs";
import AboutUs from "@/pages/AboutUs";
import { Toaster } from "react-hot-toast";
import HelpCenter from "@/pages/HelpCenter";
import Careers from "@/pages/Careers";
import ResetPassword from "@/features/auth/components/ResetPassword";
import Blog from "@/pages/Blog";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Status from "@/pages/Status";
import Billing from "@/pages/Billing";

// Centralized Flow Controller - Handles ALL navigation logic
const FlowController = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLaunchAnimation, setShowLaunchAnimation] = useState(false);
  const [flowReady, setFlowReady] = useState(false);

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) return;

    const determineFlow = () => {
      const currentPath = location.pathname;
      const animationShown = sessionStorage.getItem("launch_animation_shown");
      const lastPageLoad = sessionStorage.getItem("last_page_load");
      const currentTime = Date.now();

      // Detect if this is a new session
      const isNewSession =
        !lastPageLoad || currentTime - parseInt(lastPageLoad) > 300000; // 5 minutes threshold

      console.log("Flow Controller:", {
        currentUser: !!currentUser,
        currentPath,
        animationShown,
        isNewSession,
        authLoading,
      });

      // === AUTHENTICATION-BASED ROUTING ===

      // 1. If user is logged in and tries to access auth pages, redirect to dashboard
      if (
        currentUser &&
        ["/signin", "/signup", "/forgot-password", "/reset-password"].includes(
          currentPath
        )
      ) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // 2. If user is logged in and on homepage, redirect to dashboard
      if (currentUser && currentPath === "/") {
        navigate("/dashboard", { replace: true });
        return;
      }

      // 3. If user is logged in and accessing allowed pages, proceed normally
      if (
        currentUser &&
        ![
          "/signin",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/",
        ].includes(currentPath)
      ) {
        console.log(
          "Flow: Logged-in user accessing allowed page → Direct access"
        );
        setShowLaunchAnimation(false);
        setFlowReady(true);
        return;
      }

      // === GUEST USER ROUTING ===

      // 4. If user is not logged in and on homepage
      if (!currentUser && currentPath === "/") {
        // Animation is handled by HomePage.jsx, proceed directly
        console.log("Flow: Guest user on homepage → Direct to homepage");
        setShowLaunchAnimation(false);
        setFlowReady(true);
        return;
      }

      // 5. If user is not logged in and accessing other public pages
      if (
        !currentUser &&
        [
          "/signin",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/terms",
          "/privacy-policy",
          "/contact",
          "/about",
          "/careers",
          "/help",
          "/confirm-email",
          "/blog",
          "/features",
          "/pricing",
          "/status",
        ].includes(currentPath)
      ) {
        console.log("Flow: Guest user accessing public page → Direct access");
        setShowLaunchAnimation(false);
        setFlowReady(true);
        return;
      }

      // 6. If user is not logged in and trying to access protected pages
      if (
        !currentUser &&
        ![
          "/signin",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/terms",
          "/privacy-policy",
          "/contact",
          "/about",
          "/careers",
          "/help",
          "/confirm-email",
          "/blog",
          "/features",
          "/pricing",
          "/status",
          "/",
        ].includes(currentPath)
      ) {
        console.log(
          "Flow: Guest user accessing protected page → Redirect to signin"
        );
        navigate("/signin", { replace: true });
        return;
      }

      // Default: proceed normally
      console.log("Flow: Default case → Direct access");
      setShowLaunchAnimation(false);
      setFlowReady(true);

      // Update session tracking
      sessionStorage.setItem("last_page_load", currentTime.toString());
    };

    determineFlow();
  }, [currentUser, authLoading, location.pathname, navigate]);

  const handleAnimationComplete = () => {
    console.log("Flow: Launch animation completed");
    sessionStorage.setItem("launch_animation_shown", "true");
    setShowLaunchAnimation(false);
    setFlowReady(true);
  };

  // Show loading while determining flow
  if (authLoading || (!flowReady && !showLaunchAnimation)) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center transition-all duration-500">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-800 dark:text-white font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show launch animation
  if (showLaunchAnimation) {
    return <LaunchAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  // Show main content
  return children;
};

// Simplified routing with centralized flow control
function App() {
  // Enable/disable Turnstile easily
  const ENABLE_TURNSTILE = true;

  const AppContent = () => (
    <Router>
      <AuthProvider>
        <FlowController>
          {/* Global Toast Notifications */}
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 3000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "14px",
                padding: "12px 16px",
                maxWidth: "400px",
              },
              success: {
                style: {
                  background: "#10B981",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#10B981",
                },
              },
              error: {
                style: {
                  background: "#EF4444",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#EF4444",
                },
              },
              loading: {
                style: {
                  background: "#3B82F6",
                },
              },
            }}
          />

          {/* Main App Layout */}
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />

              {/* Authentication Routes - FlowController handles redirects for logged-in users */}
              <Route
                path="/signin"
                element={
                  <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-800 dark:to-gray-900">
                    <SignIn />
                  </div>
                }
              />
              <Route
                path="/signup"
                element={
                  <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-800 dark:to-gray-900">
                    <SignUp />
                  </div>
                }
              />
              <Route
                path="/confirm-email"
                element={
                  <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 dark:from-gray-800 dark:to-gray-900">
                    <ConfirmEmail />
                  </div>
                }
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Legal & Info Pages */}
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/status" element={<Status />} />
              <Route path="/billing" element={<Billing />} />

              {/* Protected Routes - FlowController handles access control */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                      <Dashboard />
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                        404
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Page not found
                      </p>
                      <a
                        href="/"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Go Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </div>
        </FlowController>
      </AuthProvider>
    </Router>
  );

  return (
    <ThemeProvider>
      {ENABLE_TURNSTILE ? (
        <CloudflareTurnstileGate
          onVerificationComplete={(verified) => {
            console.log("Turnstile verification complete:", verified);
          }}
        >
          <AppContent />
        </CloudflareTurnstileGate>
      ) : (
        <AppContent />
      )}
    </ThemeProvider>
  );
}

export default App;
