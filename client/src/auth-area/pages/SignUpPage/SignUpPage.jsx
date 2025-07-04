import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  CheckIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeSlashIcon,
  CameraIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../hooks/useAuth";
import { useAuthValidation } from "../../hooks/useAuthValidation";

const SignUpPage = () => {
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    gender: "male",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(true);

  // Hooks
  const { signup, signInWithGoogle } = useAuth();
  const { validateSignUp, getPasswordStrength } = useAuthValidation();
  const navigate = useNavigate();
  const location = useLocation();

  // URL parameters - Enhanced to handle billing flow
  const urlParams = new URLSearchParams(location.search);
  const selectedPlan = urlParams.get("plan");
  const billingCycle = urlParams.get("billing");
  const redirectAfter = urlParams.get("redirect");
  const isFromPricingFree = location.search.includes("from=pricing-free");

  // Show plan info if user is signing up for a specific plan
  const showPlanInfo = selectedPlan && selectedPlan !== "free";

  // Handle URL params and show plan message
  useEffect(() => {
    window.scrollTo(0, 0);

    // Show plan-specific message
    if (selectedPlan) {
      setTimeout(() => {
        const planName =
          selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
        toast.success(
          `Great choice! Let's set up your account for the ${planName} plan 🎯`,
          {
            duration: 4000,
            icon: "⭐",
          }
        );
      }, 500);
    }

    // Fade in animation
    const timer = setTimeout(() => {
      document.body.style.transition = "opacity 0.3s ease-in";
      document.body.style.opacity = "1";
    }, 50);

    return () => clearTimeout(timer);
  }, [isFromPricingFree, selectedPlan]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form including terms agreement
    const validation = validateSignUp({ ...formData, agreedToTerms });
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setLoading(true);

      const result = await signup(
        formData.email,
        formData.password,
        formData.displayName,
        formData.gender
      );

      if (result.success) {
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
                  name: formData.displayName,
                },
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const emailResult = await response.json();

          if (emailResult.success) {
            console.log("Verification email sent successfully");
            toast.success(
              "Account created! Please check your email to verify your account."
            );
          } else {
            throw new Error(
              emailResult.message || "Failed to send verification email"
            );
          }
        } catch (emailError) {
          console.error("Send verification email error:", emailError);
          toast.success(
            "Account created! Please try to resend verification email from the sign-in page."
          );
        }

        // Step 3: Determine redirect destination
        let redirectPath = "/confirm-email";
        let redirectState = {
          email: formData.email,
          plan: selectedPlan,
        };

        // If user signed up for a paid plan and should go to billing
        if (
          redirectAfter === "billing" &&
          selectedPlan &&
          selectedPlan !== "free"
        ) {
          redirectState.redirectToBilling = true;
          redirectState.billingParams = {
            plan: selectedPlan,
            billing: billingCycle || "monthly",
          };
        }

        // Navigate with smooth transition
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.3s ease-out";
        setTimeout(() => {
          navigate(redirectPath, { state: redirectState });
        }, 300);
      }
    } catch (error) {
      console.error("Signup error:", error);

      // Handle specific errors
      if (error.code === "auth/email-already-in-use") {
        toast.error(
          "An account with this email already exists. Please sign in instead."
        );
      } else {
        handleSignUpError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle sign-up errors
  const handleSignUpError = (error) => {
    const errorMessages = {
      "auth/email-already-in-use": "An account with this email already exists",
      "auth/weak-password": "Password is too weak",
      "auth/invalid-email": "Invalid email address",
    };

    const errorMessage =
      errorMessages[error.code] || error.message || "Failed to create account";
    toast.error(errorMessage);
  };

  // Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    try {
      setLoading(true);
      await signInWithGoogle();

      // Handle post-signup redirect for Google users
      if (
        redirectAfter === "billing" &&
        selectedPlan &&
        selectedPlan !== "free"
      ) {
        toast.success(
          "Account created successfully! Redirecting to checkout..."
        );
        setTimeout(() => {
          navigate(
            `/billing?plan=${selectedPlan}&billing=${billingCycle || "monthly"}`
          );
        }, 1000);
      } else {
        toast.success("Account created successfully! Welcome to Groupify!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Google sign up error:", error);

      const errorMessages = {
        "auth/popup-closed-by-user": "Sign up was cancelled",
        "auth/popup-blocked":
          "Popup was blocked. Please allow popups and try again",
        "auth/account-exists-with-different-credential":
          "An account already exists with this email using a different sign-in method",
      };

      const errorMessage =
        errorMessages[error.code] || "Failed to create account with Google";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation to sign in
  const handleNavigateToSignIn = () => {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => {
      navigate("/signin");
    }, 300);
  };

  // Calculate password strength using hook
  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden md:flex md:flex-1 md:flex-col md:justify-center md:items-center md:px-6 lg:px-8 xl:px-12 2xl:px-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-white max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl text-center md:text-left">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 lg:mb-4 xl:mb-6">
            Join thousands of travelers
          </h2>
          <p className="text-base lg:text-lg xl:text-xl text-purple-100 mb-4 lg:mb-6 xl:mb-8 leading-relaxed">
            Start organizing your travel photos with AI-powered face
            recognition. Create albums, share with friends, and never lose a
            memory again.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-purple-200">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">1M+</div>
              <div className="text-purple-200">Photos Organized</div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <CheckIcon className="w-4 h-4" />
              </div>
              <span>Free to start - no credit card required</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <CheckIcon className="w-4 h-4" />
              </div>
              <span>Advanced AI face recognition</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <CheckIcon className="w-4 h-4" />
              </div>
              <span>Secure cloud storage</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <CheckIcon className="w-4 h-4" />
              </div>
              <span>Share with unlimited friends</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-2 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4 md:px-6 lg:px-12 xl:px-20 2xl:px-24 bg-white dark:bg-gray-900 min-h-0">
        <div className="mx-auto w-full max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md">
          {/* Plan Info Banner */}
          {showPlanInfo && (
            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
                  🎯 Signing up for{" "}
                  {selectedPlan?.charAt(0).toUpperCase() +
                    selectedPlan?.slice(1)}{" "}
                  Plan
                </h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-300">
                  {redirectAfter === "billing"
                    ? "After creating your account, you'll be redirected to complete your subscription"
                    : "Great choice! Let's get your account set up"}
                </p>
                {billingCycle === "yearly" && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                    💰 Save 20% with yearly billing
                  </div>
                )}
              </div>
            </div>
          )}

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
                Create your account
              </h2>
              <p className="mt-1 sm:mt-2 text-xs [@media(min-width:375px)]:text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                Join Groupify and start organizing your travel memories
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-4 md:space-y-5 text-sm md:text-base"
          >
            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-xs sm:text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
              >
                Full Name *
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                value={formData.displayName}
                onChange={handleInputChange}
                className="input-primary py-1.5 sm:py-2 md:py-3"
                placeholder="John Doe"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
              >
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input-primary py-1.5 sm:py-2 md:py-3"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
              >
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-primary pr-12 py-1.5 sm:py-2 md:py-3"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Password strength:
                    </span>
                    <span
                      className={`font-medium ${
                        passwordStrength.label === "Strong"
                          ? "text-green-600"
                          : passwordStrength.label === "Medium"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{
                        width: `${(passwordStrength.strength / 6) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password requirements:
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordRequirements(!showPasswordRequirements)
                    }
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200"
                  >
                    <ChevronUpIcon
                      className={`w-4 h-4 transition-transform duration-300 ${
                        showPasswordRequirements ? "rotate-0" : "rotate-180"
                      }`}
                    />
                  </button>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showPasswordRequirements
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center">
                      {formData.password.length >= 6 ? (
                        <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                      )}
                      <span
                        className={`text-sm ${
                          formData.password.length >= 6
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        At least 6 characters
                      </span>
                    </div>
                    <div className="flex items-center">
                      {/[A-Z]/.test(formData.password) ? (
                        <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                      )}
                      <span
                        className={`text-sm ${
                          /[A-Z]/.test(formData.password)
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center">
                      {/[a-z]/.test(formData.password) ? (
                        <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                      )}
                      <span
                        className={`text-sm ${
                          /[a-z]/.test(formData.password)
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        One lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center">
                      {/\d/.test(formData.password) ? (
                        <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                      )}
                      <span
                        className={`text-sm ${
                          /\d/.test(formData.password)
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        One number
                      </span>
                    </div>
                    <div className="flex items-center">
                      {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? (
                        <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-400 rounded-full mr-2"></div>
                      )}
                      <span
                        className={`text-sm ${
                          /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        One special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs sm:text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
              >
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input-primary pr-12 py-1.5 sm:py-2 md:py-3"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <p className="block text-xs sm:text-sm md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Gender (Optional)
              </p>
              <div className="flex space-x-2 sm:space-x-3">
                {["male", "female", "other"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, gender: option }))
                    }
                    disabled={loading}
                    className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg border text-xs sm:text-sm font-medium transition-all ${
                      formData.gender === option
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                  disabled={loading}
                />
              </div>
              <div className="ml-3 text-xs sm:text-sm">
                <label
                  htmlFor="terms"
                  className="text-gray-700 dark:text-gray-300 leading-tight"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy-policy"
                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            {/* Submit Button - Update text based on plan */}
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className={`w-full flex items-center justify-center py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base relative overflow-hidden rounded-lg font-medium transition-all duration-300 ease-in-out transform ${
                loading || !agreedToTerms
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50 scale-95"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl scale-100 hover:scale-[1.02]"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </>
              ) : showPlanInfo && redirectAfter === "billing" ? (
                `Create Account & Continue to ${
                  selectedPlan?.charAt(0).toUpperCase() + selectedPlan?.slice(1)
                }`
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-4 sm:mt-6 md:mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or sign up with
                </span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading || !agreedToTerms}
              className={`mt-3 sm:mt-4 md:mt-6 w-full flex justify-center items-center py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 border rounded-lg shadow-sm text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out transform ${
                loading || !agreedToTerms
                  ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50 scale-95"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 scale-100 hover:scale-[1.02] hover:shadow-md"
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <img
                  className="h-5 w-5 mr-2"
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google logo"
                />
              )}
              Sign up with Google
            </button>
          </div>

          {/* Sign In Link */}
          <p className="mt-4 sm:mt-6 md:mt-8 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <button
              onClick={handleNavigateToSignIn}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer"
            >
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
