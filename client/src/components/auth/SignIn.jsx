import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import {
  EyeIcon,
  EyeSlashIcon,
  CameraIcon,
  MoonIcon,
  SunIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase/config";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signin, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get("verified") === "true") {
      const message = urlParams.get("message");
      if (message) {
        toast.success(decodeURIComponent(message), { duration: 4000 });
      }
      // Clean up URL immediately to prevent re-triggering
      window.history.replaceState({}, document.title, "/signin");
    }
  }, [location.search]); // Changed from [location, navigate] to [location.search]

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setShowVerificationAlert(false); // Hide alert when attempting login

      // Remember email if checkbox is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      await signin(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Sign in error:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to sign in";

      if (error.message?.includes("verify your email")) {
        toast(error.message, {
          icon: (
            <ExclamationTriangleIcon className="h-6 w-6 text-black flex-shrink-0" />
          ),
          style: {
            background: "#fbbf24", // yellow-400
            color: "#000000", // black
            border: "1px solid #f59e0b", // yellow-500
            padding: "16px", // Add more padding to expand the message
            textAlign: "center", // Center the text
            minWidth: "300px", // Make it wider
          },
        });
        setShowVerificationAlert(true);
        return;
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      toast.success("Welcome to Groupify!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Google sign in error:", error);

      let errorMessage = "Failed to sign in with Google";

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign in was cancelled";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup was blocked. Please allow popups and try again";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-3 px-3 sm:py-6 sm:px-4 md:py-8 md:px-6 lg:py-12 lg:px-12 xl:px-20 2xl:px-24 bg-white dark:bg-gray-900">
        <div className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md">
          {/* Header */}
          <div className="mb-8">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-2 sm:mb-4 md:mb-6 lg:mb-8 -mt-2 sm:-mt-3 md:-mt-4">
              <Link
                to="/"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === "dark" ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Logo and Title */}
            <div className="flex items-center justify-center md:justify-start mb-6 sm:mb-8 md:mb-10 -mt-4 sm:-mt-0 md:-mt-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-10 md:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <CameraIcon className="w-5 h-5 sm:w-7 sm:h-7 md:w-6 md:h-6 text-white" />
              </div>
              <span className="ml-2 sm:ml-3 text-2xl sm:text-3xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center md:text-left">
              Welcome back
            </h2>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 text-center md:text-left">
              Sign in to your account to continue organizing your memories
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-4 md:space-y-6 text-sm md:text-base"
          >
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-primary"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-primary pr-12"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                  disabled={loading}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs sm:text-sm md:text-sm text-gray-700 dark:text-gray-300"
                >
                  Remember me
                </label>
              </div>

              <div className="text-xs sm:text-sm md:text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base relative overflow-hidden disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Conditional Verification Alert - Only show after failed verification */}
          {showVerificationAlert && (
            <div className="mt-3 sm:mt-4 md:mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 sm:p-3 md:p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                    Email verification required
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                    Please verify your email before signing in. Check your inbox
                    or{" "}
                    <button
                      onClick={async () => {
                        try {
                          console.log(
                            "Resending verification email from SignIn to:",
                            email
                          );

                          const resendFunction = httpsCallable(
                            functions,
                            "resendVerificationCode"
                          );
                          await resendFunction({ email });

                          toast.success(
                            "Verification email sent! Check your inbox."
                          );

                          // Then navigate to confirm page
                          setTimeout(() => {
                            navigate(
                              `/confirm-email?email=${encodeURIComponent(
                                email
                              )}`
                            );
                          }, 1500);
                        } catch (error) {
                          console.error("Resend error:", error);
                          toast.error(
                            "Failed to resend email. Please try again."
                          );
                        }
                      }}
                      className="underline font-medium hover:text-yellow-500 bg-transparent border-none cursor-pointer"
                    >
                      resend verification email
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="mt-4 sm:mt-6 md:mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-3 sm:mt-4 md:mt-6 w-full flex justify-center items-center py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <img
                  className="h-5 w-5 mr-2"
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google logo"
                />
              )}
              Sign in with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-4 sm:mt-6 md:mt-8 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden md:flex md:flex-1 md:flex-col md:justify-center md:items-center md:px-6 lg:px-8 xl:px-12 2xl:px-20 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-white max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl text-center md:text-left">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 lg:mb-4 xl:mb-6">
            Organize your travel memories with AI
          </h2>
          <p className="text-base lg:text-lg xl:text-xl text-indigo-100 mb-4 lg:mb-6 xl:mb-8 leading-relaxed">
            Upload photos from your trips and let our AI automatically find the
            ones with you in them. Share albums with friends and never lose
            track of your memories again.
          </p>

          {/* Feature List */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm">✓</span>
              </div>
              <span>AI-powered face recognition</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm">✓</span>
              </div>
              <span>Collaborative photo sharing</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm">✓</span>
              </div>
              <span>Automatic organization</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm">✓</span>
              </div>
              <span>Secure cloud storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
