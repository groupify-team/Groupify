import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/ui/HeroSection";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const TermsOfServicePage = () => {
  const { handleGetStarted, handleSignIn } = usePublicNavigation();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using Groupify, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.",
    },
    {
      title: "2. Service Description",
      content:
        "Groupify is a photo management and sharing platform that uses AI technology to help users organize and share their travel memories. Our service includes face recognition technology, cloud storage, and collaborative sharing features.",
    },
    {
      title: "3. User Accounts",
      content:
        "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.",
    },
    {
      title: "4. Photo Upload and Content",
      content:
        "By uploading photos to Groupify, you retain ownership of your content but grant us a limited license to store, display, and process your photos for the purpose of providing our services. You are responsible for ensuring you have the right to upload and share all content.",
    },
    {
      title: "5. Privacy and Data Protection",
      content:
        "We take your privacy seriously. Our use of your personal information is governed by our Privacy Policy. By using our service, you consent to the collection and use of your information as outlined in our Privacy Policy.",
    },
    {
      title: "6. AI Face Recognition",
      content:
        "Our service uses AI technology to identify faces in photos. This feature is designed to help you organize your memories. You can opt out of face recognition features at any time through your account settings.",
    },
    {
      title: "7. Prohibited Uses",
      content:
        "You may not use Groupify for any illegal purposes or to violate any laws. You agree not to upload content that is harmful, threatening, abusive, harassing, or otherwise objectionable. Commercial use without permission is prohibited.",
    },
    {
      title: "8. Termination",
      content:
        "We may terminate or suspend your account and access to the service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or the service.",
    },
    {
      title: "9. Limitation of Liability",
      content:
        "Groupify shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. Our total liability shall not exceed the amount you paid for the service in the past 12 months.",
    },
    {
      title: "10. Changes to Terms",
      content:
        "We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Your continued use of the service after changes constitutes acceptance of the new terms.",
    },
  ];

  return (
    <PublicLayout 
      headerType="public"
      footerType="simple"
    >
      {/* Hero Section */}
      <HeroSection
        variant="legal"
        badge={{ 
          icon: DocumentTextIcon, 
          text: "Legal Document" 
        }}
        title="Terms of Service"
        description="Please read these terms carefully before using Groupify. By using our service, you agree to these terms and conditions."
        additionalContent={
          <div className="text-xs sm:text-sm text-indigo-200">
            Last updated: January 2025
          </div>
        }
        className="bg-gradient-to-r from-indigo-600 to-purple-600"
      />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Important Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 sm:p-6 mb-8 sm:mb-12">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="ml-2 sm:ml-3">
              <h3 className="text-base sm:text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Important Notice
              </h3>
              <p className="text-sm sm:text-base text-yellow-700 dark:text-yellow-300">
                These terms constitute a legal agreement between you and
                Groupify. Please read them carefully and contact us if you have
                any questions before using our service.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6 sm:space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 md:p-8 hover:shadow-lg transition-all duration-300"
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {section.title}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 p-4 sm:p-6 md:p-8">
          <div className="flex items-start flex-col text-center sm:flex-row sm:text-left">
            <ShieldCheckIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1 mx-auto sm:mx-0 mb-3 sm:mb-0" />
            <div className="sm:ml-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                Questions About These Terms?
              </h3>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                If you have any questions about these Terms of Service, please
                don't hesitate to contact us. We're here to help clarify any
                concerns you may have.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Contact Us
                </Link>
                <Link
                  to="/privacy-policy"
                  className="inline-flex items-center justify-center bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium border border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Confirmation */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 md:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Ready to Join Groupify?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              By creating an account, you agree to these terms and our Privacy
              Policy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                Create Account
              </button>
              <button
                onClick={handleSignIn}
                className="inline-flex items-center justify-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TermsOfServicePage;