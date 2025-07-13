import React, { useState, useEffect } from "react";
import {
  useNavigate,
  useLocation,
  useSearchParams,
  Link,
} from "react-router-dom";
import { toast } from "@shared/utils/toast";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

import AuthLayout from "../../components/layout/AuthLayout";
import AuthHeader from "../../components/layout/AuthHeader";

import { useAuth } from "@auth/hooks/useAuth";
import { useAuthAnimations } from "../../hooks/useAuthAnimations";

const ConfirmEmailPage = () => {
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
  const { currentUser, resendVerificationEmail } = useAuth();
  const { navigateWithTransition } = useAuthAnimations();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const email = location.state?.email || searchParams.get("email");
  const plan = location.state?.plan;
  const redirectToBilling = location.state?.redirectToBilling;
  const billingParams = location.state?.billingParams;
  const codeFromUrl = searchParams.get("code");

  useEffect(() => {
    if (currentUser && currentUser.emailVerified) {
      if (redirectToBilling && billingParams) {
        setTimeout(() => {
          navigate(
            `/billing?plan=${billingParams.plan}&billing=${billingParams.billing}`
          );
        }, 1000);
      } else {
        navigate("/dashboard");
      }
    }
  }, [currentUser, redirectToBilling, billingParams, navigate]);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }
    if (codeFromUrl && codeFromUrl.length === 6) {
      const codeArray = codeFromUrl.split("");
      setVerificationCode(codeArray);
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

  const handleResendCode = async () => {
    if (!email) {
      toast.error("Email address is required");
      return;
    }
    try {
      setResendLoading(true);
      const response = await fetch(
        "https://us-central1-groupify-77202.cloudfunctions.net/sendVerificationEmail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              email,
              name: "User",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Verification code sent! Check your email.");
        setTimeLeft(120);
        setCanResend(false);
        setVerificationCode(["", "", "", "", "", ""]);
      } else {
        throw new Error(result.message || "Failed to resend code");
      }
    } catch (error) {
      console.error("Resend error:", error);

      let errorMessage = "Failed to resend code. Please try again.";

      if (error.message?.includes("already verified")) {
        errorMessage = "Email is already verified! You can now sign in.";
        toast.success(errorMessage);
        setTimeout(() => navigate("/signin"), 1500);
        return;
      } else if (error.message?.includes("User not found")) {
        errorMessage = "User not found. Please sign up first.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleInputChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    if (value && index === 5) {
      const completeCode = [...newCode];
      if (completeCode.every((digit) => digit !== "")) {
        setTimeout(() => {
          handleVerifyWithCode(completeCode.join(""));
        }, 100);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!verificationCode[index] && index > 0) {
        const prevInput = document.getElementById(`code-${index - 1}`);
        const newCode = [...verificationCode];
        newCode[index - 1] = "";
        setVerificationCode(newCode);
        prevInput?.focus();
      } else if (verificationCode[index]) {
        const newCode = [...verificationCode];
        newCode[index] = "";
        setVerificationCode(newCode);
      }
      e.preventDefault();
    } else if (e.key === "Enter") {
      const code = verificationCode.join("");
      if (code.length === 6) {
        handleVerifyWithCode(code);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pasteData.length > 0) {
      const newCode = ["", "", "", "", "", ""];
      for (let i = 0; i < Math.min(pasteData.length, 6); i++) {
        newCode[i] = pasteData[i];
      }
      setVerificationCode(newCode);

      if (pasteData.length === 6) {
        setTimeout(() => {
          handleVerifyWithCode(pasteData);
        }, 100);
      } else {
        const nextEmptyIndex = Math.min(pasteData.length, 5);
        const nextInput = document.getElementById(`code-${nextEmptyIndex}`);
        nextInput?.focus();
      }
    }
  };

  const handleVerifyWithCode = async (code) => {
    if (!email || !code) {
      toast.error("Email and verification code are required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://us-central1-groupify-77202.cloudfunctions.net/verifyEmailCode",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              email: email,
              verificationCode: code,
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Verification code not found or expired");
        } else if (response.status === 410) {
          throw new Error(
            "Verification code has expired. Please request a new one."
          );
        } else if (response.status === 412) {
          throw new Error("Verification code has already been used");
        } else if (response.status === 400) {
          throw new Error("Invalid verification code");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result = await response.json();

      if (result.success) {
        try {
          if (redirectToBilling && billingParams) {
            setTimeout(() => {
              navigate(
                `/signin?verified=true&redirect=billing&plan=${billingParams.plan}&billing=${billingParams.billing}`
              );
            }, 1000);
          } else {
            setTimeout(() => {
              navigate(
                "/signin?verified=true&message=" +
                  encodeURIComponent(
                    "Email verified successfully! You can now sign in."
                  )
              );
            }, 1000);
          }
        } catch (signInError) {
          console.error("Auto sign-in failed:", signInError);
          setTimeout(() => {
            navigate(
              "/signin?verified=true&message=" +
                encodeURIComponent(
                  "Email verified successfully! Please sign in to continue."
                )
            );
          }, 1000);
        }
      } else {
        throw new Error(result.message || "Invalid verification code");
      }
    } catch (error) {
      console.error("Verification error:", error);

      let errorMessage = "Invalid verification code";

      if (error.message?.includes("expired")) {
        errorMessage =
          "Verification code has expired. Please request a new one.";
        setCanResend(true);
        setTimeLeft(0);
      } else if (
        error.message?.includes("already verified") ||
        error.message?.includes("already been used")
      ) {
        toast.success("Email is already verified! You can now sign in.");
        setTimeout(() => navigate("/signin"), 1500);
        return;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);

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
    return null;
  }

  const leftContent = (
    <div className="w-full h-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-12 relative overflow-hidden">
      <div className="max-w-md text-center text-white z-10">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm mx-auto">
          <EnvelopeIcon className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold mb-6">Check your email</h2>
        <p className="text-lg mb-8 text-purple-100 leading-relaxed">
          We've sent a 6-digit verification code to your email address. Enter
          the code below to verify your account and get started.
        </p>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center">
            <EnvelopeIcon className="w-5 h-5 mr-3 text-purple-200" />
            <span className="text-purple-100">Sent to:</span>
          </div>
          <div className="text-white font-medium mt-1 truncate">{email}</div>
        </div>
        <div className="space-y-4 text-left">
          {[
            "Secure email verification",
            "Account protection enabled",
            "Privacy and security guaranteed",
          ].map((feature, index) => (
            <div key={index} className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <CheckCircleIcon className="w-4 h-4" />
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
      <div className="flex-1 flex flex-col justify-center py-2 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-12 xl:px-20 2xl:px-24 bg-white dark:bg-gray-900 min-h-0">
        <div className="mx-auto w-full max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md">
          <AuthHeader
            title="Verify your email"
            subtitle="Enter the 6-digit code we sent to your email address"
            showBackButton={true}
            backTo="/signup"
            backText="Back to Sign Up"
          />
          {redirectToBilling && billingParams && (
            <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4">
              <div className="flex items-center text-center md:text-left">
                <CreditCardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-blue-800 dark:text-blue-200 font-semibold text-sm">
                    Almost there! 🎯
                  </p>
                  <p className="text-blue-600 dark:text-blue-300 text-sm">
                    After verifying your email, you'll complete your{" "}
                    {billingParams.plan} plan subscription
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 md:space-y-5 text-sm md:text-base">
            <form
              onSubmit={handleVerify}
              className="space-y-4 sm:space-y-5 md:space-y-6"
            >
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
                      key={`digit-${index}`}
                      id={`code-${index}`}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-center text-base sm:text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      disabled={loading}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
              </div>
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
                    className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50 bg-transparent border-none cursor-pointer"
                  >
                    {resendLoading ? "Sending..." : "Resend verification code"}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.join("").length !== 6}
                className={`w-full flex justify-center items-center py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm md:text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform relative overflow-hidden ${
                  loading || verificationCode.join("").length !== 6
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50 scale-95"
                    : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white scale-100 hover:scale-[1.02] hover:shadow-md"
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : redirectToBilling ? (
                  "Verify & Continue to Checkout"
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>
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
            <p className="mt-4 sm:mt-5 md:mt-6 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Need help?{" "}
              <Link
                to="/contact"
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ConfirmEmailPage;
