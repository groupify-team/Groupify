// Generic Modal Component with Smooth Transitions
import React, { useEffect, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Z_INDEX } from "@/shared/constants/ui";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
  backdropClassName = "",
  contentClassName = "",
  zIndex = Z_INDEX.modal,
}) => {
  const modalRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure smooth entrance
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for exit animation before unmounting
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  // Size variants
  const sizeClasses = {
    small: "max-w-md",
    medium: "max-w-2xl",
    large: "max-w-4xl",
    xlarge: "max-w-6xl",
    fullscreen: "max-w-none m-0 h-full w-full",
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 
        transition-all duration-300 ease-smooth transform-gpu
        ${isAnimating ? "opacity-100" : "opacity-0"}
        ${backdropClassName}
      `}
      style={{ zIndex }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full
          transition-all duration-400 ease-spring transform-gpu
          ${sizeClasses[size]}
          ${contentClassName}
          ${className}
          ${
            isAnimating
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
