import React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, CameraIcon } from "@heroicons/react/24/outline";
import { useGlobalAccessibility } from "@shared/components/accessibility/hooks/useGlobalAccessibility";
import AccessibilityButton from "@shared/components/accessibility/AccessibilityButton";
import AccessibilityModal from "@shared/components/accessibility/AccessibilityModal";

const AuthHeader = ({
  title,
  subtitle,
  showBackButton = true,
  backTo = "/",
  backText = "Back to Home",
  className = "",
}) => {
  const { accessibilityButtonProps, accessibilityModalProps } =
    useGlobalAccessibility();

  return (
    <>
      <div className={`mb-4 sm:mb-6 md:mb-8 ${className}`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 pt-2 sm:pt-3 md:pt-4">
          {showBackButton ? (
            <Link
              to={backTo}
              className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">{backText}</span>
            </Link>
          ) : (
            <div></div>
          )}

          <AccessibilityButton
            {...accessibilityButtonProps}
            size="default"
            variant="default"
          />
        </div>

        <div className="flex items-center justify-center md:justify-start mb-4 sm:mb-6 md:mb-8">
          <div className="w-8 h-8 [@media(min-width:375px)]:w-9 [@media(min-width:375px)]:h-9 sm:w-10 sm:h-10 md:w-9 md:h-9 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <CameraIcon className="w-5 h-5 [@media(min-width:375px)]:w-6 [@media(min-width:375px)]:h-6 sm:w-8 sm:h-8 md:w-6 md:h-6 text-white" />
          </div>
          <span className="ml-2 text-xl [@media(min-width:375px)]:text-2xl sm:text-3xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Groupify
          </span>
        </div>

        {title && (
          <div className="text-center md:text-left mb-3 sm:mb-4 md:mb-6">
            <h2 className="text-lg [@media(min-width:375px)]:text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 sm:mt-2 text-xs [@media(min-width:375px)]:text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {createPortal(
        <AccessibilityModal {...accessibilityModalProps} />,
        document.body
      )}
    </>
  );
};

export default AuthHeader;
