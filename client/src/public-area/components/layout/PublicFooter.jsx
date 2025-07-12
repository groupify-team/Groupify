import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CameraIcon } from "@heroicons/react/24/outline";

const PublicFooter = ({
  variant = "default",
  customText = null,
  className = "",
  // We'll ignore these props and create our own navigation
  handleSmoothNavigation,
  handleAuthNavigation,
}) => {
  const navigate = useNavigate();

  // Create our own simple navigation functions
  const handleSimpleScroll = (to) => {
    console.log("🚀 Simple scroll navigation to:", to);

    // Prevent any existing navigation in progress
    if (window.navigationInProgress || window.footerNavigationInProgress) {
      console.log("Navigation already in progress, skipping");
      return;
    }

    window.footerNavigationInProgress = true;

    // Simply scroll to top and navigate - no animation at all
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Navigate after a very short delay
    setTimeout(() => {
      navigate(to);
      window.footerNavigationInProgress = false;
    }, 200);
  };

  const handleAuthWithAnimation = (to) => {
    console.log("🎭 Auth navigation with animation to:", to);

    // Only for sign-in/sign-up, use the original animation
    if (window.navigationInProgress) return;
    window.navigationInProgress = true;

    // Create overlay for auth pages only
    const overlay = document.createElement("div");
    overlay.className = "enhanced-loading-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    overlay.innerHTML = `
      <div class="flex flex-col items-center space-y-6">
        <div class="relative w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
        <p class="text-gray-700 font-medium">Loading...</p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Fade in overlay
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    // Navigate after overlay appears
    setTimeout(() => {
      navigate(to);

      // Clean up
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.style.opacity = "0";
          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
            window.navigationInProgress = false;
          }, 300);
        }
      }, 100);
    }, 400);
  };

  const handleLinkClick = (e, to) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("=== FOOTER LINK CLICKED ===");
    console.log("Destination:", to);

    // Check if this is an auth page
    const isAuthPage = to === "/signin" || to === "/signup";
    console.log("Is auth page?", isAuthPage);

    if (isAuthPage) {
      console.log("✅ Using AUTH navigation (with animation)");
      handleAuthWithAnimation(to);
    } else {
      console.log("✅ Using SIMPLE navigation (scroll only)");
      handleSimpleScroll(to);
    }
  };

  if (variant === "simple") {
    return (
      <footer
        className={`py-8 sm:py-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/50 ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Link
              to="/"
              onClick={(e) => handleLinkClick(e, "/")}
              className="flex items-center mb-4 md:mb-0"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </Link>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {customText || "© 2025 Groupify. Made with ❤️ for photo lovers."}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`py-16 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/50 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link
              to="/"
              onClick={(e) => handleLinkClick(e, "/")}
              className="flex items-center mb-4"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              The smartest way to organize and share your travel memories using
              AI-powered face recognition and seamless photo management.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:groupify.ltd@gmail.com"
                className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span className="sr-only">Email</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/signup"
                  onClick={(e) => handleLinkClick(e, "/signup")}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  to="/signin"
                  onClick={(e) => handleLinkClick(e, "/signin")}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  to="/features"
                  onClick={(e) => handleLinkClick(e, "/features")}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  onClick={(e) => handleLinkClick(e, "/pricing")}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  onClick={(e) => handleLinkClick(e, "/about")}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  onClick={(e) => handleLinkClick(e, "/contact")}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  onClick={(e) => handleLinkClick(e, "/blog")}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  onClick={(e) => handleLinkClick(e, "/careers")}
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap justify-center md:justify-start space-x-6 mb-4 md:mb-0">
              <Link
                to="/privacy-policy"
                onClick={(e) => handleLinkClick(e, "/privacy-policy")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                onClick={(e) => handleLinkClick(e, "/terms")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/help"
                onClick={(e) => handleLinkClick(e, "/help")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Help Center
              </Link>
              <Link
                to="/status"
                onClick={(e) => handleLinkClick(e, "/status")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Status
              </Link>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {customText || "© 2025 Groupify. Made with ❤️ for photo lovers."}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
