import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "@shared/utils/toast";
import {
  CheckCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import PageTransition, {
  SectionTransition,
} from "@/shared/components/ui/PageTransition";
import AuthLayout from "../../components/layout/AuthLayout";
import AuthHeader from "../../components/layout/AuthHeader";
import AuthForm from "../../components/ui/AuthForm";
import { useAuthValidation } from "../../hooks/useAuthValidation";
import { useAuthAnimations } from "../../hooks/useAuthAnimations";

const ForgotPasswordPage = () => {
  // State
  const [formData, setFormData] = useState({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { validateEmail } = useAuthValidation();
  const { navigateWithTransition } = useAuthAnimations();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoaded(true);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://us-central1-groupify-77202.cloudfunctions.net/sendPasswordResetEmail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: { email: formData.email },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Password reset email sent! Check your inbox.");

        // Fade out current content
        document.body.style.transition = "opacity 0.3s ease-out";
        document.body.style.opacity = "0.7";

        // Change state after fade
        setTimeout(() => {
          setEmailSent(true);
          // Fade back in
          setTimeout(() => {
            document.body.style.opacity = "1";
            setTimeout(() => {
              document.body.style.transition = "";
            }, 300);
          }, 50);
        }, 300);
      } else {
        throw new Error(result.message || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Password reset error:", error);

      let errorMessage = "Failed to send reset email. Please try again.";

      if (
        error.message?.includes("User not found") ||
        error.message?.includes("No user found")
      ) {
        errorMessage =
          "No account found with this email address. Please check your email or sign up.";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    await handleSubmit({ preventDefault: () => {} });
  };

  if (emailSent) {
    const successLeftContent = (
      <div className="w-full h-full bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 flex items-center justify-center p-12 relative overflow-hidden">
        <div className="max-w-md text-center text-white z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm mx-auto">
            <CheckCircleIcon className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold mb-6">Check your email</h2>
          <p className="text-lg mb-8 text-green-100 leading-relaxed">
            We've sent password reset instructions to your email address. Follow
            the link to create a new password.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-200" />
              <span className="text-green-100">Reset link sent to:</span>
            </div>
            <div className="text-white font-medium mt-1 truncate">
              {formData.email}
            </div>
          </div>
          <div className="space-y-4 text-left">
            {[
              "Secure reset process",
              "Link expires in 1 hour",
              "Safe and encrypted",
              "Quick and easy",
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
      <AuthLayout
        layoutType="split"
        leftContent={successLeftContent}
        showHeader={false}
      >
        <PageTransition variant="fadeIn" trigger={isLoaded}>
          <div className="flex-1 flex flex-col justify-center py-2 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-12 xl:px-20 2xl:px-24 bg-white dark:bg-gray-900 min-h-0">
            <div className="mx-auto w-full max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md">
              <SectionTransition variant="slideInFromTop" delay={0.1}>
                <AuthHeader
                  title="Email sent!"
                  subtitle={
                    <>
                      We've sent a password reset link to{" "}
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {formData.email}
                      </span>
                    </>
                  }
                  showBackButton={true}
                  backTo="/signin"
                  backText="Back to Sign In"
                />
              </SectionTransition>

              <SectionTransition variant="slideInFromBottom" delay={0.2}>
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                    <div className="text-left">
                      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                        Next steps:
                      </h3>
                      <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                        <li>Check your email inbox</li>
                        <li>Click the "Reset Password" button in the email</li>
                        <li>Create your new password</li>
                        <li>Sign in with your new password</li>
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleResendEmail}
                      disabled={loading}
                      className={`w-full flex justify-center items-center py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 border rounded-lg shadow-sm text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform ${
                        loading
                          ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50 scale-95"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 scale-100 hover:scale-[1.02] hover:shadow-md"
                      }`}
                    >
                      {loading ? "Sending..." : "Resend email"}
                    </button>

                    <button
                      onClick={() => navigate("/signin")}
                      className="w-full flex justify-center items-center py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform scale-100 hover:scale-[1.02] hover:shadow-md"
                    >
                      Back to Sign In
                    </button>
                  </div>

                  <div className="mt-4 sm:mt-6 text-center">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Didn't receive the email? Check your spam folder or{" "}
                      <button
                        onClick={() => navigate("/signin")}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 bg-transparent border-none cursor-pointer underline font-medium"
                      >
                        try a different email address
                      </button>
                    </p>
                  </div>
                </div>
              </SectionTransition>
            </div>
          </div>
        </PageTransition>
      </AuthLayout>
    );
  }

  const formConfig = {
    submitText: loading ? "Sending reset link..." : "Send reset link",
    submitDisabled: loading || !formData.email,
    fields: [
      {
        name: "email",
        type: "email",
        label: "Email address",
        placeholder: "Enter your email address",
        required: true,
        autoComplete: "email",
      },
    ],
  };

  const leftContent = (
    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center p-12 relative overflow-hidden">
      <div className="max-w-md text-center text-white z-10">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm mx-auto">
          <LockClosedIcon className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold mb-6">Secure password recovery</h2>
        <p className="text-lg mb-8 text-blue-100 leading-relaxed">
          Reset your password safely and securely. We'll help you get back to
          organizing your memories in no time.
        </p>
        <div className="space-y-4 text-left">
          {[
            "Secure reset process",
            "Email verification required",
            "Strong password requirements",
            "Account protection",
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
      <PageTransition variant="fadeIn" trigger={isLoaded}>
        <div className="flex-1 flex flex-col justify-center py-2 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-12 xl:px-20 2xl:px-24 bg-white dark:bg-gray-900 min-h-0">
          <div className="mx-auto w-full max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md">
            <SectionTransition variant="slideInFromTop" delay={0.1}>
              <AuthHeader
                title="Forgot your password?"
                subtitle="No worries! Enter your email address and we'll send you a link to reset your password."
                showBackButton={true}
                backTo="/signin"
                backText="Back to Sign In"
              />
            </SectionTransition>

            <SectionTransition variant="slideInFromBottom" delay={0.2}>
              <div className="space-y-3 sm:space-y-4 md:space-y-5 text-sm md:text-base">
                <AuthForm
                  config={formConfig}
                  formData={formData}
                  onInputChange={handleInputChange}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Remember your password?{" "}
                    <button
                      onClick={() => navigate("/signin")}
                      className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer"
                    >
                      Sign in instead
                    </button>
                  </p>
                </div>
              </div>
            </SectionTransition>
          </div>
        </div>
      </PageTransition>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
