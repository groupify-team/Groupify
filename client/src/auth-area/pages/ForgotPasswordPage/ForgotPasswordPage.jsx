import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../shared/services/firebase/config";

// New modular components and hooks
import AuthLayout from "../../components/layout/AuthLayout";
import EnhancedAuthForm from "../../components/ui/EnhancedAuthForm";
import { useAuthValidation } from "../../hooks/useAuthValidation";
import { useAuthAnimations } from "../../hooks/useAuthAnimations";

const ForgotPasswordPage = () => {
  // State
  const [formData, setFormData] = useState({ email: "" });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Hooks
  const { validateEmail } = useAuthValidation();
  const { navigateWithTransition } = useAuthAnimations();
  const navigate = useNavigate();

  // Fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => {
      document.body.style.transition = "opacity 0.3s ease-in";
      document.body.style.opacity = "1";
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Send password reset email
  const sendPasswordResetEmail = async (email) => {
    try {
      const sendResetEmail = httpsCallable(functions, "sendPasswordResetEmail");
      const result = await sendResetEmail({ email });
      console.log("Reset email function result:", result.data);
      return result.data;
    } catch (error) {
      console.error("Error calling sendPasswordResetEmail function:", error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    const validation = validateEmail(formData.email);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setLoading(true);
      const result = await sendPasswordResetEmail(formData.email);

      if (result.success) {
        setEmailSent(true);
        toast.success("Password reset email sent successfully!");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } catch (error) {
      console.error("Password reset error:", error);

      const errorMessages = {
        "functions/not-found": "No account found with this email address",
        "functions/invalid-argument": "Please enter a valid email address",
        "functions/resource-exhausted": "Too many requests. Please try again in a few minutes",
        "functions/deadline-exceeded": "Request timed out. Please try again",
      };

      const errorMessage = errorMessages[error.code] || error.message || "Failed to send reset email. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Success state - email sent
  if (emailSent) {
    const successVisualContent = {
      title: "We've got you covered",
      subtitle: "Don't worry about forgetting your password. We'll help you get back to organizing your memories in no time.",
      features: [
        "Secure password reset process",
        "Email verification for security", 
        "Quick and easy process",
      ],
    };

    return (
      <AuthLayout
        visualContent={successVisualContent}
        visualSide="right"
        gradient="from-green-500 via-blue-600 to-indigo-600"
        backLink="/signin"
        backText="Back to Sign In"
      >
        {/* Success Content */}
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          {/* Success Icon and Title */}
          <div className="flex items-center justify-center mb-12 sm:mb-16 md:mb-20">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-10 md:h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 sm:w-7 sm:h-7 md:w-6 md:h-6 text-white" />
            </div>
            <span className="ml-2 sm:ml-3 text-2xl sm:text-3xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Email Sent!
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center">
            Check your inbox
          </h2>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 text-center">
            We've sent a password reset link to{" "}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              {formData.email}
            </span>
          </p>

          {/* Instructions */}
          <div className="space-y-6 mt-8 w-full">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    What's next?
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>1. Check your email inbox (and spam folder)</p>
                    <p>2. Click the reset link in the email</p>
                    <p>3. Create a new password</p>
                    <p>4. Sign in with your new password</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => setEmailSent(false)}
                className="w-full text-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
              >
                Send another email
              </button>

              <button
                onClick={() => navigateWithTransition("/signin")}
                className="w-full btn-primary text-center py-3"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Main form state
  const formConfig = {
    title: "Forgot your password?",
    subtitle: "No worries! Enter your email and we'll send you a reset link",
    submitText: loading ? "Sending reset email..." : "Send reset email",
    fields: [
      {
        name: "email",
        type: "email",
        label: "Email address",
        placeholder: "you@example.com",
        required: true,
        autoComplete: "email",
      },
    ],
  };

  const visualContent = {
    title: "Get back to your memories",
    subtitle: "Don't let a forgotten password keep you away from your precious travel memories. We'll help you regain access quickly and securely.",
    features: [
      "Secure password reset",
      "Email verification",
      "Quick recovery process",
      "Protected account access",
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
      {/* Center the form content */}
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        {/* Main Form */}
        <div className="w-full">
          <EnhancedAuthForm
            config={formConfig}
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>

        {/* Back to Sign In Link */}
        <div className="mt-6 w-full">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{" "}
            <button
              onClick={() => navigateWithTransition("/signin")}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer"
            >
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;