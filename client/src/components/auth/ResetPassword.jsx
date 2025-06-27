import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import {
  CameraIcon,
  MoonIcon,
  SunIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase/config";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Password validation
  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return checks;
  };

  const passwordChecks = validatePassword(newPassword);
  const isPasswordValid = Object.values(passwordChecks).every((check) => check);
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword !== "";

  // Verify token when component mounts
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    if (!emailParam || !tokenParam) {
      toast.error("Invalid reset link");
      navigate("/forgot-password");
      return;
    }

    setEmail(emailParam);
    setToken(tokenParam);

    // Verify the token
    verifyResetToken(emailParam, tokenParam);
  }, [searchParams, navigate]);

  const verifyResetToken = async (email, token) => {
    try {
      setVerifyingToken(true);
      const verifyToken = httpsCallable(functions, "verifyResetToken");
      const result = await verifyToken({ email, token });

      if (result.data.success) {
        setTokenValid(true);
      } else {
        toast.error("Invalid or expired reset link");
        navigate("/forgot-password");
      }
    } catch (error) {
      console.error("Token verification error:", error);
      let errorMessage = "Invalid or expired reset link";

      if (error.code === "functions/deadline-exceeded") {
        errorMessage = "Reset link has expired";
      } else if (error.code === "functions/permission-denied") {
        errorMessage = "Invalid reset link";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      navigate("/forgot-password");
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Please ensure your password meets all requirements");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // Call reset password function
      const resetPassword = httpsCallable(functions, "resetPassword");
      const result = await resetPassword({
        email,
        token,
        newPassword,
      });

      if (result.data.success) {
        toast.success(
          "Password reset successfully! Please sign in with your new password."
        );
        navigate("/signin");
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Password reset error:", error);

      let errorMessage = "Failed to reset password. Please try again.";

      if (error.code === "functions/deadline-exceeded") {
        errorMessage = "Reset link has expired. Please request a new one.";
      } else if (error.code === "functions/permission-denied") {
        errorMessage = "Invalid reset link. Please request a new one.";
      } else if (error.code === "functions/invalid-argument") {
        errorMessage = "Password must be at least 6 characters long";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading state while verifying token
  if (verifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Verifying reset link...
          </p>
        </div>
      </div>
    );
  }

  // If token is not valid, don't render the form
  if (!tokenValid) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-3 px-3 sm:py-6 sm:px-4 md:py-8 md:px-6 lg:py-12 lg:px-12 xl:px-20 2xl:px-24 bg-white dark:bg-gray-900">
        <div className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 lg:mb-12 -mt-2 sm:-mt-0 md:-mt-0">
              <Link
                to="/signin"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Back to Sign In</span>
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
              Reset your password
            </h2>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 text-center md:text-left">
              Creating a new password for{" "}
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {email}
              </span>
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5 md:space-y-6"
          >
            {/* New Password Field */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-primary pr-12 sm:pr-14"
                  placeholder="Enter your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  Password requirements:
                </p>
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-center">
                    {passwordChecks.length ? (
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2" />
                    )}
                    <span
                      className={`text-xs sm:text-sm ${
                        passwordChecks.length
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      At least 6 characters
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordChecks.hasUpperCase ? (
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2" />
                    )}
                    <span
                      className={`text-xs sm:text-sm ${
                        passwordChecks.hasUpperCase
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordChecks.hasLowerCase ? (
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2" />
                    )}
                    <span
                      className={`text-xs sm:text-sm ${
                        passwordChecks.hasLowerCase
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordChecks.hasNumber ? (
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2" />
                    )}
                    <span
                      className={`text-xs sm:text-sm ${
                        passwordChecks.hasNumber
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      One number
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordChecks.hasSpecialChar ? (
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2" />
                    )}
                    <span
                      className={`text-xs sm:text-sm ${
                        passwordChecks.hasSpecialChar
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      One special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-primary pr-12 sm:pr-14"
                  placeholder="Confirm your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
              {confirmPassword && passwordsMatch && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center">
                  <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full btn-primary flex items-center justify-center py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  Resetting password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-4 sm:mt-5 md:mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Security Notice
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                  After resetting your password, you'll be signed out of all
                  devices for your security.
                </p>
              </div>
            </div>
          </div>
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
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 lg:mb-6">
            Secure your account
          </h2>
          <p className="text-base lg:text-lg xl:text-xl text-indigo-100 mb-6 lg:mb-8 leading-relaxed">
            Create a strong password to keep your travel memories safe and
            secure.
          </p>

          {/* Feature List */}
          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-center justify-center md:justify-start">
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-full flex items-center justify-center mr-2 lg:mr-3">
                <span className="text-xs lg:text-sm">✓</span>
              </div>
              <span className="text-sm lg:text-base">
                Strong password requirements
              </span>
            </div>
            <div className="flex items-center justify-center md:justify-start">
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-full flex items-center justify-center mr-2 lg:mr-3">
                <span className="text-xs lg:text-sm">✓</span>
              </div>
              <span className="text-sm lg:text-base">
                Secure password encryption
              </span>
            </div>
            <div className="flex items-center justify-center md:justify-start">
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-full flex items-center justify-center mr-2 lg:mr-3">
                <span className="text-xs lg:text-sm">✓</span>
              </div>
              <span className="text-sm lg:text-base">Account protection</span>
            </div>
            <div className="flex items-center justify-center md:justify-start">
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-full flex items-center justify-center mr-2 lg:mr-3">
                <span className="text-xs lg:text-sm">✓</span>
              </div>
              <span className="text-sm lg:text-base">
                Safe and secure process
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
