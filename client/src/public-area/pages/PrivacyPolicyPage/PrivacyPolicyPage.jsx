import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/ui/HeroSection";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";

import {
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

// Extract components for better organization
const PrivacyHighlights = ({ highlights }) => (
  <div className="py-12 sm:py-16 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Our Privacy Commitments
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          These are the core principles that guide how we handle your data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {highlights.map((highlight, index) => (
          <div
            key={index}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <highlight.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {highlight.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
              {highlight.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PrivacySection = ({ section, index }) => (
  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 md:p-8 hover:shadow-lg transition-all duration-300">
    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
      {section.title}
    </h2>
    <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
      {section.content}
    </p>
  </div>
);

const PrivacySections = ({ sections }) => (
  <div className="space-y-6 sm:space-y-8">
    {sections.map((section, index) => (
      <PrivacySection key={index} section={section} index={index} />
    ))}
  </div>
);

const ContactSection = () => (
  <div className="mt-12 sm:mt-16 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-4 sm:p-6 md:p-8">
    <div className="flex items-start flex-col text-center sm:flex-row sm:text-left">
      <ShieldCheckIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1 mx-auto sm:mx-0 mb-3 sm:mb-0" />
      <div className="sm:ml-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
          Questions About Your Privacy?
        </h3>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
          We're committed to transparency. If you have any questions about
          this privacy policy or how we handle your data, please reach out
          to us.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            Contact Us
          </Link>
          <Link
            to="/terms"
            className="inline-flex items-center justify-center bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  </div>
);

const DataControlSection = ({ handleGetStarted, handleSignIn }) => (
  <div className="mt-8 sm:mt-12">
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 md:p-8 text-center">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
        Your Data, Your Control
      </h3>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-2xl mx-auto">
        You have complete control over your data. Manage your privacy
        settings, export your photos, or delete your account at any time.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
        >
          Start Using Groupify
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
);

const PrivacyPolicy = () => {
  const { handleGetStarted, handleSignIn } = usePublicNavigation();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: "1. Information We Collect",
      content:
        "We collect information you provide directly to us, such as when you create an account, upload photos, or contact us. This includes your name, email address, photos, and usage data. We also collect information automatically through your use of our services, including device information, IP addresses, and usage patterns.",
    },
    {
      title: "2. How We Use Your Information",
      content:
        "We use your information to provide, maintain, and improve our services, including organizing your photos with AI face recognition, enabling photo sharing features, and providing customer support. We may also use your information to communicate with you about updates, security alerts, and promotional content.",
    },
    {
      title: "3. Face Recognition Technology",
      content:
        "Our AI face recognition technology analyzes facial features in your photos to help organize and categorize them. This processing happens securely on our servers. You can disable face recognition features at any time in your account settings. Biometric data is encrypted and stored securely.",
    },
    {
      title: "4. Information Sharing and Disclosure",
      content:
        "We do not sell, trade, or rent your personal information to third parties. We may share your information in limited circumstances: with your consent, to comply with legal obligations, to protect our rights and safety, or with service providers who assist us in operating our platform.",
    },
    {
      title: "5. Data Security",
      content:
        "We implement robust security measures to protect your personal information, including encryption, secure servers, and regular security audits. Your photos and personal data are stored securely in the cloud with enterprise-grade protection. However, no method of transmission over the internet is 100% secure.",
    },
    {
      title: "6. Photo Storage and Sharing",
      content:
        "Your photos are stored securely in our cloud infrastructure. When you share photos or albums with others, only the people you explicitly invite can access that content. We do not access or view your photos except as necessary to provide our services or with your explicit consent.",
    },
    {
      title: "7. Cookies and Tracking",
      content:
        "We use cookies and similar tracking technologies to improve your experience, analyze usage patterns, and provide personalized features. You can control cookie settings through your browser preferences. Essential cookies are necessary for the service to function properly.",
    },
    {
      title: "8. Third-Party Services",
      content:
        "Our service may integrate with third-party platforms for authentication (like Google Sign-In) or other features. These services have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of third-party services.",
    },
    {
      title: "9. Data Retention",
      content:
        "We retain your personal information for as long as your account is active or as needed to provide services. You can delete your account at any time, and we will delete your personal information within 30 days, except where we're required to retain it for legal purposes.",
    },
    {
      title: "10. Your Rights and Choices",
      content:
        "You have the right to access, update, or delete your personal information. You can export your data, disable certain features like face recognition, and control sharing settings. If you're in the EU, you have additional rights under GDPR, including data portability and the right to be forgotten.",
    },
    {
      title: "11. Children's Privacy",
      content:
        "Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.",
    },
    {
      title: "12. Changes to This Policy",
      content:
        "We may update this privacy policy from time to time. We will notify you of significant changes via email or through our service. Your continued use of our service after changes become effective constitutes acceptance of the revised policy.",
    },
  ];

  const highlights = [
    {
      icon: LockClosedIcon,
      title: "Your Photos Are Private",
      description:
        "Only you and people you choose to share with can see your photos.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure AI Processing",
      description:
        "Face recognition happens securely on our encrypted servers.",
    },
    {
      icon: EyeIcon,
      title: "Transparent Practices",
      description:
        "We're open about how we collect, use, and protect your data.",
    },
    {
      icon: UserGroupIcon,
      title: "You're In Control",
      description: "Manage your privacy settings and data preferences anytime.",
    },
  ];

  return (
    <PublicLayout
      headerType="public"
      footerType="extended"
      footerProps={{ customText: "© 2025 Groupify. Your privacy is protected." }}
    >
      {/* Hero Section */}
      <HeroSection
        badge={{ icon: ShieldCheckIcon, text: "Privacy First" }}
        title="Privacy Policy"
        description="Your privacy matters to us. Learn how we collect, use, and protect your personal information and photos."
        variant="privacy"
        customContent={
          <div className="text-xs sm:text-sm text-blue-200">
            Last updated: January 2025
          </div>
        }
      />

      {/* Privacy Highlights */}
      <PrivacyHighlights highlights={highlights} />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Privacy Sections */}
        <PrivacySections sections={sections} />

        {/* Contact Information */}
        <ContactSection />

        {/* Data Control */}
        <DataControlSection 
          handleGetStarted={handleGetStarted}
          handleSignIn={handleSignIn}
        />
      </div>
    </PublicLayout>
  );
};

export default PrivacyPolicy;