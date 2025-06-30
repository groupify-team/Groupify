import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CameraIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../shared/services/firebase/config";

// New modular components and hooks
import AuthLayout from "../../components/layout/AuthLayout";
import EnhancedAuthForm from "../../components/ui/EnhancedAuthForm";
import { useAuthValidation } from "../../hooks/useAuthValidation";
import { useAuthAnimations } from "../../hooks/useAuthAnimations";

const ResetPasswordPage = () => {
  // State
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  // Hooks
  const { validateSignUpPassword } = useAuthValidation();
  const { navigateWithTransition } = useAuthAnimations();
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

  const passwordChecks = validatePassword(formData.newPassword);
  const isPasswordValid = Object.values(passwordChecks).every((check) => check);
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== "";

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
    verifyResetToken(emailParam, tokenParam);
  }, [searchParams, navigate]);

  // Verify reset token
  const verifyResetToken = async (email, token) => {
    try {
      setVerifyingToken(true);
      
      const response = await fetch(
        "https://us-central1-groupify-77202.cloudfunctions.net/verifyResetToken",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: { email, token }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setTokenValid(true);
      } else {
        toast.error("Invalid or expired reset link");
        navigate("/forgot-password");
      }
    } catch (error) {
      console.error("Token verification error:", error);
      
      const errorMessage = error.message || "Invalid or expired reset link";
      toast.error(errorMessage);
      navigate("/forgot-password");
    } finally {
      setVerifyingToken(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.newPassword || !formData.confirmPassword) {
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

      const response = await fetch(
        "https://us-central1-groupify-77202.cloudfunctions.net/resetPassword",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              email,
              token,
              newPassword: formData.newPassword,
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Password reset successfully! Please sign in with your new password.");
        navigate("/signin");
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Password reset error:", error);

      const errorMessage = error.message || "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading state while verifying token - Enhanced with consistent styling
  if (verifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Verifying reset link...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we validate your password reset request.
          </p>
        </div>
      </div>
    );
  }

  // If token is not valid, don't render the form
  if (!tokenValid) {
    return null;
  }

  // Form configuration - REMOVED title and subtitle to avoid duplication
  const formConfig = {
    submitText: loading ? "Resetting password..." : "Reset Password",
    submitDisabled: loading || !isPasswordValid || !passwordsMatch,
    fields: [
      {
        name: "newPassword",
        type: "password",
        label: "New Password",
        placeholder: "Enter your new password",
        required: true,
        showToggle: true,
        customComponent: (
          // Password Requirements
          formData.newPassword && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 mt-3">
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Password requirements:
              </p>
              <div className="space-y-1 sm:space-y-2">
                {[
                  { check: passwordChecks.length, label: "At least 6 characters" },
                  { check: passwordChecks.hasUpperCase, label: "One uppercase letter" },
                  { check: passwordChecks.hasLowerCase, label: "One lowercase letter" },
                  { check: passwordChecks.hasNumber, label: "One number" },
                  { check: passwordChecks.hasSpecialChar, label: "One special character (!@#$%^&*)" },
                ].map((requirement, index) => (
                  <div key={index} className="flex items-center">
                    {requirement.check ? (
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 sm:mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1 sm:mr-2" />
                    )}
                    <span
                      className={`text-xs sm:text-sm ${
                        requirement.check
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {requirement.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        ),
      },
      {
        name: "confirmPassword",
        type: "password",
        label: "Confirm Password",
        placeholder: "Confirm your new password",
        required: true,
        showToggle: true,
        showPasswordState: showConfirmPassword,
        onPasswordToggle: () => setShowConfirmPassword(!showConfirmPassword),
        customComponent: (
          // Password match indicator
          formData.confirmPassword && (
            <div className="mt-1 sm:mt-2">
              {!passwordsMatch ? (
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center">
                  <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Passwords match
                </p>
              )}
            </div>
          )
        ),
      },
    ],
  };

  // Left side visual content
  const leftContent = (
    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 flex items-center justify-center p-12 relative overflow-hidden">
      <div className="max-w-md text-center text-white z-10">
        {/* Icon */}
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm mx-auto">
          <LockClosedIcon className="w-8 h-8" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold mb-6">Secure your account</h2>
        
        {/* Subtitle */}
        <p className="text-lg mb-8 text-indigo-100 leading-relaxed">
          Create a strong password to keep your travel memories safe and secure. Your account protection is our priority.
        </p>

        {/* Features */}
        <div className="space-y-4 text-left">
          {[
            "Strong password requirements",
            "Secure password encryption",
            "Account protection",
            "Safe and secure process",
          ].map((feature, index) => (
            <div key={index} className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-8 w-16 h-16 bg-white bg-opacity-10 rounded-full blur-xl"></div>
      </div>
    </div>
  );

  return (
    <AuthLayout
      layoutType="split"
      leftContent={leftContent}
      showHeader={false}
    >
      {/* Form Container */}
      <div className="flex-1 flex flex-col justify-center py-2 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-12 xl:px-20 2xl:px-24 bg-white dark:bg-gray-900 min-h-0">
        <div className="mx-auto w-full max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-2 sm:mb-4 md:mb-6 lg:mb-8 pt-2 sm:pt-3 md:pt-4">
              <Link
                to="/signin"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Back to Sign In</span>
              </Link>
            </div>

            {/* Logo positioned in middle between top and title */}
            <div className="flex items-center justify-center md:justify-start mb-4 sm:mb-6 md:mb-8">
              <div className="w-10 h-10 [@media(min-width:375px)]:w-12 [@media(min-width:375px)]:h-12 sm:w-14 sm:h-14 md:w-12 md:h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <CameraIcon className="w-5 h-5 [@media(min-width:375px)]:w-6 [@media(min-width:375px)]:h-6 sm:w-8 sm:h-8 md:w-6 md:h-6 text-white" />
              </div>
              <span className="ml-2 text-xl [@media(min-width:375px)]:text-2xl sm:text-3xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>

            {/* Title section */}
            <div className="text-center md:text-left mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg [@media(min-width:375px)]:text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Reset your password
              </h2>
              <p className="mt-1 sm:mt-2 text-xs [@media(min-width:375px)]:text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                Creating a new password for{" "}
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {email}
                </span>
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-3 sm:space-y-4 md:space-y-5 text-sm md:text-base">
            {/* Main Form */}
            <EnhancedAuthForm
              config={formConfig}
              formData={formData}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              onInputChange={handleInputChange}
              onPasswordToggle={() => setShowPassword(!showPassword)}
              onSubmit={handleSubmit}
              loading={loading}
            />

            {/* Security Notice */}
            <div className="mt-4 sm:mt-5 md:mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Security Notice
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                    After resetting your password, you'll be signed out of all devices for your security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;