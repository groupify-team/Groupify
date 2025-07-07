import React, { useState, useEffect } from "react";
import {
  SparklesIcon,
  UserGroupIcon,
  CloudIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  FaceSmileIcon,
  ShareIcon,
  LockClosedIcon,
  ClockIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PrinterIcon,
  PlayIcon,
  FolderIcon,
  TagIcon,
  HeartIcon,
  StarIcon,
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  PencilIcon,
  CameraIcon,
  UsersIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

// Import required components and hooks
// Note: These imports should be adjusted based on your actual file structure
// import { usePublicNavigation } from "../hooks/usePublicNavigation";
// import PublicLayout from "../components/layout/PublicLayout";
// import AccessibilityModal from "../components/modals/AccessibilityModal";

// Extract components for better organization
const StatsSection = ({ stats, isLoaded }) => (
  <div className="py-12 sm:py-16 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`text-center p-4 sm:p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 ${
              isLoaded
                ? `opacity-100 translate-y-0 delay-${index * 100}`
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              {stat.number}
            </div>
            <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CategoryFilter = ({
  featureCategories,
  activeCategory,
  setActiveCategory,
}) => (
  <div className="text-center mb-8 sm:mb-12">
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
      Explore Our Features
    </h2>
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
      {featureCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => setActiveCategory(category.id)}
          className={`inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeCategory === category.id
              ? "bg-indigo-600 text-white shadow-lg"
              : "bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700"
          }`}
        >
          <category.icon className="w-4 h-4 mr-1 sm:mr-2" />
          {category.name}
        </button>
      ))}
    </div>
  </div>
);

const FeatureCard = ({ feature, index, isLoaded }) => (
  <div
    className={`group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
      isLoaded
        ? `opacity-100 translate-y-0 delay-${index * 50}`
        : "opacity-0 translate-y-8"
    }`}
  >
    {/* Premium/Coming Soon Badges */}
    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
      {feature.comingSoon && (
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium inline-block w-auto">
          Coming Soon
        </span>
      )}
      {feature.premium && (
        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-medium inline-block w-auto">
          Premium+
        </span>
      )}
    </div>

    <div className="p-6 sm:p-8">
      {/* Feature Icon */}
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
        <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
      </div>

      {/* Feature Content */}
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-center sm:text-left">
        {feature.title}
      </h3>

      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 leading-relaxed text-center sm:text-left">
        {feature.description}
      </p>

      {/* Feature Details */}
      <div className="flex justify-center sm:justify-start">
        <ul className="space-y-2 sm:space-y-3 inline-block">
          {feature.details.map((detail, detailIndex) => (
            <li key={detailIndex} className="flex items-start">
              <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5 mr-3" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {detail}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const FeaturesGrid = ({ filteredFeatures, isLoaded }) => {
  if (filteredFeatures.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <PhotoIcon className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          No features found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try selecting a different category to explore more features.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {filteredFeatures.map((feature, index) => (
        <FeatureCard
          key={`${feature.category}-${index}`}
          feature={feature}
          index={index}
          isLoaded={isLoaded}
        />
      ))}
    </div>
  );
};

const FeaturesSection = ({
  featureCategories,
  activeCategory,
  setActiveCategory,
  filteredFeatures,
  isLoaded,
}) => (
  <div className="py-12 sm:py-16 md:py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Category Filter */}
      <CategoryFilter
        featureCategories={featureCategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* Features Grid */}
      <FeaturesGrid filteredFeatures={filteredFeatures} isLoaded={isLoaded} />
    </div>
  </div>
);

const ComingSoonSection = ({ comingSoonFeatures }) => (
  <div className="py-12 sm:py-16 md:py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          What's Coming Next
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          We're constantly innovating to bring you the best photo organization
          experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {comingSoonFeatures.slice(0, 3).map((feature, index) => (
          <div
            key={index}
            className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 p-6 sm:p-8 text-center"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium">
                Coming Soon
              </span>
            </div>

            <feature.icon className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CallToActionSection = ({ handleGetStarted }) => (
  <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
    <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
      <StarIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4 sm:mb-6" />
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
        Ready to Experience These Features?
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
        Join thousands of users who are already organizing their photos smarter
        with Groupify's powerful features.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center justify-center bg-white text-indigo-600 px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
        >
          Start Free Trial
          <ArrowRightIcon className="ml-2 w-5 h-5" />
        </button>
        <a
          href="/pricing"
          className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold border border-white/30 hover:bg-white/30 transition-all duration-200"
        >
          View Pricing
        </a>
      </div>
    </div>
  </div>
);

const Features = () => {
  // Uncomment and adjust these lines based on your actual hook implementation
  // const {
  //   handleGetStarted: navHandleGetStarted,
  //   handleSmoothNavigation,
  //   headerProps,
  //   accessibilityModalProps,
  // } = usePublicNavigation();

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  // Single handleGetStarted function
  const handleGetStarted = () => {
    // Navigate to sign up or dashboard
    window.location.href = "/sign-up";
  };

  // Scroll to top on component mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const featureCategories = [
    { id: "all", name: "All Features", icon: SparklesIcon },
    { id: "ai", name: "AI & Recognition", icon: FaceSmileIcon },
    { id: "sharing", name: "Sharing & Collaboration", icon: UserGroupIcon },
    { id: "organization", name: "Organization", icon: FolderIcon },
    { id: "security", name: "Security & Privacy", icon: ShieldCheckIcon },
    { id: "platform", name: "Platform & Storage", icon: CloudIcon },
  ];

  // CORRECTED features based on actual implementation
  const allFeatures = [
    // AI & RECOGNITION FEATURES (Actually Implemented)
    {
      category: "ai",
      title: "Face-API.js Recognition",
      description:
        "Advanced face recognition powered by face-api.js library with 90%+ accuracy in optimal conditions using 128D face embeddings.",
      icon: FaceSmileIcon,
      details: [
        "90%+ accuracy with proper lighting",
        "Uses 128D face embeddings for precision",
        "Real-time quality assessment",
        "Confidence scoring for matches",
        "Smart Face Scan guided capture",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "ai", 
      title: "Smart Face Profile Creation",
      description:
        "Create face profiles using guided Smart Face Scan or upload 2-5 photos for optimal AI training.",
      icon: CameraIcon,
      details: [
        "Guided camera capture with real-time feedback",
        "Photo upload method with quality assessment",
        "Requires 2-5 high-quality photos minimum",
        "Automatic face quality validation",
        "Profile optimization recommendations",
      ],
      premium: false,
      comingSoon: false,
    },

    // SHARING & COLLABORATION (Actually Implemented)
    {
      category: "sharing",
      title: "Trip Collaboration",
      description:
        "Create shared trip albums where friends can contribute photos based on your plan limits.",
      icon: UserGroupIcon,
      details: [
        "Free: Up to 5 members per trip",
        "Premium: Up to 20 members per trip", 
        "Pro: Unlimited members per trip",
        "Real-time photo contributions",
        "Member permission management",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "sharing",
      title: "Friend Management",
      description:
        "Send friend requests, manage connections, and control who can find you with privacy settings.",
      icon: UsersIcon,
      details: [
        "Send and receive friend requests",
        "Search visibility controls",
        "Privacy-aware friend discovery",
        "Mutual friend connections",
        "Friend invitation to trips",
      ],
      premium: false,
      comingSoon: false,
    },

    // ORGANIZATION (Actually Implemented)
    {
      category: "organization",
      title: "Trip-Based Organization",
      description:
        "Organize photos by trips with automatic date sorting and metadata preservation.",
      icon: FolderIcon,
      details: [
        "Trip creation with location autocomplete",
        "Automatic photo date sorting",
        "Photo metadata preservation",
        "Trip statistics and insights",
        "Batch photo operations",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "organization",
      title: "Photo Upload & Processing",
      description:
        "Upload photos up to 10MB in JPEG, PNG, GIF formats with plan-based limits.",
      icon: PhotoIcon,
      details: [
        "10MB maximum file size",
        "JPEG, PNG, GIF format support",
        "Plan-based photo limits per trip",
        "Progressive image loading",
        "Batch upload capabilities",
      ],
      premium: false,
      comingSoon: false,
    },

    // SECURITY & PRIVACY (Actually Implemented)
    {
      category: "security",
      title: "Enterprise-Grade Security",
      description:
        "AES-256 encryption, secure storage, and comprehensive privacy controls to protect your photos.",
      icon: LockClosedIcon,
      details: [
        "AES-256 encryption at rest and in transit",
        "HTTPS/TLS for all data transfers",
        "ISO 27001 certified data centers",
        "Multiple geographic backups",
        "24/7 security monitoring",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "security",
      title: "Privacy Controls",
      description:
        "Granular privacy settings including search visibility, face recognition opt-out, and data export.",
      icon: EyeIcon,
      details: [
        "Search visibility on/off controls",
        "Face recognition enable/disable",
        "Individual photo privacy settings",
        "Complete data export options",
        "Account deletion with data removal",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "security",
      title: "Data Export & Control",
      description:
        "Export your data in multiple formats including complete JSON export and CSV options.",
      icon: DocumentArrowDownIcon,
      details: [
        "Complete data export (JSON format)",
        "Trip data export (CSV)",
        "Photo metadata export (CSV)",
        "Friends data export (CSV)",
        "Original quality photo downloads",
      ],
      premium: false,
      comingSoon: false,
    },

    // PLATFORM & STORAGE (Actually Implemented)
    {
      category: "platform",
      title: "Plan-Based Storage",
      description:
        "Flexible storage plans from 2GB free to 500GB Pro with automatic usage tracking.",
      icon: CloudIcon,
      details: [
        "Free: 2GB storage, 5 trips, 30 photos/trip",
        "Premium: 50GB storage, 50 trips, 200 photos/trip",
        "Pro: 500GB storage, unlimited trips/photos",
        "Real-time usage monitoring",
        "Automatic plan limit enforcement",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "platform",
      title: "Cross-Platform Access",
      description:
        "Access your photos through responsive web interface optimized for desktop and mobile.",
      icon: DevicePhoneMobileIcon,
      details: [
        "Responsive web application",
        "Mobile-optimized interface",
        "Progressive web app features",
        "Cross-device synchronization",
        "Browser-based access",
      ],
      premium: false,
      comingSoon: false,
    },

    // COMING SOON FEATURES
    {
      category: "ai",
      title: "Advanced Object Detection",
      description:
        "AI-powered object and scene recognition to automatically tag and organize your photos.",
      icon: MagnifyingGlassIcon,
      details: [
        "Automatic object detection",
        "Scene and activity recognition",
        "Location-based tagging",
        "Smart photo categorization",
      ],
      premium: true,
      comingSoon: true,
    },
    {
      category: "platform",
      title: "Native Mobile Apps",
      description:
        "Dedicated iOS and Android apps with camera integration and offline capabilities.",
      icon: DevicePhoneMobileIcon,
      details: [
        "Native iOS and Android apps",
        "Camera integration",
        "Offline photo access",
        "Push notifications",
      ],
      premium: false,
      comingSoon: true,
    },
    {
      category: "organization",
      title: "Advanced Search",
      description:
        "Powerful search capabilities with natural language queries and advanced filtering.",
      icon: MagnifyingGlassIcon,
      details: [
        "Natural language search",
        "Advanced metadata filtering",
        "Date range queries",
        "People and location search",
      ],
      premium: true,
      comingSoon: true,
    },
    {
      category: "sharing",
      title: "Social Media Integration",
      description:
        "Direct sharing to social media platforms with optimized formatting.",
      icon: ShareIcon,
      details: [
        "Instagram, Facebook, Twitter sharing",
        "Optimized image sizing",
        "Batch sharing capabilities",
        "Story format options",
      ],
      premium: true,
      comingSoon: true,
    },
    {
      category: "organization",
      title: "Photo Editing Tools",
      description:
        "Built-in editing tools for basic adjustments and enhancements.",
      icon: PencilIcon,
      details: [
        "Basic adjustments and filters",
        "Crop, rotate, and straighten",
        "Color correction",
        "Batch editing",
      ],
      premium: true,
      comingSoon: true,
    },
    {
      category: "ai",
      title: "Video Organization",
      description:
        "Extend AI recognition capabilities to video files with scene detection.",
      icon: PlayIcon,
      details: [
        "Video scene detection",
        "Face recognition in videos",
        "Smart highlight creation",
        "Video timeline organization",
      ],
      premium: true,
      comingSoon: true,
    },
  ];

  const filteredFeatures =
    activeCategory === "all"
      ? allFeatures
      : allFeatures.filter((feature) => feature.category === activeCategory);

  const comingSoonFeatures = allFeatures.filter((f) => f.comingSoon);

  // CORRECTED stats based on actual implementation
  const stats = [
    { number: "90%+", label: "Face Recognition Accuracy*" },
    { number: "10MB", label: "Max Photo File Size" },
    { number: "500GB", label: "Max Storage (Pro Plan)" },
    { number: "256-bit", label: "AES Encryption" },
  ];

  // Basic layout wrapper - adjust based on your actual layout structure
  const LayoutWrapper = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {children}
    </div>
  );

  return (
    <LayoutWrapper>
      {/* Uncomment and adjust based on your actual layout component */}
      {/* <PublicLayout
        headerType="public"
        headerProps={{ ...headerProps, handleSmoothNavigation }}
        footerType="extended"
        footerProps={{
          customText: "© 2025 Groupify. Powerful features, simple experience.",
          handleSmoothNavigation,
        }}
      > */}
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
              Powerful Features
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Everything You Need to Organize Your Photos
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            From AI-powered face recognition to secure sharing, discover all the features that make Groupify the smartest way to manage your memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center bg-white text-indigo-600 px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Get Started Free
              <ArrowRightIcon className="ml-2 w-5 h-5" />
            </button>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold border border-white/30 hover:bg-white/30 transition-all duration-200"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <StatsSection stats={stats} isLoaded={isLoaded} />

      {/* Features Section */}
      <FeaturesSection
        featureCategories={featureCategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        filteredFeatures={filteredFeatures}
        isLoaded={isLoaded}
      />

      {/* Coming Soon Preview */}
      <ComingSoonSection comingSoonFeatures={comingSoonFeatures} />

      {/* CTA Section */}
      <CallToActionSection handleGetStarted={handleGetStarted} />

      {/* Uncomment and adjust based on your actual modal component */}
      {/* <AccessibilityModal {...accessibilityModalProps} /> */}
      
      {/* </PublicLayout> */}
    </LayoutWrapper>
  );
};

export default Features;