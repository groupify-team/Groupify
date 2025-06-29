import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
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
      
      const errorMessages = {
        "functions/deadline-exceeded": "Reset link has expired",
        "functions/permission-denied": "Invalid reset link",
      };

      const errorMessage = errorMessages[error.code] || error.message || "Invalid or expired reset link";
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

      const resetPassword = httpsCallable(functions, "resetPassword");
      const result = await resetPassword({
        email,
        token,
        newPassword: formData.newPassword,
      });

      if (result.data.success) {
        toast.success("Password reset successfully! Please sign in with your new password.");
        navigate("/signin");
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Password reset error:", error);

      const errorMessages = {
        "functions/deadline-exceeded": "Reset link has expired. Please request a new one.",
        "functions/permission-denied": "Invalid reset link. Please request a new one.",
        "functions/invalid-argument": "Password must be at least 6 characters long",
      };

      const errorMessage = errorMessages[error.code] || error.message || "Failed to reset password. Please try again.";
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

  // Form configuration
  const formConfig = {
    title: "Reset your password",
    subtitle: (
      <>
        Creating a new password for{" "}
        <span className="font-medium text-indigo-600 dark:text-indigo-400">
          {email}
        </span>
      </>
    ),
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

  // Visual content
  const visualContent = {
    title: "Secure your account",
    subtitle: "Create a strong password to keep your travel memories safe and secure.",
    features: [
      "Strong password requirements",
      "Secure password encryption", 
      "Account protection",
      "Safe and secure process",
    ],
  };

  return (
    <AuthLayout
      visualContent={visualContent}
      visualSide="right"
      gradient="from-indigo-500 via-purple-600 to-blue-600"
      backLink="/signin"
      backText="Back to Sign In"
    >
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
    </AuthLayout>
  );
};

export default ResetPasswordPage;