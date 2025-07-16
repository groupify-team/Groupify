import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@shared/utils/toast";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import AuthLayout from "../../components/layout/AuthLayout";
import AuthHeader from "../../components/layout/AuthHeader";
import AuthForm from "../../components/ui/AuthForm";
import PageTransition, {
  SectionTransition,
} from "@/shared/components/ui/PageTransition";
import { useAuth } from "@auth/hooks/useAuth";
import { useAuthValidation } from "../../hooks/useAuthValidation";

const SignInPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  const { signin, signInWithGoogle } = useAuth();
  const { validateSignIn } = useAuthValidation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get("verified") === "true") {
      const message = urlParams.get("message");
      if (message) {
        toast.success(decodeURIComponent(message), { duration: 4000 });
      }
      window.history.replaceState({}, document.title, "/signin");
    }
    setIsLoaded(true);
  }, [location.search]);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateSignIn(formData);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setLoading(true);
      setShowVerificationAlert(false);

      if (formData.rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      await signin(formData.email, formData.password);
      toast.success("Welcome back!");

      const urlParams = new URLSearchParams(location.search);
      const redirectToBilling = urlParams.get("redirect") === "billing";
      const plan = urlParams.get("plan");
      const billing = urlParams.get("billing");

      if (redirectToBilling && plan) {
        navigate(`/billing?plan=${plan}&billing=${billing || "monthly"}`, {
          replace: true,
        });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Sign in error:", error);
      handleSignInError(error);
    } finally {
      setLoading(false);
    }
  };

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
      "auth/too-many-requests":
        "Too many failed attempts. Please try again later",
      "auth/user-disabled": "This account has been disabled",
      "auth/invalid-credential": "Invalid email or password",
    };

    const errorMessage = errorMessages[error.code] || "Failed to sign in";
    toast.error(errorMessage);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();

      // Check registration type and show appropriate message
      const registrationType = localStorage.getItem(
        "groupify_google_registration_type"
      );

      // Clean up flag
      localStorage.removeItem("groupify_google_registration_type");

      switch (registrationType) {
        case "new":
          toast.success(
            "🎉 Welcome to Groupify! Your account has been created successfully!"
          );
          break;
        case "linked":
          toast.success("✅ Google account linked successfully! Welcome back!");
          break;
        case "returning":
          toast.success("👋 Welcome back!");
          break;
        default:
          toast.success("Welcome to Groupify!");
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Google sign in error:", error);

      const errorMessages = {
        "auth/popup-closed-by-user": "Sign in was cancelled",
        "auth/popup-blocked":
          "Popup was blocked. Please allow popups and try again",
        "auth/account-exists-with-different-credential":
          "An account already exists with this email. The accounts have been linked successfully!",
      };

      const errorMessage =
        errorMessages[error.code] || "Failed to sign in with Google";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToForgotPassword = () => {
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center transition-opacity duration-300";
    overlay.style.opacity = "0";
    overlay.innerHTML = `
    <div class="flex flex-col items-center space-y-4">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p class="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
    </div>
  `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    setTimeout(() => {
      navigate("/forgot-password");
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.style.opacity = "0";
          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, 300);
        }
      }, 100);
    }, 300);
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch(
        "https://us-central1-groupify-77202.cloudfunctions.net/sendVerificationEmail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              email: formData.email,
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
        toast.success("Verification email sent! Check your inbox.");
        setTimeout(() => {
          navigate(
            `/confirm-email?email=${encodeURIComponent(formData.email)}`
          );
        }, 1500);
      } else {
        throw new Error(result.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Resend error:", error);

      let errorMessage = "Failed to resend email. Please try again.";

      if (error.message?.includes("already verified")) {
        toast.success("Your email is already verified! Try signing in again.");
        setShowVerificationAlert(false);
        return;
      } else if (error.message?.includes("User not found")) {
        errorMessage = "User not found. Please sign up first.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const formConfig = {
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

  const leftContent = (
    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 flex items-center justify-center p-12 relative overflow-hidden">
      <div className="max-w-md text-center text-white z-10">
        <h2 className="text-3xl font-bold mb-6">
          Organize your travel memories with AI
        </h2>
        <p className="text-lg mb-8 text-purple-100 leading-relaxed">
          Upload photos from your events and let our AI automatically find the
          ones with you in them. Share albums with friends and never lose track
          of your memories again.
        </p>
        <div className="space-y-4 text-left">
          {[
            "AI-powered face recognition",
            "Collaborative photo sharing",
            "Automatic organization",
            "Secure cloud storage",
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
        <div className="flex-1 flex flex-col justify-center items-center py-4 px-4 sm:py-6 sm:px-6 md:py-8 md:px-8 lg:py-8 lg:px-12 xl:px-16 2xl:px-20 bg-white dark:bg-gray-900 min-h-screen">
          {/* Responsive container with fluid width */}
          <div className="mx-auto w-full min-w-[280px] max-w-[320px] xs:max-w-[340px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[460px] xl:max-w-[400px]">
            {/* Reusable Header */}
            <SectionTransition variant="slideInFromTop" delay={0.1}>
              <AuthHeader
                title="Welcome back"
                subtitle="Sign in to your account to continue organizing your memories"
                showBackButton={true}
                backTo="/"
                backText="Back to Home"
              />
            </SectionTransition>

            {/* Form Section */}
            <SectionTransition variant="slideInFromBottom" delay={0.2}>
              <div className="space-y-4 sm:space-y-5 md:space-y-6 text-sm sm:text-base">
                <AuthForm
                  config={formConfig}
                  formData={formData}
                  showPassword={showPassword}
                  onInputChange={handleInputChange}
                  onPasswordToggle={() => setShowPassword(!showPassword)}
                  onSubmit={handleSubmit}
                  loading={loading}
                />

                {/* Verification Alert */}
                {showVerificationAlert && (
                  <div className="mt-4 sm:mt-5 md:mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                          Email verification required
                        </p>
                        <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                          Please verify your email before signing in. Check your
                          inbox or{" "}
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
                <div className="mt-6 sm:mt-7 md:mt-8">
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
                    className={`mt-4 sm:mt-5 md:mt-6 w-full flex justify-center items-center py-2.5 sm:py-3 md:py-3.5 px-4 border rounded-lg shadow-sm text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform ${
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

                {/* Sign Up Link */}
                <p className="mt-6 sm:mt-7 md:mt-8 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <button
                    onClick={() => navigate("/signup")}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer"
                  >
                    Create one now
                  </button>
                </p>
              </div>
            </SectionTransition>
          </div>
        </div>
      </PageTransition>
    </AuthLayout>
  );
};

export default SignInPage;
