import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Updated imports for refactored auth structure
import { AuthProvider, useAuth } from "@/auth-area/contexts/AuthContext";
import { ThemeProvider } from "@/shared/contexts/ThemeContext";
import ProtectedRoute from "@/auth-area/components/ProtectedRoute";
import CloudflareTurnstileGate from "@/shared/components/ui/CloudFlareTurnstileGate";

// Auth Area Components - Updated paths for refactored structure
import SignInPage from "@/auth-area/pages/SignInPage/SignInPage";
import SignUpPage from "@/auth-area/pages/SignUpPage/SignUpPage";
import ConfirmEmailPage from "@/auth-area/pages/ConfirmEmailPage/ConfirmEmailPage";
import ForgotPasswordPage from "@/auth-area/pages/ForgotPasswordPage/ForgotPasswordPage";
import ResetPasswordPage from "@/auth-area/pages/ResetPasswordPage/ResetPasswordPage";
import LaunchAnimation from "@/auth-area/components/ui/LaunchAnimation";

// Public Area Pages
import HomePage from "./public-area/pages/HomePage/HomePage";
import TermsOfService from "./public-area/pages/TermsOfServicePage/TermsOfServicePage";
import PrivacyPolicy from "./public-area/pages/PrivacyPolicyPage/PrivacyPolicyPage";
import ContactUs from "./public-area/pages/ContactPage/ContactPage";
import AboutUs from "./public-area/pages/AboutPage/AboutPage";
import HelpCenter from "./public-area/pages/HelpCenterPage/HelpCenterPage";
import Careers from "./public-area/pages/CareersPage/CareersPage";
import Blog from "./public-area/pages/BlogPage/BlogPage";
import Features from "./public-area/pages/FeaturesPage/FeaturesPage";
import Pricing from "./public-area/pages/PricingPage/PricingPage";
import Status from "./public-area/pages/StatusPage/StatusPage";
import Billing from "./public-area/pages/BillingPage/BillingPage";

// Dashboard Area Components - Temporarily disabled
import Dashboard from "@/dashboard-area/pages/DashboardPage";
import DashboardLayout from "@/dashboard-area/components/layout/DashboardLayout";
import TripsSection from "@/dashboard-area/components/sections/TripsSection";
import TripDetailView from "@/dashboard-area/features/trips/ViewTrip/TripDetailView";
import SettingsSection from "@/dashboard-area/components/sections/SettingsSection";
import FriendsSection from "@/dashboard-area/components/sections/FriendsSection";

// Toast notifications
import { Toaster } from "react-hot-toast";

// Dashboard Placeholder Component
const DashboardPlaceholder = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          🚧 Dashboard Coming Soon
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Dashboard components are being developed. You're successfully logged
          in!
        </p>
        <div className="space-y-4">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Visit Homepage (Logged In)
          </button>
          <button
            onClick={handleSignOut}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Sign Out & Test Auth Flow
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Auth area refactoring is complete! 🎉
        </p>
      </div>
    </div>
  );
};

// Updated FlowController component with improved Turnstile logic
const FlowController = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLaunchAnimation, setShowLaunchAnimation] = useState(false);
  const [flowReady, setFlowReady] = useState(false);
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [showTurnstile, setShowTurnstile] = useState(false);

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) return;

    const determineFlow = () => {
      const currentPath = location.pathname;
      const animationShown = sessionStorage.getItem("launch_animation_shown");
      const turnstileVerifiedSession =
        sessionStorage.getItem("turnstile_verified");
      const turnstileTimestamp = sessionStorage.getItem("turnstile_timestamp");
      const lastPageLoad = sessionStorage.getItem("last_page_load");
      const currentTime = Date.now();

      // Enhanced session detection logic
      const isFirstVisit = !turnstileVerifiedSession && !turnstileTimestamp;
      const turnstileAge = turnstileTimestamp
        ? currentTime - parseInt(turnstileTimestamp)
        : Infinity;
      const isExpiredSession = turnstileAge > 24 * 60 * 60 * 1000; // 24 hours instead of 5 minutes
      const isLongAbsence = lastPageLoad
        ? currentTime - parseInt(lastPageLoad) > 4 * 60 * 60 * 1000
        : false; // 4 hours

      // Only show Turnstile for:
      // 1. First-time visitors
      // 2. Users who haven't been verified in 24 hours
      // 3. Users who have been away for more than 4 hours
      const shouldShowTurnstile =
        isFirstVisit || isExpiredSession || isLongAbsence;

      console.log("Flow Controller Debug:", {
        currentUser: !!currentUser,
        currentPath,
        isFirstVisit,
        turnstileAge: Math.round(turnstileAge / (60 * 1000)), // minutes
        isExpiredSession,
        isLongAbsence,
        shouldShowTurnstile,
        authLoading,
      });

      // === TURNSTILE VERIFICATION CHECK ===
      if (shouldShowTurnstile) {
        console.log("Flow: Showing Turnstile verification");
        setShowTurnstile(true);
        setFlowReady(false);
        return;
      } else {
        // Session is valid, proceed with normal flow
        setTurnstileVerified(true);
        setShowTurnstile(false);
      }

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
        navigate("/signin", { replace: true });
        return;
      }

      // Default: proceed normally
      setShowLaunchAnimation(false);
      setFlowReady(true);

      // Update session tracking - only update page load time, not verification
      sessionStorage.setItem("last_page_load", currentTime.toString());
    };

    // Only run flow determination if Turnstile is verified or not needed
    if (turnstileVerified || !showTurnstile) {
      determineFlow();
    }
  }, [
    currentUser,
    authLoading,
    location.pathname,
    navigate,
    turnstileVerified,
    showTurnstile,
  ]);

  const handleTurnstileComplete = (verified, token) => {
    if (verified) {
      const currentTime = Date.now();

      // Store verification with timestamp
      sessionStorage.setItem("turnstile_verified", "true");
      sessionStorage.setItem("turnstile_token", token);
      sessionStorage.setItem("turnstile_timestamp", currentTime.toString());
      sessionStorage.setItem("last_page_load", currentTime.toString());

      setTurnstileVerified(true);
      setShowTurnstile(false);
      // Flow will continue automatically via useEffect
    }
  };

  const handleAnimationComplete = () => {
    sessionStorage.setItem("launch_animation_shown", "true");
    setShowLaunchAnimation(false);
    setFlowReady(true);
  };

  // Show Turnstile verification first
  if (showTurnstile) {
    return (
      <CloudflareTurnstileGate onVerificationComplete={handleTurnstileComplete}>
        <div>Turnstile Verified</div>
      </CloudflareTurnstileGate>
    );
  }

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
  const AppContent = () => (
    <Router>
      <AuthProvider>
        <FlowController>
          {/* Global Toast Notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              className: "z-[70]",
            }}
          />

          {/* Main App Layout */}
          <div className="transition-all duration-500 ease-in-out">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/"
                element={
                  <div className="page-enter">
                    <HomePage />
                  </div>
                }
              />

              {/* Authentication Routes - Updated to use refactored components */}
              <Route
                path="/signin"
                element={
                  <div className="page-enter">
                    <SignInPage />
                  </div>
                }
              />
              <Route
                path="/signup"
                element={
                  <div className="page-enter">
                    <SignUpPage />
                  </div>
                }
              />
              <Route
                path="/confirm-email"
                element={
                  <div className="page-enter">
                    <ConfirmEmailPage />
                  </div>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <div className="page-enter">
                    <ForgotPasswordPage />
                  </div>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <div className="page-enter">
                    <ResetPasswordPage />
                  </div>
                }
              />

              {/* Legal & Info Pages */}
              <Route
                path="/terms"
                element={
                  <div className="page-enter">
                    <TermsOfService />
                  </div>
                }
              />
              <Route
                path="/privacy-policy"
                element={
                  <div className="page-enter">
                    <PrivacyPolicy />
                  </div>
                }
              />
              <Route
                path="/contact"
                element={
                  <div className="page-enter">
                    <ContactUs />
                  </div>
                }
              />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/status" element={<Status />} />
              <Route path="/billing" element={<Billing />} />

              {/* Protected Routes - Restored to Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div className="smooth-page-transition">
                      <Dashboard />
                    </div>
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <div className="animate-fade-in-smooth">
                      <TripsSection />
                    </div>
                  }
                />
                <Route
                  path="trips"
                  element={
                    <div className="animate-fade-in-smooth">
                      <TripsSection />
                    </div>
                  }
                />
                <Route
                  path="trip/:tripId"
                  element={
                    <div className="animate-fade-in-smooth">
                      <TripDetailView />
                    </div>
                  }
                />
                <Route
                  path="friends"
                  element={
                    <div className="animate-fade-in-smooth">
                      <FriendsSection />
                    </div>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <div className="animate-fade-in-smooth">
                      <SettingsSection />
                    </div>
                  }
                />
              </Route>

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
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
