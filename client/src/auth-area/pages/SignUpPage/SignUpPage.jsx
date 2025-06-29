import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { CheckIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

// New modular components and hooks
import AuthLayout from "../../components/layout/AuthLayout";
import EnhancedAuthForm from "../../components/ui/EnhancedAuthForm";
import SocialLoginButtons from "../../components/ui/SocialLoginButtons";
import PasswordStrengthIndicator from "../../components/ui/PasswordStrengthIndicator";
import PasswordRequirements from "../../components/ui/PasswordRequirements";
import GenderSelector from "../../components/ui/GenderSelector";
import { useAuth } from "../../hooks/useAuth";
import { useAuthValidation } from "../../hooks/useAuthValidation";
import { useAuthAnimations } from "../../hooks/useAuthAnimations";

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
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(true);

  // Hooks
  const { signup, signInWithGoogle } = useAuth();
  const { validateSignUp, getPasswordStrength } = useAuthValidation();
  const { navigateWithTransition } = useAuthAnimations();
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL parameters
  const isFromPricingFree = location.search.includes("from=pricing-free");
  const planFromUrl = new URLSearchParams(location.search).get("plan");

  // Handle URL params and show plan message
  useEffect(() => {
    window.scrollTo(0, 0);

    // Show plan-specific message
    if (planFromUrl) {
      setTimeout(() => {
        const planName = planFromUrl.charAt(0).toUpperCase() + planFromUrl.slice(1);
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
  }, [isFromPricingFree, planFromUrl]);

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

    // Validate form including terms agreement
    const validation = validateSignUp({ ...formData, agreedToTerms });
    if (!validation.isValid) {
      toast.error(validation.error);
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
        toast.success(
          "Account created! Please check your email to verify your account."
        );

        // Navigate to confirm email with transition
        navigateWithTransition("/confirm-email", {
          state: {
            email: formData.email,
            plan: planFromUrl,
          },
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      handleSignUpError(error);
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

    const errorMessage = errorMessages[error.code] || error.message || "Failed to create account";
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
      toast.success("Account created successfully! Welcome to Groupify!");
      navigateWithTransition("/dashboard");
    } catch (error) {
      console.error("Google sign up error:", error);

      const errorMessages = {
        "auth/popup-closed-by-user": "Sign up was cancelled",
        "auth/popup-blocked": "Popup was blocked. Please allow popups and try again",
        "auth/account-exists-with-different-credential": 
          "An account already exists with this email using a different sign-in method",
      };

      const errorMessage = errorMessages[error.code] || "Failed to create account with Google";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate password strength
  const passwordStrength = getPasswordStrength(formData.password);

  // Form configuration
  const formConfig = {
    title: "Create your account",
    subtitle: "Join Groupify and start organizing your travel memories",
    submitText: loading ? "Creating account..." : "Create Account",
    submitDisabled: loading || !agreedToTerms,
    fields: [
      {
        name: "displayName",
        type: "text",
        label: "Full Name *",
        placeholder: "John Doe",
        required: true,
        autoComplete: "name",
      },
      {
        name: "email",
        type: "email",
        label: "Email Address *",
        placeholder: "you@example.com",
        required: true,
        autoComplete: "email",
      },
      {
        name: "password",
        type: "password",
        label: "Password *",
        placeholder: "••••••••",
        required: true,
        autoComplete: "new-password",
        showToggle: true,
        customComponent: (
          <>
            {/* Password Strength Indicator */}
            {formData.password && (
              <PasswordStrengthIndicator 
                strength={passwordStrength}
                className="mt-2"
              />
            )}
            
            {/* Password Requirements */}
            {formData.password && (
              <PasswordRequirements
                password={formData.password}
                showRequirements={showPasswordRequirements}
                onToggleRequirements={() => setShowPasswordRequirements(!showPasswordRequirements)}
                className="mt-3"
              />
            )}
          </>
        ),
      },
      {
        name: "confirmPassword",
        type: "password",
        label: "Confirm Password *",
        placeholder: "••••••••",
        required: true,
        autoComplete: "new-password",
        showToggle: true,
        showPasswordState: showConfirmPassword,
        onPasswordToggle: () => setShowConfirmPassword(!showConfirmPassword),
      },
    ],
    customFields: [
      // Gender Selection
      {
        component: (
          <GenderSelector
            value={formData.gender}
            onChange={(gender) => setFormData(prev => ({ ...prev, gender }))}
            disabled={loading}
            className="mb-4"
          />
        ),
      },
      // Terms Agreement
      {
        component: (
          <div className="flex items-start mb-4">
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
        ),
      },
    ],
  };

  // Left side visual content
  const visualContent = {
    title: "Join thousands of travelers",
    subtitle: "Start organizing your travel photos with AI-powered face recognition. Create albums, share with friends, and never lose a memory again.",
    stats: [
      { value: "10K+", label: "Active Users" },
      { value: "1M+", label: "Photos Organized" },
    ],
    features: [
      "Free to start - no credit card required",
      "Advanced AI face recognition",
      "Secure cloud storage",
      "Share with unlimited friends",
    ],
  };

  return (
    <AuthLayout
      visualContent={visualContent}
      visualSide="left"
      gradient="from-purple-600 via-indigo-600 to-blue-600"
    >
      {/* Main Form */}
      <EnhancedAuthForm
        config={formConfig}
        formData={formData}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        onInputChange={handleInputChange}
        onPasswordToggle={() => setShowPassword(!showPassword)}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {/* Social Login */}
      <SocialLoginButtons
        onGoogleSignIn={handleGoogleSignUp}
        loading={loading}
        disabled={!agreedToTerms}
        dividerText="Or sign up with"
        buttonText="Sign up with Google"
      />

      {/* Sign In Link */}
      <p className="mt-4 sm:mt-6 md:mt-8 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <button
          onClick={() => navigateWithTransition("/signin")}
          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent border-none cursor-pointer"
        >
          Sign in instead
        </button>
      </p>
    </AuthLayout>
  );
};

export default SignUpPage;