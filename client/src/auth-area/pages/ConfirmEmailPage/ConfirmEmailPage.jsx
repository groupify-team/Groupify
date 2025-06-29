import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../shared/services/firebase/config";

// New modular components and hooks
import AuthLayout from "../../components/layout/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import { useAuthAnimations } from "../../hooks/useAuthAnimations";

const ConfirmEmailPage = () => {
  // State
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

  // Hooks
  const { resendVerificationEmail } = useAuth();
  const { navigateWithTransition } = useAuthAnimations();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get email from location state or URL params
  const email = location.state?.email || searchParams.get("email");
  const codeFromUrl = searchParams.get("code");

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }

    // If code is in URL, auto-fill it
    if (codeFromUrl && codeFromUrl.length === 6) {
      const codeArray = codeFromUrl.split("");
      setVerificationCode(codeArray);
      // Auto-verify if code is provided in URL
      handleVerifyWithCode(codeFromUrl);
    }
  }, [email, codeFromUrl, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Handle resend verification code
  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email address is required");
      return;
    }

    try {
      setResendLoading(true);
      console.log("Attempting to resend verification email to:", email);

      const resendFunction = httpsCallable(functions, "resendVerificationCode");
      const result = await resendFunction({ email });

      console.log("Resend function result:", result.data);
      toast.success("Verification code sent! Check your email.");
      setTimeLeft(120);
      setCanResend(false);
      setVerificationCode(["", "", "", "", "", ""]);
    } catch (error) {
      console.error("Resend error:", error);
      
      const errorMessages = {
        "functions/not-found": "No account found with this email address",
        "functions/deadline-exceeded": "Request timed out. Please try again.",
      };

      const errorMessage = errorMessages[error.code] || error.message || "Failed to resend code. Please try again.";
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // Handle input changes for verification code
  const handleInputChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle verification with code
  const handleVerifyWithCode = async (code) => {
    if (!email || !code) {
      toast.error("Email and verification code are required");
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting to verify code:", code, "for email:", email);

      const verifyCode = httpsCallable(functions, "verifyEmailCode");
      const result = await verifyCode({
        email: email,
        verificationCode: code,
      });

      console.log("Verification result:", result.data);

      // Success - navigate to signin with success message
      setTimeout(() => {
        navigate(
          "/signin?verified=true&message=" +
            encodeURIComponent("Email verified successfully! You can now sign in.")
        );
      }, 1000);
    } catch (error) {
      console.error("Verification error:", error);

      let errorMessage = "Invalid verification code";

      if (error.code === "functions/not-found") {
        errorMessage = "Verification code not found or expired";
      } else if (error.code === "functions/deadline-exceeded") {
        errorMessage = "Verification request timed out";
      } else if (error.message?.includes("expired")) {
        errorMessage = "Verification code has expired. Please request a new one.";
        setCanResend(true);
        setTimeLeft(0);
      } else if (error.message?.includes("already verified")) {
        toast.success("Email is already verified. You can now sign in.");
        navigate("/signin");
        return;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);

      // Clear the form for retry
      setVerificationCode(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleVerify = async (e) => {
    e.preventDefault();
    const code = verificationCode.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    await handleVerifyWithCode(code);
  };

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Don't render if no email
  if (!email) {
    return null; // Will redirect
  }

  // Visual content for left side
  const visualContent = {
    title: "Check your email",
    subtitle: "We've sent a 6-digit verification code to your email address. Enter the code below to verify your account and get started.",
    icon: <EnvelopeIcon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />,
    emailInfo: {
      email: email,
    },
    features: [
      "Secure email verification",
      "Account protection enabled", 
      "Privacy and security guaranteed",
    ],
  };

  return (
    <AuthLayout
      visualContent={visualContent}
      visualSide="left"
      gradient="from-purple-600 via-indigo-600 to-blue-600"
      backLink="/signup"
      backText="Back to Sign Up"
    >
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center md:text-left">
          Verify your email
        </h2>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 text-center md:text-left">
          Enter the 6-digit code we sent to your email address
        </p>
      </div>

      {/* Verification Form */}
      <form onSubmit={handleVerify} className="space-y-4 sm:space-y-5 md:space-y-6">
        {/* Code Input */}
        <div>
          <label
            htmlFor="code-0"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 text-center md:text-left"
          >
            Verification Code
          </label>
          <div className="flex justify-center md:justify-between space-x-1 sm:space-x-2">
            {verificationCode.map((digit, index) => (
              <input
                key={`digit-${index}-${digit}`}
                id={`code-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-center text-base sm:text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                disabled={loading}
              />
            ))}
          </div>
        </div>

        {/* Timer and Resend */}
        <div className="text-center">
          {!canResend ? (
            <div className="flex items-center justify-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Resend code in {formatTime(timeLeft)}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendLoading}
              className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend verification code"}
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || verificationCode.join("").length !== 6}
          className="w-full btn-primary flex items-center justify-center py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </button>
      </form>

      {/* Help Text */}
      <div className="mt-4 sm:mt-5 md:mt-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
                Didn't receive the email?
              </p>
              <ul className="text-blue-600 dark:text-blue-400 space-y-0.5 sm:space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure {email} is correct</li>
                <li>• Wait a few minutes for delivery</li>
                <li>• Try resending the code when timer expires</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-4 sm:mt-5 md:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        Need help?{" "}
        <a
          href="mailto:support@groupify.com"
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Contact Support
        </a>
      </p>
    </AuthLayout>
  );
};

export default ConfirmEmailPage;