import React, { useState, useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Keep core providers and auth components as regular imports (they're needed immediately)
import { AuthProvider, useAuth } from "@/auth-area/contexts/AuthContext";
import { ThemeProvider } from "@shared/contexts/ThemeContext";
import ProtectedRoute from "@/auth-area/components/ProtectedRoute";
import CloudflareTurnstileGate from "@/shared/components/ui/CloudFlareTurnstileGate";
import GlobalAccessibilityProvider from "@/shared/components/accessibility/GlobalAccessibilityProvider";
import LaunchAnimation from "@/auth-area/components/ui/LaunchAnimation";

// Toast notifications (small, needed globally)
import { Toaster } from "react-hot-toast";

// ===============================================
// LAZY LOADED COMPONENTS - This is the key optimization!
// ===============================================

// Auth Area Components - Convert to lazy loading
const SignInPage = React.lazy(() =>
  import("@/auth-area/pages/SignInPage/SignInPage")
);
const SignUpPage = React.lazy(() =>
  import("@/auth-area/pages/SignUpPage/SignUpPage")
);
const ConfirmEmailPage = React.lazy(() =>
  import("@/auth-area/pages/ConfirmEmailPage/ConfirmEmailPage")
);
const ForgotPasswordPage = React.lazy(() =>
  import("@/auth-area/pages/ForgotPasswordPage/ForgotPasswordPage")
);
const ResetPasswordPage = React.lazy(() =>
  import("@/auth-area/pages/ResetPasswordPage/ResetPasswordPage")
);

// Public Area Pages - Convert to lazy loading
const HomePage = React.lazy(() =>
  import("./public-area/pages/HomePage/HomePage")
);
const TermsOfService = React.lazy(() =>
  import("./public-area/pages/TermsOfServicePage/TermsOfServicePage")
);
const PrivacyPolicy = React.lazy(() =>
  import("./public-area/pages/PrivacyPolicyPage/PrivacyPolicyPage")
);
const ContactUs = React.lazy(() =>
  import("./public-area/pages/ContactPage/ContactPage")
);
const AboutUs = React.lazy(() =>
  import("./public-area/pages/AboutPage/AboutPage")
);
const HelpCenter = React.lazy(() =>
  import("./public-area/pages/HelpCenterPage/HelpCenterPage")
);
const Careers = React.lazy(() =>
  import("./public-area/pages/CareersPage/CareersPage")
);
const Blog = React.lazy(() => import("./public-area/pages/BlogPage/BlogPage"));
const Features = React.lazy(() =>
  import("./public-area/pages/FeaturesPage/FeaturesPage")
);
const Pricing = React.lazy(() =>
  import("./public-area/pages/PricingPage/PricingPage")
);
const Status = React.lazy(() =>
  import("./public-area/pages/StatusPage/StatusPage")
);
const Billing = React.lazy(() =>
  import("./public-area/pages/BillingPage/BillingPage")
);

// Dashboard Area Components - Convert to lazy loading
const Dashboard = React.lazy(() =>
  import("@/dashboard-area/pages/DashboardPage")
);
const TripsSection = React.lazy(() =>
  import("@/dashboard-area/components/sections/TripsSection")
);
const TripDetailView = React.lazy(() =>
  import("@/dashboard-area/features/trips/ViewTrip/TripDetailView")
);
const SettingsSection = React.lazy(() =>
  import("@/dashboard-area/components/sections/SettingsSection")
);
const FriendsSection = React.lazy(() =>
  import("@/dashboard-area/components/sections/FriendsSection")
);

// ===============================================
// LOADING COMPONENT - Reusable loading spinner
// ===============================================
const PageLoadingSpinner = ({ message = "Loading..." }) => (
  <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center transition-all duration-500">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-xl text-gray-800 dark:text-white font-medium">
        {message}
      </p>
    </div>
  </div>
);

// ===============================================
// SUSPENSE WRAPPER - Wraps lazy components with loading
// ===============================================
const SuspenseWrapper = ({ children, fallback }) => (
  <Suspense fallback={fallback || <PageLoadingSpinner />}>{children}</Suspense>
);

// Dashboard Placeholder Component (keep as regular component since it's small)
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

// FlowController component (unchanged - keeping your logic intact)
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
    return <PageLoadingSpinner message="Loading..." />;
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
        <GlobalAccessibilityProvider>
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
                {/* Public Routes - Now with Suspense wrapper */}
                <Route
                  path="/"
                  element={
                    <SuspenseWrapper
                      fallback={
                        <PageLoadingSpinner message="Loading homepage..." />
                      }
                    >
                      <div className="page-enter">
                        <HomePage />
                      </div>
                    </SuspenseWrapper>
                  }
                />

                {/* Authentication Routes - Now with Suspense wrapper */}
                <Route
                  path="/signin"
                  element={
                    <SuspenseWrapper
                      fallback={
                        <PageLoadingSpinner message="Loading sign in..." />
                      }
                    >
                      <div className="page-enter">
                        <SignInPage />
                      </div>
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <SuspenseWrapper
                      fallback={
                        <PageLoadingSpinner message="Loading sign up..." />
                      }
                    >
                      <div className="page-enter">
                        <SignUpPage />
                      </div>
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/confirm-email"
                  element={
                    <SuspenseWrapper>
                      <div className="page-enter">
                        <ConfirmEmailPage />
                      </div>
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <SuspenseWrapper>
                      <div className="page-enter">
                        <ForgotPasswordPage />
                      </div>
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <SuspenseWrapper>
                      <div className="page-enter">
                        <ResetPasswordPage />
                      </div>
                    </SuspenseWrapper>
                  }
                />

                {/* Legal & Info Pages - Now with Suspense wrapper */}
                <Route
                  path="/terms"
                  element={
                    <SuspenseWrapper>
                      <div className="page-enter">
                        <TermsOfService />
                      </div>
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/privacy-policy"
                  element={
                    <SuspenseWrapper>
                      <div className="page-enter">
                        <PrivacyPolicy />
                      </div>
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <SuspenseWrapper>
                      <div className="page-enter">
                        <ContactUs />
                      </div>
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <SuspenseWrapper>
                      <AboutUs />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/careers"
                  element={
                    <SuspenseWrapper>
                      <Careers />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/help"
                  element={
                    <SuspenseWrapper>
                      <HelpCenter />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/blog"
                  element={
                    <SuspenseWrapper>
                      <Blog />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/features"
                  element={
                    <SuspenseWrapper>
                      <Features />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/pricing"
                  element={
                    <SuspenseWrapper>
                      <Pricing />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/status"
                  element={
                    <SuspenseWrapper>
                      <Status />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <SuspenseWrapper>
                      <Billing />
                    </SuspenseWrapper>
                  }
                />

                {/* Protected Routes - Now with Suspense wrapper */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper
                        fallback={
                          <PageLoadingSpinner message="Loading dashboard..." />
                        }
                      >
                        <div className="smooth-page-transition">
                          <Dashboard />
                        </div>
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <SuspenseWrapper>
                        <div className="animate-fade-in-smooth">
                          <TripsSection />
                        </div>
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="trips"
                    element={
                      <SuspenseWrapper>
                        <div className="animate-fade-in-smooth">
                          <TripsSection />
                        </div>
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="trip/:tripId"
                    element={
                      <SuspenseWrapper>
                        <div className="animate-fade-in-smooth">
                          <TripDetailView />
                        </div>
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="friends"
                    element={
                      <SuspenseWrapper>
                        <div className="animate-fade-in-smooth">
                          <FriendsSection />
                        </div>
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <SuspenseWrapper>
                        <div className="animate-fade-in-smooth">
                          <SettingsSection />
                        </div>
                      </SuspenseWrapper>
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
        </GlobalAccessibilityProvider>
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
