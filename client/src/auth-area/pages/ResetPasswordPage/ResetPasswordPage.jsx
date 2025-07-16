import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "@shared/utils/toast";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CameraIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

// New modular components and hooks
import AuthLayout from "../../components/layout/AuthLayout";
import AuthHeader from "../../components/layout/AuthHeader";
import AuthForm from "../../components/ui/AuthForm";
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
  const passwordsMatch =
    formData.newPassword === formData.confirmPassword &&
    formData.confirmPassword !== "";

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
            data: { email, token },
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(
          "Password reset successfully! Please sign in with your new password."
        );
        navigate("/signin");
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Password reset error:", error);

      const errorMessage =
        error.message || "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

  if (!tokenValid) {
    return null;
  }

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
        customComponent: formData.newPassword && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 mt-3">
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              Password requirements:
            </p>
            <div className="space-y-1 sm:space-y-2">
              {[
                {
                  check: passwordChecks.length,
                  label: "At least 6 characters",
                },
                {
                  check: passwordChecks.hasUpperCase,
                  label: "One uppercase letter",
                },
                {
                  check: passwordChecks.hasLowerCase,
                  label: "One lowercase letter",
                },
                { check: passwordChecks.hasNumber, label: "One number" },
                {
                  check: passwordChecks.hasSpecialChar,
                  label: "One special character (!@#$%^&*)",
                },
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
        customComponent: formData.confirmPassword && (
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
        ),
      },
    ],
  };

  const leftContent = (
    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 flex items-center justify-center p-12 relative overflow-hidden">
      <div className="max-w-md text-center text-white z-10">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm mx-auto">
          <LockClosedIcon className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold mb-6">Secure your account</h2>
        <p className="text-lg mb-8 text-indigo-100 leading-relaxed">
          Create a strong password to keep your travel memories safe and secure.
          Your account protection is our priority.
        </p>

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

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-8 w-16 h-16 bg-white bg-opacity-10 rounded-full blur-xl"></div>
      </div>
    </div>
  );

  return (
    <AuthLayout layoutType="split" leftContent={leftContent} showHeader={false}>
      <div className="flex-1 flex items-center justify-center py-4 px-4 sm:py-6 sm:px-6 md:py-8 md:px-8 lg:py-8 lg:px-12 xl:px-16 2xl:px-20 bg-white dark:bg-gray-900 min-h-screen">
        <div className="w-full min-w-[280px] max-w-[320px] xs:max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[460px] xl:max-w-[400px]">
          <AuthHeader
            title="Reset your password"
            subtitle={`Creating a new password for ${email}`}
            showBackButton={true}
            backTo="/signin"
            backText="Back to Sign In"
          />
          <div className="space-y-4 sm:space-y-5 md:space-y-6 text-sm sm:text-base">
            <AuthForm
              config={formConfig}
              formData={formData}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              onInputChange={handleInputChange}
              onPasswordToggle={() => setShowPassword(!showPassword)}
              onSubmit={handleSubmit}
              loading={loading}
            />
            <div className="mt-6 sm:mt-7 md:mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
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
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
