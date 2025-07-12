import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CameraIcon } from "@heroicons/react/24/outline";

const PublicFooter = ({
  variant = "default",
  customText = null,
  className = "",
}) => {
  const navigate = useNavigate();
  const handleSimpleScroll = (to) => {
    if (window.navigationInProgress || window.footerNavigationInProgress) {
      console.log("Navigation already in progress, skipping");
      return;
    }
    window.footerNavigationInProgress = true;
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    setTimeout(() => {
      navigate(to);
      window.footerNavigationInProgress = false;
    }, 200);
  };

  const handleAuthWithAnimation = (to) => {
    if (window.navigationInProgress) {
      return;
    }
    window.navigationInProgress = true;
    const overlay = document.createElement("div");
    overlay.className = "enhanced-loading-overlay";
    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${
        isDarkMode ? "rgba(17, 24, 39, 0.95)" : "rgba(255, 255, 255, 0.95)"
      };
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transform: scale(0.98);
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    overlay.innerHTML = `
      <div class="flex flex-col items-center space-y-6">
        <!-- Enhanced Groupify Logo Spinner with Dark Mode -->
        <div class="relative">
          <!-- Rotating ring around logo -->
          <div class="absolute inset-0 w-16 h-16 border-4 border-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 rounded-2xl animate-spin opacity-60" 
               style="mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite: xor; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; animation-duration: 2s;"></div>
          
          <!-- Logo container with pulse effect -->
          <div class="relative w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
            <!-- Camera Icon -->
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            
            <!-- Glow effect -->
            <div class="absolute inset-0 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
          </div>
        </div>
        
        <div class="text-center">
          <p class="${
            isDarkMode ? "text-gray-300" : "text-gray-700"
          } font-medium mb-2">Loading...</p>
          <div class="w-32 h-1 ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          } rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full loading-shimmer"></div>
          </div>
        </div>
      </div>
    `;

    // Add shimmer animation styles
    const style = document.createElement("style");
    style.textContent = `
      @keyframes loading-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
      .loading-shimmer {
        animation: loading-shimmer 2s infinite;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Animate overlay entrance
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.opacity = "1";
        overlay.style.transform = "scale(1)";
      });
    });

    setTimeout(() => {
      navigate(to);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (overlay && overlay.parentNode) {
          overlay.style.opacity = "0";
          overlay.style.transform = "scale(0.98)";
          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
            if (style.parentNode) {
              style.parentNode.removeChild(style);
            }
            window.navigationInProgress = false;
          }, 400);
        } else {
          window.navigationInProgress = false;
        }
      }, 150);
    }, 400);
  };

  const handleLinkClick = (e, to) => {
    e.preventDefault();
    e.stopPropagation();
    const isAuthPage = to === "/signin" || to === "/signup";
    console.log("Is auth page?", isAuthPage);
    if (isAuthPage) {
      handleAuthWithAnimation(to);
    } else {
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
                title="Email us"
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
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Follow us on Facebook"
              >
                <span className="sr-only">Facebook</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="Follow us on Twitter"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-700 dark:hover:text-blue-500 transition-colors"
                title="Connect with us on LinkedIn"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                title="Follow us on Instagram"
              >
                <span className="sr-only">Instagram</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
