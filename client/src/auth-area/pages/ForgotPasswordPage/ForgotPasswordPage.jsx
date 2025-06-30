import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

// New modular components and hooks
import AuthLayout from "../../components/layout/AuthLayout";
import EnhancedAuthForm from "../../components/ui/EnhancedAuthForm";
import { useAuthValidation } from "../../hooks/useAuthValidation";
import { useAuthAnimations } from "../../hooks/useAuthAnimations";

const ForgotPasswordPage = () => {
  // State
  const [formData, setFormData] = useState({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Hooks
  const { validateEmail } = useAuthValidation();
  const { navigateWithTransition } = useAuthAnimations();
  const navigate = useNavigate();

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
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

      // Call the HTTP function directly (similar to verification email)
      const response = await fetch(
        "https://us-central1-groupify-77202.cloudfunctions.net/sendPasswordResetEmail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: { email: formData.email }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setEmailSent(true);
        toast.success("Password reset email sent! Check your inbox.");
      } else {
        throw new Error(result.message || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      
      // Handle specific error messages
      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (error.message?.includes('User not found') || error.message?.includes('No user found')) {
        errorMessage = "No account found with this email address. Please check your email or sign up.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend email
  const handleResendEmail = async () => {
    await handleSubmit({ preventDefault: () => {} });
  };

  // Success state
  if (emailSent) {
    return (
      <AuthLayout
        visualContent={{
          title: "Check your email",
          subtitle: "We've sent password reset instructions to your email address.",
          features: [
            "Secure reset process",
            "Link expires in 1 hour",
            "Safe and encrypted",
            "Quick and easy",
          ],
        }}
        visualSide="right"
        gradient="from-green-500 via-emerald-600 to-teal-600"
        backLink="/signin"
        backText="Back to Sign In"
      >
        {/* Success Message */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Email sent!
          </h2>
          
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
            We've sent a password reset link to{" "}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              {formData.email}
            </span>
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
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

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Resend email"}
            </button>
            
            <button
              onClick={() => navigateWithTransition("/signin")}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Sign In
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={() => {
                  setEmailSent(false);
                  setFormData({ email: "" });
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 bg-transparent border-none cursor-pointer underline"
              >
                try a different email address
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Form configuration
  const formConfig = {
    title: "Forgot your password?",
    subtitle: "No worries! Enter your email address and we'll send you a link to reset your password.",
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

  // Visual content
  const visualContent = {
    title: "Secure password recovery",
    subtitle: "Reset your password safely and securely. We'll help you get back to organizing your memories in no time.",
    features: [
      "Secure reset process",
      "Email verification required",
      "Strong password requirements",
      "Account protection",
    ],
  };

  return (
    <AuthLayout
      visualContent={visualContent}
      visualSide="right"
      gradient="from-blue-500 via-indigo-600 to-purple-600"
      backLink="/signin"
      backText="Back to Sign In"
    >
      {/* Main Form */}
      <EnhancedAuthForm
        config={formConfig}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{" "}
          <button
            onClick={() => navigateWithTransition("/signin")}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer"
          >
            Sign in instead
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;