import React from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  features = [],
  limitations = [],
  badge = null,
  variant = "default", // "default", "highlight", "simple", "detailed"
  className = "",
  onClick = null,
  isLoaded = true,
  delay = 0,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "highlight":
        return "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 ring-2 ring-indigo-500 lg:scale-105";
      case "simple":
        return "bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/20 dark:border-gray-700/50";
      case "detailed":
        return "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 hover:shadow-2xl";
      default:
        return "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/50";
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case "highlight":
        return "w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform";
      case "simple":
        return "w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform";
      default:
        return "w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform";
    }
  };

  const cardProps = onClick ? { 
    onClick, 
    role: "button", 
    tabIndex: 0,
    onKeyDown: (e) => e.key === 'Enter' && onClick()
  } : {};

  return (
    <div
      {...cardProps}
      className={`group rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${getVariantClasses()} ${
        onClick ? "cursor-pointer" : ""
      } ${
        isLoaded
          ? `opacity-100 translate-y-0 delay-${delay}`
          : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-center py-2">
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {badge}
          </span>
        </div>
      )}

      <div className={`p-4 sm:p-6 ${variant === "detailed" ? "md:p-8" : ""} ${badge ? "pt-12 sm:pt-14" : ""}`}>
        {/* Header */}
        <div className={`${variant === "simple" ? "text-center" : "text-center sm:text-left"} mb-4 sm:mb-6`}>
          {/* Icon */}
          {Icon && (
            <div className={`${getIconClasses()} mb-3 sm:mb-4 ${variant === "simple" ? "mx-auto" : "mx-auto sm:mx-0"}`}>
              <Icon className={`${variant === "simple" ? "w-4 h-4 sm:w-5 sm:h-5" : "w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8"} text-white`} />
            </div>
          )}

          {/* Title */}
          <h3 className={`font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
            variant === "simple" ? "text-base sm:text-lg" : "text-lg sm:text-xl"
          }`}>
            {title}
          </h3>

          {/* Description */}
          <p className={`text-gray-600 dark:text-gray-400 leading-relaxed ${
            variant === "simple" ? "text-xs sm:text-sm" : "text-sm sm:text-base"
          }`}>
            {description}
          </p>
        </div>

        {/* Features List */}
        {features.length > 0 && (
          <div className={`mb-4 sm:mb-6 ${variant === "detailed" ? "" : "flex justify-center sm:justify-start"}`}>
            <ul className={`space-y-2 sm:space-y-3 ${variant === "detailed" ? "" : "inline-block"}`}>
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
                  <span className={`text-gray-600 dark:text-gray-400 text-left ${
                    variant === "simple" ? "text-xs sm:text-sm" : "text-xs sm:text-sm"
                  }`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Limitations */}
        {limitations.length > 0 && variant === "detailed" && (
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
      </div>
    </div>
  );
};

// Feature Grid Component for multiple features
export const FeatureGrid = ({ 
  features, 
  columns = "auto", // "auto", 1, 2, 3, 4
  variant = "default",
  className = "",
  isLoaded = true 
}) => {
  const getGridClasses = () => {
    if (columns === "auto") {
      return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8";
    }
    return `grid grid-cols-1 ${columns >= 2 ? "sm:grid-cols-2" : ""} ${columns >= 3 ? "lg:grid-cols-3" : ""} ${columns >= 4 ? "xl:grid-cols-4" : ""} gap-4 sm:gap-6 md:gap-8`;
  };

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {features.map((feature, index) => (
        <FeatureCard
          key={feature.id || index}
          {...feature}
          variant={variant}
          isLoaded={isLoaded}
          delay={index * 100}
        />
      ))}
    </div>
  );
};

export default FeatureCard;