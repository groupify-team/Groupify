import React from "react";
import { CheckIcon, XMarkIcon, StarIcon } from "@heroicons/react/24/outline";

const PricingCard = ({
  name,
  description,
  price,
  badge = null,
  features = [],
  limitations = [],
  cta,
  popular = false,
  billingCycle = "monthly", // "monthly", "yearly"
  savings = null, // { amount: 20.89, percentage: 17 }
  className = "",
  onClick = null,
  isLoaded = true,
  delay = 0,
}) => {
  const getCardClasses = () => {
    if (popular) {
      return "relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden ring-2 ring-indigo-500 lg:scale-105 shadow-2xl";
    }
    return "relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl";
  };

  const getBadgeClasses = () => {
    if (popular) {
      return "bg-indigo-600 text-white";
    }
    if (badge?.type === "value") {
      return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
    }
    if (badge?.type === "contact") {
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
    }
    return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
  };

  const getCtaClasses = () => {
    if (popular) {
      return "w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105";
    }
    if (cta?.variant === "secondary") {
      return "w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105";
    }
    if (cta?.variant === "outline") {
      return "w-full border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200";
    }
    return "w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105";
  };

  const cardProps = onClick ? { 
    onClick, 
    role: "button", 
    tabIndex: 0,
    onKeyDown: (e) => e.key === 'Enter' && onClick()
  } : {};

  const formatPrice = (priceValue) => {
    if (typeof priceValue === "string") {
      return priceValue;
    }
    if (typeof priceValue === "object") {
      return priceValue[billingCycle] || priceValue.monthly || priceValue;
    }
    return priceValue;
  };

  const displayPrice = formatPrice(price);

  return (
    <div
      {...cardProps}
      className={`transition-all duration-300 hover:-translate-y-2 ${getCardClasses()} ${
        onClick ? "cursor-pointer" : ""
      } ${
        isLoaded
          ? `opacity-100 translate-y-0 delay-${delay}`
          : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {/* Popular Badge */}
      {badge && (
        <div className={`absolute top-0 left-0 right-0 text-center py-2 ${getBadgeClasses()}`}>
          <span className="text-sm font-semibold">
            {badge.text || badge}
          </span>
        </div>
      )}

      <div className={`p-6 sm:p-8 ${badge ? "pt-12 sm:pt-14" : ""}`}>
        {/* Plan Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {name}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>

          {/* Pricing */}
          <div className="mb-4">
            {typeof displayPrice === "number" ? (
              <>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                    ${displayPrice}
                  </span>
                  {displayPrice > 0 && (
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  )}
                </div>
                {billingCycle === "yearly" && price?.monthly > 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ${(displayPrice / 12).toFixed(2)}/month billed annually
                  </div>
                )}
              </>
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {displayPrice}
              </div>
            )}
          </div>

          {/* Savings Banner */}
          {savings && billingCycle === "yearly" && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium mb-4">
              Save ${savings.amount} ({savings.percentage}%)
            </div>
          )}

          {/* CTA Button */}
          {cta && (
            <button
              onClick={cta.onClick}
              disabled={cta.disabled}
              className={`${getCtaClasses()} mb-4 sm:mb-6 ${cta.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {cta.loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                  {cta.loadingText || "Loading..."}
                </>
              ) : (
                cta.text
              )}
            </button>
          )}
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="space-y-3 sm:space-y-4 mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-base text-center sm:text-left">
              What's included:
            </h4>
            <ul className="space-y-2 sm:space-y-3 flex flex-col items-center sm:items-start pl-[25%] sm:pl-0">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start w-full max-w-xs sm:max-w-none">
                  <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-left">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Limitations */}
        {limitations.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-2 sm:mb-3 text-center sm:text-left">
              Limitations:
            </h4>
            <ul className="space-y-2 flex flex-col items-center sm:items-start pl-[25%] sm:pl-0">
              {limitations.map((limitation, index) => (
                <li key={index} className="flex items-start w-full max-w-xs sm:max-w-none">
                  <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5 mr-3" />
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-left">
                    {limitation}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Popular Star Rating */}
        {popular && (
          <div className="flex justify-center mt-4">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Most Popular</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Pricing Grid Component
export const PricingGrid = ({ 
  plans, 
  billingCycle = "monthly",
  className = "",
  isLoaded = true,
  onPlanSelect = null
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-${Math.min(plans.length, 4)} gap-6 sm:gap-8 ${className}`}>
      {plans.map((plan, index) => (
        <PricingCard
          key={plan.id || plan.name}
          {...plan}
          billingCycle={billingCycle}
          isLoaded={isLoaded}
          delay={index * 100}
          onClick={onPlanSelect ? () => onPlanSelect(plan) : plan.onClick}
        />
      ))}
    </div>
  );
};

export default PricingCard;