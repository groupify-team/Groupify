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
  animationType = "slide-scale", // "slide-scale", "fade", "scale"
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
      setTimeout(() => setShouldRender(false), 400);
    }
  }, [isOpen]);

  // Size variants using design system classes
  const sizeClasses = {
    small: "modal-sm",
    medium: "modal-md",
    large: "modal-lg",
    xlarge: "modal-xl",
    fullscreen: "modal-full",
  };

  // Animation variants
  const getAnimationClasses = () => {
    if (!isAnimating) {
      return "opacity-0 scale-95 translate-y-4";
    }

    switch (animationType) {
      case "slide-scale":
        return "animate-slide-in-scale";
      case "fade":
        return "animate-fade-in";
      case "scale":
        return "animate-scale-in";
      default:
        return "animate-modal-enter";
    }
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
        modal-backdrop modal-backdrop-clickable
        ${isAnimating ? "animate-modal-backdrop-enter" : "opacity-0"}
        ${backdropClassName}
      `}
      style={{ zIndex }}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`
          modal-content modal-content-protected
          ${sizeClasses[size]}
          ${getAnimationClasses()}
          ${contentClassName}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="modal-close"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
