import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../shared/services/firebase/config";

// New modular components and hooks
import AuthLayout from "../../components/layout/AuthLayout";
import EnhancedAuthForm from "../../components/ui/EnhancedAuthForm";
import SocialLoginButtons from "../../components/ui/SocialLoginButtons";
import { useAuth } from "../../hooks/useAuth";
import { useAuthValidation } from "../../hooks/useAuthValidation";
import { useAuthAnimations } from "../../hooks/useAuthAnimations";

const SignInPage = () => {
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  // Hooks
  const { signin, signInWithGoogle } = useAuth();
  const { validateSignIn } = useAuthValidation();
  const { navigateWithTransition } = useAuthAnimations();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle URL verification success message
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get("verified") === "true") {
      const message = urlParams.get("message");
      if (message) {
        toast.success(decodeURIComponent(message), { duration: 4000 });
      }
      // Clean up URL immediately to prevent re-triggering
      window.history.replaceState({}, document.title, "/signin");
    }
  }, [location.search]);

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateSignIn(formData);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setLoading(true);
      setShowVerificationAlert(false);

      // Handle remember me
      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      await signin(formData.email, formData.password);
      toast.success("Welcome back!");
      
      // Navigate to dashboard with transition
      navigateWithTransition("/dashboard");
    } catch (error) {
      console.error("Sign in error:", error);
      handleSignInError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle sign-in errors
  const handleSignInError = (error) => {
    if (error.message?.includes("verify your email")) {
      toast(error.message, {
        icon: (
          <ExclamationTriangleIcon className="h-6 w-6 text-black flex-shrink-0" />
        ),
        style: {
          background: "#fbbf24",
          color: "#000000",
          border: "1px solid #f59e0b",
          padding: "16px",
          textAlign: "center",
          minWidth: "300px",
        },
      });
      setShowVerificationAlert(true);
      return;
    }

    const errorMessages = {
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Incorrect password",
      "auth/invalid-email": "Invalid email address",
      "auth/too-many-requests": "Too many failed attempts. Please try again later",
      "auth/user-disabled": "This account has been disabled",
      "auth/invalid-credential": "Invalid email or password",
    };

    const errorMessage = errorMessages[error.code] || "Failed to sign in";
    toast.error(errorMessage);
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      toast.success("Welcome to Groupify!");
      navigateWithTransition("/dashboard");
    } catch (error) {
      console.error("Google sign in error:", error);

      const errorMessages = {
        "auth/popup-closed-by-user": "Sign in was cancelled",
        "auth/popup-blocked": "Popup was blocked. Please allow popups and try again",
      };

      const errorMessage = errorMessages[error.code] || "Failed to sign in with Google";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    try {
      console.log("Resending verification email from SignIn to:", formData.email);

      const resendFunction = httpsCallable(functions, "resendVerificationCode");
      await resendFunction({ email: formData.email });

      toast.success("Verification email sent! Check your inbox.");

      setTimeout(() => {
        navigate(`/confirm-email?email=${encodeURIComponent(formData.email)}`);
      }, 1500);
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Failed to resend email. Please try again.");
    }
  };

  // Form configuration
  const formConfig = {
    title: "Welcome back",
    subtitle: "Sign in to your account to continue organizing your memories",
    submitText: loading ? "Signing in..." : "Sign in",
    fields: [
      {
        name: "email",
        type: "email",
        label: "Email address",
        placeholder: "you@example.com",
        required: true,
        autoComplete: "email",
      },
      {
        name: "password",
        type: "password",
        label: "Password",
        placeholder: "••••••••",
        required: true,
        autoComplete: "current-password",
        showToggle: true,
      },
    ],
    checkboxes: [
      {
        name: "rememberMe",
        label: "Remember me",
      },
    ],
    links: [
      {
        text: "Forgot your password?",
        onClick: () => navigateWithTransition("/forgot-password"),
      },
    ],
  };

  // Right side visual content
  const visualContent = {
    title: "Organize your travel memories with AI",
    subtitle: "Upload photos from your trips and let our AI automatically find the ones with you in them. Share albums with friends and never lose track of your memories again.",
    features: [
      "AI-powered face recognition",
      "Collaborative photo sharing",
      "Automatic organization",
      "Secure cloud storage",
    ],
  };

  return (
    <AuthLayout
      visualContent={visualContent}
      visualSide="right"
    >
      {/* Main Form */}
      <EnhancedAuthForm
        config={formConfig}
        formData={formData}
        showPassword={showPassword}
        onInputChange={handleInputChange}
        onPasswordToggle={() => setShowPassword(!showPassword)}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {/* Conditional Verification Alert */}
      {showVerificationAlert && (
        <div className="mt-4 sm:mt-5 md:mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                Email verification required
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                Please verify your email before signing in. Check your inbox or{" "}
                <button
                  onClick={handleResendVerification}
                  className="underline font-medium hover:text-yellow-500 bg-transparent border-none cursor-pointer"
                >
                  resend verification email
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Social Login */}
      <SocialLoginButtons
        onGoogleSignIn={handleGoogleSignIn}
        loading={loading}
        dividerText="Or continue with"
      />

      {/* Sign Up Link */}
      <p className="mt-4 sm:mt-6 md:mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{" "}
        <button
          onClick={() => navigateWithTransition("/signup")}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer"
        >
          Create one now
        </button>
      </p>
    </AuthLayout>
  );
};

export default SignInPage;