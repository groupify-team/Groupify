import React, { useState, useEffect } from "react";
import {
  useNavigate,
  useLocation,
  Link,
  useSearchParams,
} from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  CameraIcon,
  MoonIcon,
  SunIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase/config";

const ConfirmEmail = () => {
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [hasAutoSent, setHasAutoSent] = useState(false);

  // Get email from location state or URL params
  const email = location.state?.email || searchParams.get("email");
  const codeFromUrl = searchParams.get("code");

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
      let errorMessage = "Failed to resend code. Please try again.";

      if (error.code === "functions/not-found") {
        errorMessage = "No account found with this email address";
      } else if (error.code === "functions/deadline-exceeded") {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

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

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

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
      toast.success("Email verified successfully!");
      setTimeout(() => {
        navigate(
          "/signin?verified=true&message=" +
            encodeURIComponent(
              "Email verified successfully! You can now sign in."
            )
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
        errorMessage =
          "Verification code has expired. Please request a new one.";
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

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = verificationCode.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    await handleVerifyWithCode(code);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!email) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-20 xl:px-24 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
            <EnvelopeIcon className="w-8 h-8" />
          </div>

          <h2 className="text-4xl font-bold mb-6">Check your email</h2>
          <p className="text-xl text-purple-100 mb-8 leading-relaxed">
            We've sent a 6-digit verification code to your email address. Enter
            the code below to verify your account and get started.
          </p>

          {/* Email Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <EnvelopeIcon className="w-5 h-5 mr-3 text-purple-200" />
              <span className="text-purple-100">Sent to:</span>
            </div>
            <div className="text-white font-medium mt-1 truncate">{email}</div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <span>Secure email verification</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <span>Account protection enabled</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <span>Privacy and security guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-gray-900">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Header */}
          <div className="mb-8">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-8">
              <Link
                to="/signup"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Sign Up
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
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <CameraIcon className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Verify your email
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter the 6-digit code we sent to your email address
            </p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Code Input */}
            <div>
              <label
                htmlFor="code-0"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4"
              >
                Verification Code
              </label>
              <div className="flex justify-between space-x-2">
                {verificationCode.map((digit, index) => (
                  <input
                    key={`digit-${index}-${digit}`}
                    id={`code-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Timer and Resend */}
            <div className="text-center">
              {!canResend ? (
                <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  Resend code in {formatTime(timeLeft)}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50"
                >
                  {resendLoading ? "Sending..." : "Resend verification code"}
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || verificationCode.join("").length !== 6}
              className="w-full btn-primary flex items-center justify-center py-3 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
                    Didn't receive the email?
                  </p>
                  <ul className="text-blue-600 dark:text-blue-400 space-y-1">
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
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Need help?{" "}
            <a
              href="mailto:support@groupify.com"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
