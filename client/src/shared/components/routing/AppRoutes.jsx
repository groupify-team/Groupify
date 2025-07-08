import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/auth-area/components/ProtectedRoute";
import SuspenseWrapper from "@/shared/components/ui/SuspenseWrapper";
import LoadingSpinner, {
  DashboardSkeleton,
} from "@/shared/components/ui/LoadingSpinner";

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
const EventsSection = React.lazy(() =>
  import("@/dashboard-area/components/sections/EventsSection")
);
const EventDetailView = React.lazy(() =>
  import("@/dashboard-area/features/events/ViewEvent/EventDetailView")
);
const SettingsSection = React.lazy(() =>
  import("@settings/components/sections/SettingsSection")
);
const FriendsSection = React.lazy(() =>
  import("@/dashboard-area/features/friends/FriendsSection")
);
const DebugFriendsPage = React.lazy(() => import("@/debug-friends-page"));

const AppRoutes = () => {
  return (
    <div className="transition-all duration-500 ease-in-out">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <SuspenseWrapper
              useSmooth={true}
              fallback={
                <LoadingSpinner fullPage message="Loading homepage..." />
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
              useSmooth={true}
              fallback={
                <LoadingSpinner fullPage message="Loading sign in..." />
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
              useSmooth={true}
              fallback={
                <LoadingSpinner fullPage message="Loading sign up..." />
              }
            >
              <SignUpPage />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/confirm-email"
          element={
            <SuspenseWrapper useSmooth={true}>
              <ConfirmEmailPage />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <SuspenseWrapper useSmooth={true}>
              <ForgotPasswordPage />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/reset-password"
          element={
            <SuspenseWrapper useSmooth={true}>
              <ResetPasswordPage />
            </SuspenseWrapper>
          }
        />

        {/* Legal & Info Pages */}
        <Route
          path="/terms"
          element={
            <SuspenseWrapper useSmooth={true}>
              <TermsOfService />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <SuspenseWrapper useSmooth={true}>
              <PrivacyPolicy />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/contact"
          element={
            <SuspenseWrapper useSmooth={true}>
              <ContactUs />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/about"
          element={
            <SuspenseWrapper useSmooth={true}>
              <AboutUs />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/careers"
          element={
            <SuspenseWrapper useSmooth={true}>
              <Careers />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/help"
          element={
            <SuspenseWrapper useSmooth={true}>
              <HelpCenter />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/blog"
          element={
            <SuspenseWrapper useSmooth={true}>
              <Blog />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/features"
          element={
            <SuspenseWrapper useSmooth={true}>
              <Features />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/pricing"
          element={
            <SuspenseWrapper useSmooth={true}>
              <Pricing />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/status"
          element={
            <SuspenseWrapper useSmooth={true}>
              <Status />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/billing"
          element={
            <SuspenseWrapper useSmooth={true}>
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
                <EventsSection />
              </SuspenseWrapper>
            }
          />
          <Route
            path="events"
            element={
              <SuspenseWrapper useSkeleton={true}>
                <EventsSection />
              </SuspenseWrapper>
            }
          />
          <Route
            path="event/:eventId"
            element={
              <SuspenseWrapper useSkeleton={true}>
                <EventDetailView />
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
            path="debug-friends"
            element={
              <SuspenseWrapper useSkeleton={true}>
                <DebugFriendsPage />
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
