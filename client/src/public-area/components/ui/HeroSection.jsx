import React from "react";
import { Link } from "react-router-dom";

const HeroSection = ({
  badge = null,
  title,
  subtitle = null,
  description,
  primaryCTA = null,
  secondaryCTA = null,
  additionalContent = null,
  variant = "default", // "default", "gradient", "simple"
  className = "",
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "gradient":
        return "bg-gradient-to-r from-indigo-600 to-purple-600";
      case "simple":
        return "bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm";
      default:
        return "bg-gradient-to-r from-indigo-600 to-purple-600";
    }
  };

  const getTextClasses = () => {
    switch (variant) {
      case "simple":
        return {
          badge: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
          title: "text-gray-900 dark:text-white",
          description: "text-gray-600 dark:text-gray-300",
        };
      default:
        return {
          badge: "bg-white/20 backdrop-blur-sm text-white border-white/30",
          title: "text-white",
          description: "text-indigo-100",
        };
    }
  };

  const textClasses = getTextClasses();

  return (
    <div className={`py-12 sm:py-16 md:py-20 ${getVariantClasses()} ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        {badge && (
          <div className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border mb-4 sm:mb-6 ${textClasses.badge}`}>
            {badge.icon && <badge.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
            <span className="font-medium text-sm sm:text-base">
              {badge.text}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 ${textClasses.title}`}>
          {typeof title === "string" ? (
            title
          ) : (
            title // JSX element with custom styling
          )}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <h2 className={`text-lg sm:text-xl md:text-2xl font-semibold mb-4 ${textClasses.title}`}>
            {subtitle}
          </h2>
        )}

        {/* Description */}
        <p className={`text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto ${textClasses.description}`}>
          {description}
        </p>

        {/* Additional Content (like billing toggle, search bar, etc.) */}
        {additionalContent && (
          <div className="mb-6 sm:mb-8">
            {additionalContent}
          </div>
        )}

        {/* CTA Buttons */}
        {(primaryCTA || secondaryCTA) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 px-3 sm:px-0">
            {primaryCTA && (
              <Link
                to={primaryCTA.href}
                onClick={primaryCTA.onClick}
                className={`group inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 w-full sm:w-auto ${
                  primaryCTA.className || 
                  (variant === "simple" 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                    : "bg-white hover:bg-gray-50 text-indigo-600")
                }`}
              >
                {primaryCTA.text}
                {primaryCTA.icon && (
                  <primaryCTA.icon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </Link>
            )}
            
            {secondaryCTA && (
              <Link
                to={secondaryCTA.href}
                onClick={secondaryCTA.onClick}
                className={`inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 w-full sm:w-auto ${
                  secondaryCTA.className || 
                  (variant === "simple" 
                    ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700" 
                    : "bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30")
                }`}
              >
                {secondaryCTA.text}
                {secondaryCTA.icon && (
                  <secondaryCTA.icon className="ml-2 w-5 h-5" />
                )}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSection;