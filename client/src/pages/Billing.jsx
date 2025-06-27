import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "../shared/contexts/ThemeContext";
import { useAuth } from "../features/auth/contexts/AuthContext";
import {
  CameraIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  LockClosedIcon,
  CheckIcon,
  UserIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const Billing = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card', 'paypal', 'apple'
  const [validationErrors, setValidationErrors] = useState({});

  // NEW: Payment success/failure modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'processing', 'success', 'failure'
  const [paymentProgress, setPaymentProgress] = useState(0);

  // Get plan and billing cycle from URL
  const urlParams = new URLSearchParams(location.search);
  const selectedPlan = urlParams.get("plan") || "pro";
  const billingCycle =
    urlParams.get("billing") || urlParams.get("cycle") || "monthly";

  // Check if user is coming from dashboard with existing plan
  const userCurrentPlan = JSON.parse(
    localStorage.getItem("userPlan") || '{"plan": "free"}'
  );
  const hasExistingPlan = userCurrentPlan.plan !== "free";

  // Plan details with both monthly and yearly pricing
  // Plan details with both monthly and yearly pricing
  const planDetails = {
    pro: {
      name: "Pro",
      monthly: { price: 9.99, yearlyPrice: 99.99 },
      yearly: {
        price: 99.99,
        monthlyEquivalent: 8.33,
        savings: 20.89,
        savingsPercent: 17,
      },
      storage: "50GB",
      photos: "10,000",
      features: [
        "Advanced AI face recognition",
        "Unlimited trip albums",
        "Share with up to 20 friends",
        "Priority email support",
        "Photo editing tools",
      ],
    },
    family: {
      name: "Family",
      monthly: { price: 19.99, yearlyPrice: 199.99 },
      yearly: {
        price: 199.99,
        monthlyEquivalent: 16.66,
        savings: 39.89,
        savingsPercent: 17,
      },
      storage: "250GB",
      photos: "50,000",
      features: [
        "Premium AI face recognition",
        "Unlimited trip albums",
        "Share with unlimited friends",
        "24/7 priority support",
        "Family account management",
        "Custom photo books",
      ],
    },
  };

  const currentPlan = planDetails[selectedPlan] || planDetails.pro;
  const isYearly = billingCycle === "yearly";
  const currentPrice = isYearly ? currentPlan.yearly : currentPlan.monthly;

  // Check for plan conflicts
  const hasConflict = hasExistingPlan && userCurrentPlan.plan === selectedPlan;
  const needsToCancelFirst =
    hasExistingPlan && userCurrentPlan.plan !== selectedPlan;

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      toast.error("Please sign in to access billing");
      navigate("/signin");
      return;
    }
    window.scrollTo(0, 0);
  }, [currentUser, navigate]);

  // NEW: Payment Processing Modal Component
  const PaymentModal = () => {
    if (!showPaymentModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 dark:border-gray-700/50 relative overflow-hidden">
          {paymentStatus === "processing" && (
            <>
              {/* Processing State */}
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
                  <div
                    className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"
                    style={{
                      animationDuration: "1s",
                    }}
                  ></div>
                  <div className="absolute inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <CreditCardIcon className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Processing Payment
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Please wait while we process your payment details...
                </p>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${paymentProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {paymentProgress < 30
                    ? "Validating payment details..."
                    : paymentProgress < 70
                    ? "Processing transaction..."
                    : "Finalizing your subscription..."}
                </p>
              </div>
            </>
          )}

          {paymentStatus === "success" && (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-10 h-10 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Payment Successful! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Welcome to {currentPlan.name}! Your subscription is now active
                  and you have access to all premium features.
                </p>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {currentPlan.name} Plan Activated
                    </span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {currentPlan.storage} storage • Up to {currentPlan.photos}{" "}
                    photos
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    navigate("/dashboard?section=settings");
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <HomeIcon className="w-5 h-5" />
                  Go to Dashboard
                </button>
              </div>
            </>
          )}

          {paymentStatus === "failure" && (
            <>
              {/* Failure State */}
              <div className="text-center">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                    <XMarkIcon className="w-10 h-10 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Payment Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We couldn't process your payment. Please check your payment
                  details and try again.
                </p>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Common issues: Incorrect card details, insufficient funds,
                    or card restrictions for online purchases.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentStatus(null);
                    setPaymentProgress(0);
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Card type detection with better validation
  const getCardType = (number) => {
    const cleaned = number.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    if (/^4[0-9]{0,15}$/.test(cleaned)) return "visa";
    if (
      /^5[1-5][0-9]{0,14}$/.test(cleaned) ||
      /^2[2-7][0-9]{0,14}$/.test(cleaned)
    )
      return "mastercard";
    if (/^3[47][0-9]{0,13}$/.test(cleaned)) return "amex";
    if (/^6[0-9]{0,15}$/.test(cleaned)) return "discover";

    return null;
  };

  const cardType = getCardType(cardNumber);

  // Validation functions
  const validateCardNumber = (number) => {
    const cleaned = number.replace(/\s+/g, "");
    const cardType = getCardType(number);

    if (!cardType) return "Invalid card type";

    const expectedLength = cardType === "amex" ? 15 : 16;
    if (cleaned.length !== expectedLength) {
      return `${cardType.toUpperCase()} cards must have ${expectedLength} digits`;
    }

    return null;
  };

  const validateExpiryDate = (date) => {
    if (!/^\d{2}\/\d{2}$/.test(date)) return "Invalid format (MM/YY)";

    const [month, year] = date.split("/").map((num) => parseInt(num));
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (month < 1 || month > 12) return "Month must be between 01-12";
    if (year < 25 || year > 35) return "Year must be between 25-35";

    if (year === currentYear && month < currentMonth) {
      return "Card has expired";
    }

    return null;
  };

  const validateCVV = (cvv, cardType) => {
    const expectedLength = cardType === "amex" ? 4 : 3;
    if (cvv.length !== expectedLength) {
      return `CVV must be ${expectedLength} digits for ${
        cardType?.toUpperCase() || "this card"
      }`;
    }
    return null;
  };

  const validateNameOnCard = (name) => {
    // Only allow letters and spaces, no numbers
    if (!/^[a-zA-Z\s]+$/.test(name))
      return "Name can only contain letters and spaces";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    return null;
  };

  // Format card number
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? "/" + v.substring(2, 4) : "");
    }

    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
      // Clear validation error when user starts typing
      if (validationErrors.cardNumber) {
        setValidationErrors((prev) => ({ ...prev, cardNumber: null }));
      }
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
      if (validationErrors.expiryDate) {
        setValidationErrors((prev) => ({ ...prev, expiryDate: null }));
      }
    }
  };

  const handleCvvChange = (e) => {
    const v = e.target.value.replace(/[^0-9]/gi, "");
    if (v.length <= (cardType === "amex" ? 4 : 3)) {
      setCvv(v);
      if (validationErrors.cvv) {
        setValidationErrors((prev) => ({ ...prev, cvv: null }));
      }
    }
  };

  const handleNameChange = (e) => {
    // Only allow letters and spaces - prevent numbers from being typed
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    setNameOnCard(value);
    if (validationErrors.nameOnCard) {
      setValidationErrors((prev) => ({ ...prev, nameOnCard: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (paymentMethod === "card") {
      const cardError = validateCardNumber(cardNumber);
      if (cardError) errors.cardNumber = cardError;

      const expiryError = validateExpiryDate(expiryDate);
      if (expiryError) errors.expiryDate = expiryError;

      const cvvError = validateCVV(cvv, cardType);
      if (cvvError) errors.cvv = cvvError;

      const nameError = validateNameOnCard(nameOnCard);
      if (nameError) errors.nameOnCard = nameError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // NEW: Info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [showApplePayModal, setShowApplePayModal] = useState(false);

  // NEW: Enhanced Card Logo Component with Real Logos
  const CardLogo = ({ type, active }) => {
    const baseClasses = "h-6 w-10 transition-all duration-300 object-contain";
    const activeClasses = active ? "opacity-100 scale-110" : "opacity-40";

    const logoStyle = {
      filter: active ? "none" : "grayscale(100%)",
    };

    switch (type) {
      case "visa":
        return (
          <div
            className={`${baseClasses} ${activeClasses} bg-blue-600 rounded flex items-center justify-center px-1`}
            style={logoStyle}
          >
            <span className="text-white font-bold text-xs tracking-wider">
              VISA
            </span>
          </div>
        );
      case "mastercard":
        return (
          <div
            className={`${baseClasses} ${activeClasses} bg-white border border-gray-200 rounded flex items-center justify-center px-1`}
            style={logoStyle}
          >
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full opacity-90"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full -ml-1.5 opacity-90"></div>
            </div>
          </div>
        );
      case "amex":
        return (
          <div
            className={`${baseClasses} ${activeClasses} bg-blue-500 rounded flex items-center justify-center px-1`}
            style={logoStyle}
          >
            <span className="text-white font-bold text-xs">AMEX</span>
          </div>
        );
      case "discover":
        return (
          <div
            className={`${baseClasses} ${activeClasses} bg-orange-500 rounded flex items-center justify-center px-1`}
            style={logoStyle}
          >
            <span className="text-white font-bold text-xs">DISC</span>
          </div>
        );
      default:
        return (
          <div
            className={`${baseClasses} ${activeClasses} bg-gray-400 text-white rounded flex items-center justify-center`}
          >
            <CreditCardIcon className="w-4 h-4" />
          </div>
        );
    }
  };

  // NEW: Info Modal Component
  const InfoModal = () => {
    if (!showInfoModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full mx-1 border border-white/20 dark:border-gray-700/50 max-h-[90vh] max-w-md sm:max-w-2xl md:max-w-4xl animate-in fade-in zoom-in duration-300 flex flex-col">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-t-2xl border-b border-gray-200 dark:border-gray-600 p-4 sm:p-6 flex items-center justify-center z-10">
            <div className="flex items-center gap-3 mr-12">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Payment Information Guide
              </h3>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 absolute top-4 right-4"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Left Column */}
              <div className="space-y-4 md:space-y-6">
                {/* Card Number */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4" />
                    Card Number
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Enter the 16-digit number on the front of your card (15
                    digits for Amex)
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded border p-2 text-xs font-mono">
                    <div className="text-gray-500">Example:</div>
                    <div className="text-gray-900 dark:text-white">
                      4532 1234 5678 9012
                    </div>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Expiry Date
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Found on the front of your card (MM/YY format)
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded border p-2 text-xs font-mono">
                    <div className="text-gray-500">Example:</div>
                    <div className="text-gray-900 dark:text-white">12/28</div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4 md:space-y-6">
                {/* CVV */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4" />
                    CVV Security Code
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    3 digits on the back of your card (4 digits on front for
                    Amex)
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded border p-2 text-xs font-mono">
                    <div className="text-gray-500">Example:</div>
                    <div className="text-gray-900 dark:text-white">
                      123 (or 1234 for Amex)
                    </div>
                  </div>
                </div>

                {/* Name on Card */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Name on Card
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Enter the exact name printed on your card (letters and
                    spaces only)
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded border p-2 text-xs font-mono">
                    <div className="text-gray-500">Example:</div>
                    <div className="text-gray-900 dark:text-white">
                      JOHN DOE
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Your payment information is encrypted and secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // NEW: PayPal Not Available Modal
  const PayPalModal = () => {
    if (!showPayPalModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 dark:border-gray-700/50 animate-in fade-in zoom-in duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.34-.77c-.58-1.08-1.74-1.79-3.65-1.79H12.18c-.45 0-.83.32-.92.76L9.53 13.7c-.08.46.24.88.72.88h2.19c3.42 0 5.93-1.39 6.69-5.40.23-1.21.13-2.23-.3-3.06z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              PayPal Coming Soon! 🚀
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              We're working hard to bring you PayPal integration. For now,
              please use a credit or debit card to complete your purchase
              securely.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💳 Available now:</strong> All major credit and debit
                cards are accepted and processed securely.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowPayPalModal(false);
                  setPaymentMethod("card");
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Use Credit Card Instead
              </button>
              <button
                onClick={() => setShowPayPalModal(false)}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // NEW: Apple Pay Not Available Modal
  const ApplePayModal = () => {
    if (!showApplePayModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 dark:border-gray-700/50 animate-in fade-in zoom-in duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-600 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Apple Pay Coming Soon! 🍎
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              We're excited to bring you Apple Pay integration soon! For now,
              please use a credit or debit card for a quick and secure checkout.
            </p>

            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>🔒 Secure payment:</strong> All transactions are
                encrypted and protected with industry-standard security.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowApplePayModal(false);
                  setPaymentMethod("card");
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Use Credit Card Instead
              </button>
              <button
                onClick={() => setShowApplePayModal(false)}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced submit handler with payment processing simulation
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for plan conflicts first
    if (hasConflict) {
      toast.error(`You already have the ${currentPlan.name} plan!`);
      return;
    }

    if (needsToCancelFirst) {
      toast.error(
        `Please cancel your current ${userCurrentPlan.plan} plan before purchasing another one.`
      );
      return;
    }

    // Handle PayPal/Apple Pay
    if (paymentMethod === "paypal") {
      setShowPayPalModal(true);
      return;
    }

    if (paymentMethod === "apple") {
      setShowApplePayModal(true);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);
    setShowPaymentModal(true);
    setPaymentStatus("processing");
    setPaymentProgress(0);

    try {
      // Simulate smooth payment processing with progress
      const duration = 6000; // 6 seconds total
      const intervalTime = 50; // Update every 50ms for smooth animation
      const steps = duration / intervalTime;
      const progressIncrement = 100 / steps;

      for (let i = 0; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, intervalTime));
        setPaymentProgress(Math.min(i * progressIncrement, 100));
      }

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Save plan to localStorage (simulate successful payment)
      const planData = {
        plan: selectedPlan.toLowerCase(),
        billing: billingCycle,
        purchaseDate: new Date().toISOString(),
        price: currentPrice.price,
      };
      localStorage.setItem("userPlan", JSON.stringify(planData));

      setPaymentStatus("success");

      // Show success toast
      toast.success(`Welcome to ${currentPlan.name}! 🎉`);
    } catch (error) {
      setPaymentStatus("failure");
      console.error("Payment processing error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
      {/* Navigation Header - Updated to match Pricing.jsx */}
      <nav className="relative z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="ml-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Groupify
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Complete Your Subscription
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            Hello {currentUser?.displayName}, you're upgrading to{" "}
            {currentPlan.name}
          </p>
        </div>
        {/* Plan Conflict Messages */}{" "}
        {hasConflict && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  You already have this plan
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You already have the {currentPlan.name} plan. Check your
                  dashboard for current subscription details.
                </p>
              </div>
            </div>
          </div>
        )}
        {needsToCancelFirst && (
          <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Cancel your current plan first
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Please cancel your current {userCurrentPlan.plan} plan before
                  purchasing another one. You can do this from your dashboard
                  settings.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Payment Method
                </h2>
                {/* Info Button */}
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full flex items-center justify-center transition-colors group"
                  title="Payment instructions"
                >
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Payment Method Selection - Mobile Responsive */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "card"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <CreditCardIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block">
                      Credit Card
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPayPalModal(true)}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "paypal"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.34-.77c-.58-1.08-1.74-1.79-3.65-1.79H12.18c-.45 0-.83.32-.92.76L9.53 13.7c-.08.46.24.88.72.88h2.19c3.42 0 5.93-1.39 6.69-5.40.23-1.21.13-2.23-.3-3.06z" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block">
                      PayPal
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowApplePayModal(true)}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "apple"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 bg-black rounded text-white text-xs flex items-center justify-center font-bold">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block">
                      Apple Pay
                    </span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {paymentMethod === "card" && (
                  <>
                    {/* Card Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          className={`w-full pl-4 pr-24 py-3 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white ${
                            validationErrors.cardNumber
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          disabled={loading}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                          <CardLogo type="visa" active={cardType === "visa"} />
                          <CardLogo
                            type="mastercard"
                            active={cardType === "mastercard"}
                          />
                          <CardLogo type="amex" active={cardType === "amex"} />
                          <CardLogo
                            type="discover"
                            active={cardType === "discover"}
                          />
                        </div>
                      </div>
                      {validationErrors.cardNumber && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {validationErrors.cardNumber}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Expiry Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white ${
                            validationErrors.expiryDate
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          disabled={loading}
                        />
                        {validationErrors.expiryDate && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                            {validationErrors.expiryDate}
                          </p>
                        )}
                      </div>

                      {/* CVV */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={handleCvvChange}
                          placeholder={cardType === "amex" ? "1234" : "123"}
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white ${
                            validationErrors.cvv
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          disabled={loading}
                        />
                        {validationErrors.cvv && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                            {validationErrors.cvv}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Name on Card */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        value={nameOnCard}
                        onChange={handleNameChange}
                        placeholder="John Doe"
                        className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white ${
                          validationErrors.nameOnCard
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        disabled={loading}
                      />
                      {validationErrors.nameOnCard && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {validationErrors.nameOnCard}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {paymentMethod === "paypal" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-lg">PP</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      PayPal Payment
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      You'll be redirected to PayPal to complete your payment
                      securely.
                    </p>
                  </div>
                )}

                {paymentMethod === "apple" && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-black border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Apple Pay
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Use Touch ID or Face ID to pay with your default card.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || hasConflict || needsToCancelFirst}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="w-5 h-5 mr-2" />
                      {paymentMethod === "card"
                        ? "Complete Payment"
                        : paymentMethod === "paypal"
                        ? "Continue with PayPal"
                        : "Pay with Apple Pay"}
                    </>
                  )}
                </button>

                {/* Security Note */}
                <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 pt-4">
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary - Mobile Responsive */}
          <div className="lg:col-span-1">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 sticky top-8">
              {/* Order Summary - Centered on mobile */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Order Summary
                </h3>
                <Link
                  to="/pricing"
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors gap-1"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Change
                </Link>
              </div>

              {/* Plan Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Plan</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {currentPlan.name}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Billing
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {isYearly ? "Yearly" : "Monthly"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Storage
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {currentPlan.storage}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Photos
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    Up to {currentPlan.photos}
                  </span>
                </div>
              </div>

              {/* Yearly Savings Banner */}
              {isYearly && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-semibold text-green-800 dark:text-green-400">
                      Great Choice! 🎉
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You're saving{" "}
                    <span className="font-bold">${currentPrice.savings}</span> (
                    {currentPrice.savingsPercent}%) compared to monthly billing!
                  </p>
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    Monthly equivalent: ${currentPrice.monthlyEquivalent}/month
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  What's included:
                </h4>
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {isYearly ? "Yearly price" : "Monthly price"}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    ${currentPrice.price}
                    {isYearly ? "/year" : "/month"}
                  </span>
                </div>

                {isYearly && (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Monthly equivalent
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        ${currentPrice.monthlyEquivalent}/month
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Monthly plan would cost
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 line-through">
                        ${(currentPlan.monthly.price * 12).toFixed(2)}/year
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600 dark:text-gray-400">
                        You save
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        ${currentPrice.savings} ({currentPrice.savingsPercent}%)
                      </span>
                    </div>
                  </>
                )}

                {!isYearly && <div className="mb-4"></div>}

                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 dark:text-gray-400">
                    14-day trial
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    FREE
                  </span>
                </div>

                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">
                    Due today
                  </span>
                  <span className="text-gray-900 dark:text-white">$0.00</span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  You'll be charged ${currentPrice.price}
                  {isYearly ? " annually" : " monthly"} after your 14-day trial
                  ends. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Development Notice */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  Development Mode
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Payment processing is currently in development. No charges
                  will be made at this time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              © 2025 Groupify. Secure payments, powerful features.
            </div>
          </div>
        </div>
      </footer>

      {/* All Modals */}
      <PaymentModal />
      <InfoModal />
      <PayPalModal />
      <ApplePayModal />
    </div>
  );
};

export default Billing;
