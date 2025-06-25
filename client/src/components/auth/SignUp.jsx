import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import {
  EyeIcon,
  EyeSlashIcon,
  CameraIcon,
  MoonIcon,
  SunIcon,
  ArrowLeftIcon,
  CheckIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const SignUp = () => {
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

  const { signup, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isFromPricingFree = location.search.includes("from=pricing-free");

  // Add to the top of each page component
  useEffect(() => {
    window.scrollTo(0, 0);

    // Wait for navigation to complete, then fade in
    const timer = setTimeout(() => {
      document.body.style.transition = "opacity 0.2s ease-in";
      document.body.style.opacity = "1";
    }, 100);

    return () => clearTimeout(timer);
  }, [isFromPricingFree]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const { email, password, confirmPassword, displayName } = formData;

    if (!email || !password || !confirmPassword || !displayName) {
      toast.error("Please fill in all required fields");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      toast.error(
        "Password must contain uppercase, lowercase, numbers, and special characters"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      console.log("Starting signup process...");

      const result = await signup(
        formData.email,
        formData.password,
        formData.displayName,
        formData.gender
      );
      console.log("Signup result:", result);

      if (result.success) {
        // Show ONE success message here
        toast.success(
          "Account created! Please check your email to verify your account."
        );

        // Add smooth transition
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.3s ease-out";
        setTimeout(() => {
          navigate("/confirm-email", {
            state: {
              email: formData.email,
            },
          });
        }, 300);
      }
    } catch (error) {
      console.error("Signup error:", error);

      let errorMessage = "Failed to create account";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    try {
      setLoading(true);
      await signInWithGoogle();
      toast.success("Account created successfully! Welcome to Groupify!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Google sign up error:", error);

      let errorMessage = "Failed to create account with Google";

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign up was cancelled";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup was blocked. Please allow popups and try again";
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        errorMessage =
          "An account already exists with this email using a different sign-in method";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Weak", color: "bg-red-500" };
    if (strength <= 4)
      return { strength, label: "Medium", color: "bg-yellow-500" };
    return { strength, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength();

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
      <div className="flex-1 flex flex-col justify-center py-2 px-3 sm:py-4 sm:px-4 md:py-6 md:px-6 lg:py-8 lg:px-12 xl:px-20 2xl:px-24 bg-white dark:bg-gray-900">
        <div className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md">
          {/* Header */}
          <div className="mb-8">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-2 sm:mb-4 md:mb-6 lg:mb-8 pt-2 sm:pt-3 md:pt-4">
              <Link
                to="/"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
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

            {/* Logo positioned in middle between top and title */}
            <div className="flex items-center justify-center md:justify-start mb-8 [@media(min-width:375px)]:mb-12 sm:mb-16 md:mb-20 lg:mb-24">
              <div className="w-10 h-10 [@media(min-width:375px)]:w-12 [@media(min-width:375px)]:h-12 sm:w-14 sm:h-14 md:w-12 md:h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <CameraIcon className="w-5 h-5 [@media(min-width:375px)]:w-6 [@media(min-width:375px)]:h-6 sm:w-8 sm:h-8 md:w-6 md:h-6 text-white" />
              </div>
              <span className="ml-2 text-xl [@media(min-width:375px)]:text-2xl sm:text-3xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>

            {/* Title section */}
            <div className="text-center md:text-left mb-3 [@media(min-width:375px)]:mb-4 sm:mb-6 md:mb-8 lg:mb-10">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className="w-full btn-primary flex items-center justify-center py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base relative overflow-hidden"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </>
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
              className="mt-3 sm:mt-4 md:mt-6 w-full flex justify-center items-center py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <Link
              to="/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
