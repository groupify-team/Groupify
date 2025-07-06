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

// Toast notifications
import { Toaster } from "react-hot-toast";

// ===============================================
// LAZY LOADED COMPONENTS WITH BETTER CHUNKING
// ===============================================

// Auth Area Components
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

// Public Area Pages
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

// Dashboard Area Components - These are the heavy ones causing your LCP issues
const Dashboard = React.lazy(() =>
  import("@/dashboard-area/pages/DashboardPage")
);

// Split dashboard sections into separate chunks for better loading
const TripsSection = React.lazy(() =>
  import("@/dashboard-area/components/sections/TripsSection")
);
const TripDetailView = React.lazy(() =>
  import("@/dashboard-area/features/trips/ViewTrip/TripDetailView")
);
const SettingsSection = React.lazy(() =>
  import("@settings/components/sections/SettingsSection")
);
const FriendsSection = React.lazy(() =>
  import("@/dashboard-area/components/sections/FriendsSection")
);

// ===============================================
// OPTIMIZED LOADING COMPONENTS
// ===============================================

// Lightweight skeleton loader instead of heavy spinner
const DashboardSkeleton = memo(() => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-full px-6">
          <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
));

const PageLoadingSpinner = memo(({ message = "Loading..." }) => (
  <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center transition-all duration-500">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-xl text-gray-800 dark:text-white font-medium">
        {message}
      </p>
    </div>
  </div>
));

// ===============================================
// OPTIMIZED SUSPENSE WRAPPER
// ===============================================
const SuspenseWrapper = memo(({ children, fallback, useSkeleton = false }) => (
  <Suspense 
    fallback={
      useSkeleton ? <DashboardSkeleton /> : (fallback || <PageLoadingSpinner />)
    }
  >
    {children}
  </Suspense>
));

// ===============================================
// OPTIMIZED FLOW CONTROLLER
// ===============================================
const FlowController = memo(({ children }) => {
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
      const turnstileVerifiedSession = sessionStorage.getItem("turnstile_verified");
      const turnstileTimestamp = sessionStorage.getItem("turnstile_timestamp");
      const lastPageLoad = sessionStorage.getItem("last_page_load");
      const currentTime = Date.now();

      // Enhanced session detection logic
      const isFirstVisit = !turnstileVerifiedSession && !turnstileTimestamp;
      const turnstileAge = turnstileTimestamp
        ? currentTime - parseInt(turnstileTimestamp)
        : Infinity;
      const isExpiredSession = turnstileAge > 24 * 60 * 60 * 1000;
      const isLongAbsence = lastPageLoad
        ? currentTime - parseInt(lastPageLoad) > 4 * 60 * 60 * 1000
        : false;

      const shouldShowTurnstile = isFirstVisit || isExpiredSession || isLongAbsence;

      // === TURNSTILE VERIFICATION CHECK ===
      if (shouldShowTurnstile) {
        setShowTurnstile(true);
        setFlowReady(false);
        return;
      } else {
        setTurnstileVerified(true);
        setShowTurnstile(false);
      }

      // === AUTHENTICATION-BASED ROUTING ===
      if (
        currentUser &&
        ["/signin", "/signup", "/forgot-password", "/reset-password"].includes(
          currentPath
        )
      ) {
        navigate("/dashboard", { replace: true });
        return;
      }

      if (currentUser && currentPath === "/") {
        navigate("/dashboard", { replace: true });
        return;
      }

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
        setShowLaunchAnimation(false);
        setFlowReady(true);
        return;
      }

      // === GUEST USER ROUTING ===
      if (!currentUser && currentPath === "/") {
        setShowLaunchAnimation(false);
        setFlowReady(true);
        return;
      }

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
        setShowLaunchAnimation(false);
        setFlowReady(true);
        return;
      }

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

      setShowLaunchAnimation(false);
      setFlowReady(true);
      sessionStorage.setItem("last_page_load", currentTime.toString());
    };

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
      sessionStorage.setItem("turnstile_verified", "true");
      sessionStorage.setItem("turnstile_token", token);
      sessionStorage.setItem("turnstile_timestamp", currentTime.toString());
      sessionStorage.setItem("last_page_load", currentTime.toString());
      setTurnstileVerified(true);
      setShowTurnstile(false);
    }
  };

  const handleAnimationComplete = () => {
    sessionStorage.setItem("launch_animation_shown", "true");
    setShowLaunchAnimation(false);
    setFlowReady(true);
  };

  if (showTurnstile) {
    return (
      <CloudflareTurnstileGate onVerificationComplete={handleTurnstileComplete}>
        <div>Turnstile Verified</div>
      </CloudflareTurnstileGate>
    );
  }

  if (authLoading || (!flowReady && !showLaunchAnimation)) {
    return <PageLoadingSpinner message="Loading..." />;
  }

  if (showLaunchAnimation) {
    return <LaunchAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  return children;
});

// ===============================================
// MAIN APP COMPONENT WITH OPTIMIZATIONS
// ===============================================
function App() {
  const AppContent = memo(() => (
    <Router>
      <AuthProvider>
        <GlobalAccessibilityProvider>
          <FlowController>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                className: "z-[70]",
              }}
            />

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
                      <HomePage />
                    </SuspenseWrapper>
                  }
                />

                {/* Authentication Routes */}
                <Route
                  path="/signin"
                  element={
                    <SuspenseWrapper
                      fallback={
                        <PageLoadingSpinner message="Loading sign in..." />
                      }
                    >
                      <SignInPage />
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
                      <SignUpPage />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/confirm-email"
                  element={
                    <SuspenseWrapper>
                      <ConfirmEmailPage />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <SuspenseWrapper>
                      <ForgotPasswordPage />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <SuspenseWrapper>
                      <ResetPasswordPage />
                    </SuspenseWrapper>
                  }
                />

                {/* Legal & Info Pages - Now with Suspense wrapper */}
                <Route
                  path="/terms"
                  element={
                    <SuspenseWrapper>
                      <TermsOfService />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/privacy-policy"
                  element={
                    <SuspenseWrapper>
                      <PrivacyPolicy />
                    </SuspenseWrapper>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <SuspenseWrapper>
                      <ContactUs />
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

                {/* Protected Routes - Use skeleton for better UX */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <SuspenseWrapper
                        useSkeleton={true}
                        fallback={<DashboardSkeleton />}
                      >
                        <Dashboard />
                      </SuspenseWrapper>
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <SuspenseWrapper useSkeleton={true}>
                        <TripsSection />
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="trips"
                    element={
                      <SuspenseWrapper useSkeleton={true}>
                        <TripsSection />
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="trip/:tripId"
                    element={
                      <SuspenseWrapper useSkeleton={true}>
                        <TripDetailView />
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="friends"
                    element={
                      <SuspenseWrapper useSkeleton={true}>
                        <FriendsSection />
                      </SuspenseWrapper>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <SuspenseWrapper useSkeleton={true}>
                        <SettingsSection />
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
  ));

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
