import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { 
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CameraIcon
} from "@heroicons/react/24/outline";

// New modular components and hooks
import AuthLayout from "../../components/layout/AuthLayout";
import EnhancedAuthForm from "../../components/ui/EnhancedAuthForm";
import { useAuth } from "../../hooks/useAuth";
import { useAuthValidation } from "../../hooks/useAuthValidation";

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
    
    // Check for billing redirect
    const urlParams = new URLSearchParams(location.search);
    const redirectToBilling = urlParams.get("redirect") === "billing";
    const plan = urlParams.get("plan");
    const billing = urlParams.get("billing");
    
    if (redirectToBilling && plan) {
      // Redirect to billing with plan info
      navigate(`/billing?plan=${plan}&billing=${billing || "monthly"}`, { replace: true });
    } else {
      // Normal dashboard redirect
      navigate("/dashboard", { replace: true });
    }
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
      navigate("/dashboard", { replace: true });
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
      
      // Use fetch to call HTTP function
      const response = await fetch(
        "https://us-central1-groupify-77202.cloudfunctions.net/resendVerificationCode",
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
        toast.success("Verification email sent! Check your inbox.");
        
        // Navigate to the confirmation page with email parameter
        setTimeout(() => {
          navigate(`/confirm-email?email=${encodeURIComponent(formData.email)}`);
        }, 1500);
      } else {
        throw new Error(result.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Resend error:", error);
      
      // Handle specific error messages from the HTTP function
      let errorMessage = "Failed to resend email. Please try again.";
      
      if (error.message?.includes('already verified')) {
        toast.success("Your email is already verified! Try signing in again.");
        setShowVerificationAlert(false);
        return;
      } else if (error.message?.includes('User not found')) {
        errorMessage = "User not found. Please sign up first.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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
        onClick: () => navigate("/forgot-password"),
      },
    ],
  };

  // Left side visual content component
  const leftContent = (
    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 flex items-center justify-center p-12 relative overflow-hidden">
      <div className="max-w-md text-center text-white z-10">
        {/* Title */}
        <h2 className="text-3xl font-bold mb-6">
          Organize your travel memories with AI
        </h2>
        
        {/* Subtitle */}
        <p className="text-lg mb-8 text-purple-100 leading-relaxed">
          Upload photos from your trips and let our AI automatically find the ones with you in them. Share albums with friends and never lose track of your memories again.
        </p>
        
        {/* Features list */}
        <div className="space-y-4 text-left">
          {[
            "AI-powered face recognition",
            "Collaborative photo sharing", 
            "Automatic organization",
            "Secure cloud storage"
          ].map((feature, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-purple-100 font-medium">{feature}</span>
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
                to="/"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
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
                Welcome back
              </h2>
              <p className="mt-1 sm:mt-2 text-xs [@media(min-width:375px)]:text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                Sign in to your account to continue organizing your memories
              </p>
            </div>
          </div>
          {/* Enhanced Form Section with SignUpPage styling */}
          <div className="space-y-3 sm:space-y-4 md:space-y-5 text-sm md:text-base">
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

            {/* Social Login - Fixed Google Button with SignUpPage styling */}
            <div className="mt-4 sm:mt-6 md:mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`mt-3 sm:mt-4 md:mt-6 w-full flex justify-center items-center py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 border rounded-lg shadow-sm text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform ${
                  loading
                    ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50 scale-95"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 scale-100 hover:scale-[1.02] hover:shadow-md"
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Sign in with Google
              </button>
            </div>

            {/* Sign Up Link with SignUpPage styling */}
            <p className="mt-4 sm:mt-6 md:mt-8 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <button
                onClick={() => navigateWithTransition("/signup")}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer"
              >
                Create one now
              </button>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignInPage;