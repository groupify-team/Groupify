import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import ConfirmEmail from "./components/auth/ConfirmEmail";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import ForgotPassword from "./components/auth/ForgotPassword";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ContactUs from "./pages/ContactUs";
import About from "./pages/About";
import { Toaster } from "react-hot-toast";
import HelpCenter from "./pages/HelpCenter";
import Careers from "./pages/Careers";
import ResetPassword from "./components/auth/ResetPassword";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
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

              {/* Authentication Routes */}
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

              {/* Legal & Info Pages */}
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/about" element={<About />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes with Sidebar Layout */}
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
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
