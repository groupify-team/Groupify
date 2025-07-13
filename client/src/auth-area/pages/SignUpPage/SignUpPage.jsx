import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "@shared/utils/toast";
import {
  CheckIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

import AuthLayout from "../../components/layout/AuthLayout";
import PageTransition, {
  SectionTransition,
} from "@/shared/components/ui/PageTransition";
import { useAuth } from "@auth/hooks/useAuth";
import { useAuthValidation } from "../../hooks/useAuthValidation";
import AuthHeader from "../../components/layout/AuthHeader";

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
  const [isLoaded, setIsLoaded] = useState(false);
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
    setIsLoaded(true);

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

        let redirectPath = "/confirm-email";
        let redirectState = {
          email: formData.email,
          plan: selectedPlan,
        };

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

        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.3s ease-out";
        setTimeout(() => {
          navigate(redirectPath, { state: redirectState });
        }, 300);
      }
    } catch (error) {
      console.error("Signup error:", error);

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

  const handleGoogleSignUp = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    try {
      setLoading(true);
      await signInWithGoogle();

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

  const handleNavigateToSignIn = () => {
    // Create loading overlay
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

    // Fade in overlay
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    // Navigate after overlay is visible
    setTimeout(() => {
      navigate("/signin");

      // Remove overlay after navigation
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

  const passwordStrength = getPasswordStrength(formData.password);

  const leftContent = (
    <div className="w-full h-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-12 relative overflow-hidden">
      <div className="max-w-md text-center text-white z-10">
        {/* Title */}
        <h2 className="text-3xl font-bold mb-6">Join thousands of travelers</h2>

        {/* Subtitle */}
        <p className="text-lg mb-8 text-purple-100 leading-relaxed">
          Start organizing your travel photos with AI-powered face recognition.
          Create albums, share with friends, and never lose a memory again.
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
        <div className="space-y-4 text-left">
          {[
            "Free to start - no credit card required",
            "Advanced AI face recognition",
            "Secure cloud storage",
            "Share with unlimited friends",
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
    <AuthLayout layoutType="split" leftContent={leftContent} showHeader={false}>
      <PageTransition variant="fadeIn" trigger={isLoaded}>
        {/* Form Container */}
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

            {/* Reusable Header */}
            <SectionTransition variant="slideInFromTop" delay={0.1}>
              <AuthHeader
                title="Create your account"
                subtitle="Join Groupify and start organizing your travel memories"
                showBackButton={true}
                backTo="/"
                backText="Back to Home"
              />
            </SectionTransition>

            {/* Form Section */}
            <SectionTransition variant="slideInFromBottom" delay={0.2}>
              <div className="space-y-3 sm:space-y-4 md:space-y-5 text-sm md:text-base">
                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-3 sm:space-y-4 md:space-y-5"
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
                        className="absolute inset-y-0 right-0 w-12 flex items-center justify-center"
                        disabled={loading}
                      >
                        <span className="w-5 h-5 flex items-center justify-center">
                          {showPassword ? (
                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          ) : (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          )}
                        </span>
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
                              width: `${
                                (passwordStrength.strength / 6) * 100
                              }%`,
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
                            setShowPasswordRequirements(
                              !showPasswordRequirements
                            )
                          }
                          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200"
                        >
                          <ChevronUpIcon
                            className={`w-4 h-4 transition-transform duration-300 ${
                              showPasswordRequirements
                                ? "rotate-0"
                                : "rotate-180"
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
                            {/[!@#$%^&*(),.?":{}|<>]/.test(
                              formData.password
                            ) ? (
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
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 w-12 flex items-center justify-center"
                        disabled={loading}
                      >
                        <span className="w-5 h-5 flex items-center justify-center">
                          {showConfirmPassword ? (
                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          ) : (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          )}
                        </span>
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

                  {/* Submit Button */}
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
                        selectedPlan?.charAt(0).toUpperCase() +
                        selectedPlan?.slice(1)
                      }`
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                {/* Social Login */}
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
            </SectionTransition>
          </div>
        </div>
      </PageTransition>
    </AuthLayout>
  );
};

export default SignUpPage;
