import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth-area/contexts/AuthContext";
import { toast } from "react-hot-toast";
import PublicLayout from "../../../public-area/components/layout/PublicLayout";
import HeroSection from "../../../public-area/components/ui/HeroSection";
import navigationService from "../../services/navigationService";
import subscriptionService from "../../services/subscriptionService";
import {
  CheckIcon,
  XMarkIcon,
  StarIcon,
  SparklesIcon,
  UserGroupIcon,
  CloudIcon,
  ShieldCheckIcon,
  HeartIcon,
  BoltIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const PricingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly"); // 'monthly' or 'yearly'
  const [openFaq, setOpenFaq] = useState(null);
  const [showFreeModal, setShowFreeModal] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  // Navigation context and subscription data
  const [navigationContext, setNavigationContext] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoaded(true);

    // Get navigation context and subscription data
    const context = navigationService.getContext();
    const subscription = subscriptionService.getCurrentSubscription();
    
    setNavigationContext(context);
    setCurrentSubscription(subscription);

    // Log navigation context for debugging
    if (context) {
      console.log("🧭 Pricing page loaded with context:", context);
    }
  }, []);

    const pricingPlans = [
    {
        name: "Free",
        description: "Perfect for getting started with photo organization",
        price: { monthly: 0, yearly: 0 },
        badge: null,
        features: [
        "Up to 5 trips", // UPDATED to match CORE_LIMITS
        "Up to 30 photos per trip", // UPDATED to match CORE_LIMITS  
        "2GB total storage", // UPDATED to match CORE_LIMITS
        "Up to 5 members per trip", // UPDATED to match CORE_LIMITS
        "Basic AI face recognition",
        "Mobile app access",
        "Standard photo quality", 
        "Email support",
        ],
        limitations: [
        "Limited trips and photos",
        "Basic recognition accuracy", 
        "No advanced features",
        ],
        cta: "Get Started Free",
        popular: false,
        color: "gray",
    },
    {
        name: "Premium", // CHANGED from "Pro" to match your CORE_LIMITS
        description: "Ideal for active travelers and photo enthusiasts",
        price: { monthly: 9.99, yearly: 99.99 },
        badge: "Most Popular",
        features: [
        "Up to 50 trips", // UPDATED to match CORE_LIMITS
        "Up to 200 photos per trip", // UPDATED to match CORE_LIMITS
        "50GB total storage", // UPDATED to match CORE_LIMITS
        "Up to 20 members per trip", // UPDATED to match CORE_LIMITS
        "Advanced AI face recognition",
        "Mobile & desktop apps",
        "High-quality photo processing",
        "Priority email support", 
        "Collaborative editing",
        "Advanced search filters",
        "Photo editing tools",
        ],
        limitations: [],
        cta: "Start Premium Trial",
        popular: true,
        color: "indigo",
    },
    {
        name: "Pro", // RENAMED from "Family" 
        description: "Perfect for unlimited trips and maximum storage",
        price: { monthly: 19.99, yearly: 199.99 },
        badge: "Best Value",
        features: [
        "Unlimited trips", // UPDATED to match CORE_LIMITS
        "Unlimited photos per trip", // UPDATED to match CORE_LIMITS  
        "500GB total storage", // UPDATED to match CORE_LIMITS
        "Unlimited members per trip", // UPDATED to match CORE_LIMITS
        "Premium AI face recognition",
        "All apps & platforms",
        "Original quality photos",
        "24/7 priority support",
        "Advanced privacy controls",
        "Custom photo books", 
        "Professional photo prints",
        "Video storage & organization",
        ],
        limitations: [],
        cta: "Start Pro Plan",
        popular: false,
        color: "purple",
    },
    {
        name: "Enterprise",
        description: "Custom solutions for businesses and organizations", 
        price: { monthly: "Custom", yearly: "Custom" },
        badge: "Contact Sales",
        features: [
        "Everything in Pro",
        "Custom integrations",
        "Dedicated account manager", 
        "White-label solutions",
        "Custom user permissions",
        "Advanced analytics",
        "GDPR & compliance tools",
        "Custom deployment options",
        "Training & onboarding",
        ],
        limitations: [],
        cta: "Contact Sales",
        popular: false,
        color: "emerald",
    },
    ];

  const faqs = [
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer:
        "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll only pay the prorated difference. When downgrading, the change will take effect at your next billing cycle.",
    },
    {
      question: "What happens if I exceed my storage limit?",
      answer:
        "We'll notify you when you approach your storage limit. You can either upgrade your plan or delete some photos to free up space. We'll never delete your photos without your permission.",
    },
    {
      question: "Is there a free trial for paid plans?",
      answer:
        "Yes! All paid plans come with a 14-day free trial. You can cancel anytime during the trial period without being charged.",
    },
    {
      question: "How does the AI face recognition work?",
      answer:
        "Our AI analyzes facial features in your photos to identify and group images of the same person. Higher-tier plans have more advanced algorithms that work better in challenging lighting conditions and with partial faces.",
    },
    {
      question:
        "Can I share photos with people who don't have Groupify accounts?",
      answer:
        "Yes! You can share individual photos or entire albums via secure links. Recipients can view and download photos without creating an account.",
    },
    {
      question: "Is my data secure and private?",
      answer:
        "Absolutely! We use enterprise-grade encryption, secure cloud storage, and never share your personal photos with third parties. You maintain full control over your data.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers.",
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer:
        "Yes! We offer a 30-day money-back guarantee for all paid plans. If you're not completely satisfied, contact us for a full refund.",
    },
  ];

  const features = [
    {
      icon: SparklesIcon,
      title: "AI-Powered Recognition",
      description:
        "Advanced machine learning algorithms that get smarter with every photo you upload.",
    },
    {
      icon: CloudIcon,
      title: "Secure Cloud Storage",
      description:
        "Enterprise-grade security with automatic backups and 99.9% uptime guarantee.",
    },
    {
      icon: UserGroupIcon,
      title: "Seamless Sharing",
      description:
        "Share memories with friends and family effortlessly across all devices.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Privacy First",
      description:
        "Your photos are private by default with granular privacy controls.",
    },
  ];

  const handlePlanSelect = (plan) => {
    if (plan.name === "Free") {
      if (currentUser) {
        // Check if user already has free plan
        if (currentSubscription?.plan === 'free') {
          toast.success("You're already on the free plan!");
          handleBackNavigation();
        } else {
          // Downgrade to free plan
          subscriptionService.updateSubscription({
            plan: 'free',
            billing: 'monthly',
            price: 0
          });
          toast.success("Switched to free plan successfully!");
          handleBackNavigation();
        }
      } else {
        setShowFreeModal(true);
      }
    } else if (plan.name === "Enterprise") {
      setShowEnterpriseModal(true);
    } else if (plan.name === "Pro" || plan.name === "Family") {
      if (currentUser) {
        // User is logged in - set context and go to billing
        navigationService.navigateToBilling(navigate, {
          plan: plan.name.toLowerCase(),
          billing: billingCycle,
          from: navigationContext?.origin || 'pricing'
        });
      } else {
        // User not logged in - go to signup with plan info
        // The signup page will redirect to billing after successful registration
        navigate(`/signup?plan=${plan.name.toLowerCase()}&billing=${billingCycle}&redirect=billing`);
      }
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Handle back navigation
  const handleBackNavigation = () => {
    navigationService.navigateBack(navigate, { 
      fallbackPath: "/" 
    });
  };

  // Handle get started action
  const handleGetStarted = () => {
    if (currentUser) {
      // User is logged in, redirect to dashboard
      navigationService.navigateBack(navigate, { 
        fallbackPath: "/dashboard" 
      });
    } else {
      // User not logged in, go to signup
      navigate("/signup?from=pricing");
    }
  };

  const getPlanColor = (color, opacity = "") => {
    const colors = {
      gray: `bg-gray-100 dark:bg-gray-700${opacity}`,
      indigo: `bg-indigo-100 dark:bg-indigo-900/30${opacity}`,
      purple: `bg-purple-100 dark:bg-purple-900/30${opacity}`,
      emerald: `bg-emerald-100 dark:bg-emerald-900/30${opacity}`,
    };
    return colors[color] || colors.gray;
  };

  const getPlanTextColor = (color) => {
    const colors = {
      gray: "text-gray-600 dark:text-gray-400",
      indigo: "text-indigo-600 dark:text-indigo-400",
      purple: "text-purple-600 dark:text-purple-400",
      emerald: "text-emerald-600 dark:text-emerald-400",
    };
    return colors[color] || colors.gray;
  };

  const getPlanButtonColor = (color) => {
    const colors = {
      gray: "bg-gray-600 hover:bg-gray-700",
      indigo: "bg-indigo-600 hover:bg-indigo-700",
      purple: "bg-purple-600 hover:bg-purple-700",
      emerald: "bg-emerald-600 hover:bg-emerald-700",
    };
    return colors[color] || colors.gray;
  };

  // Create billing toggle component for hero
  const billingToggle = (
    <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-xl p-1 mb-6 sm:mb-8">
      <button
        onClick={() => setBillingCycle("monthly")}
        className={`px-6 py-3 sm:px-6 sm:py-3 rounded-lg text-base sm:text-base font-medium transition-all ${
          billingCycle === "monthly"
            ? "bg-white text-indigo-600 shadow-md"
            : "text-white hover:text-indigo-200"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => setBillingCycle("yearly")}
        className={`px-6 py-3 sm:px-6 sm:py-3 rounded-lg text-base sm:text-base font-medium transition-all relative ${
          billingCycle === "yearly"
            ? "bg-white text-indigo-600 shadow-md"
            : "text-white hover:text-indigo-200"
        }`}
      >
        Yearly
        <span className="absolute -top-2 -right-5 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold cursor-pointer hover:bg-yellow-300 hover:scale-110 hover:shadow-lg hover:rotate-12 transition-all duration-300 ease-out hover:animate-pulse">
          Save 20%
        </span>
      </button>
    </div>
  );

  return (
    <PublicLayout 
      headerType="public"
      footerType="default"
      footerProps={{ 
        customText: "© 2025 Groupify. Simple pricing, powerful features."
      }}
    >
      {/* Navigation Breadcrumb */}
      {navigationContext && (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <button
              onClick={handleBackNavigation}
              className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to {navigationContext.origin === 'dashboard-settings' ? 'Settings' : 'Previous Page'}
            </button>
          </div>
        </div>
      )}

      {/* Current Plan Notice */}
      {currentUser && currentSubscription && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  Current plan: <strong className="capitalize">{currentSubscription.plan}</strong>
                  {currentSubscription.isTrial && (
                    <span className="ml-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded text-xs">
                      Trial - {currentSubscription.trialDaysRemaining} days left
                    </span>
                  )}
                </span>
              </div>
              {currentSubscription.plan !== 'free' && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Next billing: {currentSubscription.nextBillingDate ? 
                    new Date(currentSubscription.nextBillingDate).toLocaleDateString() : 
                    'N/A'
                  }
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection
        variant="pricing"
        badge={{ 
          icon: StarIcon, 
          text: "Simple, Transparent Pricing" 
        }}
        title="Choose Your Perfect Plan"
        description="From free photo organization to enterprise solutions, find the plan that fits your needs. Start free and upgrade anytime."
        additionalContent={billingToggle}
        className="bg-gradient-to-r from-indigo-600 to-purple-600"
      />

      {/* Pricing Plans */}
      <div className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            {pricingPlans.map((plan, index) => {
              // Check if this is the user's current plan
              const isCurrentPlan = currentSubscription?.plan === plan.name.toLowerCase();
              
              return (
                <div
                  key={plan.name}
                  className={`relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                    plan.popular ? "ring-2 ring-indigo-500 lg:scale-105" : ""
                  } ${
                    isCurrentPlan ? "ring-2 ring-green-500" : ""
                  } ${
                    isLoaded
                      ? `opacity-100 translate-y-0 delay-${index * 100}`
                      : "opacity-0 translate-y-8"
                  }`}
                >
                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-green-500 text-center py-2">
                      <span className="text-sm font-semibold text-white">
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  {plan.badge && !isCurrentPlan && (
                    <div
                      className={`absolute top-0 left-0 right-0 ${getPlanColor(
                        plan.color
                      )} text-center py-2`}
                    >
                      <span
                        className={`text-base sm:text-sm font-semibold ${getPlanTextColor(
                          plan.color
                        )}`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div
                    className={`p-6 sm:p-8 ${(plan.badge || isCurrentPlan) ? "pt-12 sm:pt-14" : ""}`}
                  >
                    {/* Plan Header */}
                    <div className="text-center mb-6 sm:mb-8">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                        {plan.description}
                      </p>

                      {/* Pricing */}
                      <div className="mb-4">
                        {typeof plan.price[billingCycle] === "number" ? (
                          <>
                            <div className="flex items-baseline justify-center">
                              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                                ${plan.price[billingCycle]}
                              </span>
                              {plan.price[billingCycle] > 0 && (
                                <span className="text-gray-600 dark:text-gray-400 ml-2">
                                  /{billingCycle === "yearly" ? "year" : "month"}
                                </span>
                              )}
                            </div>
                            {billingCycle === "yearly" &&
                              plan.price.monthly > 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  ${(plan.price.yearly / 12).toFixed(2)}/month
                                  billed annually
                                </div>
                              )}
                          </>
                        ) : (
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            {plan.price[billingCycle]}
                          </div>
                        )}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handlePlanSelect(plan)}
                        disabled={isCurrentPlan && plan.name !== "Free"}
                        className={`w-full ${
                          isCurrentPlan && plan.name !== "Free" 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : getPlanButtonColor(plan.color)
                        } text-white px-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 mb-4 sm:mb-6 disabled:hover:scale-100 disabled:hover:shadow-lg`}
                      >
                        {isCurrentPlan ? (
                          plan.name === "Free" ? "Current Plan" : "Current Plan"
                        ) : (
                          plan.cta
                        )}
                      </button>
                    </div>

                    <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-base text-center sm:text-left">
                        What's included:
                      </h4>
                      <ul className="space-y-2 sm:space-y-3 flex flex-col items-center sm:items-start pl-[25%] sm:pl-0">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-start w-full max-w-xs sm:max-w-none"
                          >
                            <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-left">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Limitations */}
                      {plan.limitations.length > 0 && (
                        <div className="mt-4 sm:mt-6">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-2 sm:mb-3 text-center sm:text-left">
                            Limitations:
                          </h4>
                          <ul className="space-y-2 flex flex-col items-center sm:items-start pl-[25%] sm:pl-0">
                            {plan.limitations.map((limitation, limitIndex) => (
                              <li
                                key={limitIndex}
                                className="flex items-start w-full max-w-xs sm:max-w-none"
                              >
                                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5 mr-3" />
                                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-left">
                                  {limitation}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Savings Banner for Yearly */}
          {billingCycle === "yearly" && (
            <div className="mt-8 sm:mt-12 text-center">
              <div className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 sm:px-6 sm:py-3 rounded-full">
                <HeartIcon className="w-5 h-5 mr-2" />
                <span className="text-sm sm:text-base font-medium">
                  Save up to 20% with yearly billing!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 sm:py-16 md:py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Groupify?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              All plans include our core features designed to make photo
              organization effortless
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`text-center p-6 sm:p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 ${
                  isLoaded
                    ? `opacity-100 translate-y-0 delay-${index * 100}`
                    : "opacity-0 translate-y-8"
                }`}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-4 sm:p-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white pr-8">
                      {faq.question}
                    </h3>
                    {openFaq === index ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openFaq === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <BoltIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4 sm:mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Organize Your Memories?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
            Join thousands of users who trust Groupify to keep their precious
            memories organized and accessible. Start free today!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center bg-white text-indigo-600 px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {currentUser ? "Go to Dashboard" : "Start Free Trial"}
              <ArrowRightIcon className="ml-2 w-5 h-5" />
            </button>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold border border-white/30 hover:bg-white/30 transition-all duration-200"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Free Plan Confirmation Modal */}
      {showFreeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative animate-in fade-in zoom-in duration-300">
            {/* Close Button */}
            <button
              onClick={() => setShowFreeModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L4.054 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Wait! Before you go with Free...
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Our Pro plan gives you 20x more storage, advanced AI
                recognition, and unlimited sharing.
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {" "}
                  Plus, you get a 14-day free trial!
                </span>
              </p>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    $9.99/month
                  </span>
                  <span className="ml-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm font-medium">
                    14-day trial
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cancel anytime during trial
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowFreeModal(false);
                    handlePlanSelect(
                      pricingPlans.find((p) => p.name === "Pro")
                    );
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Pro Trial (Free for 14 days)
                </button>

                <button
                  onClick={() => {
                    setShowFreeModal(false);
                    navigate("/signup?from=pricing-free");
                  }}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Continue with Free Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Plan Confirmation Modal */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 relative animate-in fade-in zoom-in duration-300">
            {/* Close Button */}
            <button
              onClick={() => setShowEnterpriseModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h-2m8 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0v-6"
                  />
                </svg>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Transform Your Organization's Photo Management
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Join leading companies using Groupify Enterprise for team
                events, corporate retreats, and organizational memories.
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {" "}
                  Get custom pricing and dedicated support.
                </span>
              </p>

              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-emerald-600 mr-2"
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
                    <span>Unlimited Storage</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-emerald-600 mr-2"
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
                    <span>Custom Integrations</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-emerald-600 mr-2"
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
                    <span>Dedicated Manager</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-emerald-600 mr-2"
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
                    <span>24/7 Priority Support</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  💼 Perfect for: Corporate Events • Team Building • Company
                  Retreats • Product Launches
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowEnterpriseModal(false);
                    navigate("/contact?from=pricing-enterprise");
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Custom Enterprise Quote
                </button>

                <button
                  onClick={() => setShowEnterpriseModal(false)}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};

export default PricingPage;