import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/auth-area/components/ProtectedRoute";
import SuspenseWrapper from "@/shared/components/ui/SuspenseWrapper";
import PageLoadingSpinner, {
  DashboardSkeleton,
} from "@/shared/components/ui/PageLoadingSpinner";

// Auth Area Components (Lazy Loaded)
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

// Public Area Pages (Lazy Loaded)
const HomePage = React.lazy(() =>
  import("@/public-area/pages/HomePage/HomePage")
);
const TermsOfService = React.lazy(() =>
  import("@/public-area/pages/TermsOfServicePage/TermsOfServicePage")
);
const PrivacyPolicy = React.lazy(() =>
  import("@/public-area/pages/PrivacyPolicyPage/PrivacyPolicyPage")
);
const ContactUs = React.lazy(() =>
  import("@/public-area/pages/ContactPage/ContactPage")
);
const AboutUs = React.lazy(() =>
  import("@/public-area/pages/AboutPage/AboutPage")
);
const HelpCenter = React.lazy(() =>
  import("@/public-area/pages/HelpCenterPage/HelpCenterPage")
);
const Careers = React.lazy(() =>
  import("@/public-area/pages/CareersPage/CareersPage")
);
const Blog = React.lazy(() => import("@/public-area/pages/BlogPage/BlogPage"));
const Features = React.lazy(() =>
  import("@/public-area/pages/FeaturesPage/FeaturesPage")
);
const Pricing = React.lazy(() =>
  import("@/public-area/pages/PricingPage/PricingPage")
);
const Status = React.lazy(() =>
  import("@/public-area/pages/StatusPage/StatusPage")
);
const Billing = React.lazy(() =>
  import("@/public-area/pages/BillingPage/BillingPage")
);

// Dashboard Area Components (Lazy Loaded)
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
  import("@settings/components/sections/SettingsSection")
);
const FriendsSection = React.lazy(() =>
  import("@/dashboard-area/components/sections/FriendsSection")
);

const AppRoutes = () => {
  return (
    <div className="transition-all duration-500 ease-in-out">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <SuspenseWrapper
              fallback={<PageLoadingSpinner message="Loading homepage..." />}
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
              fallback={<PageLoadingSpinner message="Loading sign in..." />}
            >
              <SignInPage />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/signup"
          element={
            <SuspenseWrapper
              fallback={<PageLoadingSpinner message="Loading sign up..." />}
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

        {/* Legal & Info Pages */}
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
  );
};

export default AppRoutes;



