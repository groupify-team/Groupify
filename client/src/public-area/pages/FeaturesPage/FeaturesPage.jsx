import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/ui/HeroSection";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";
import SettingsModal from "@dashboard/features/settings/components/modals/EditProfileModal";

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
} from "@heroicons/react/24/outline";

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
          Premium
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
        <Link
          to="/pricing"
          className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold border border-white/30 hover:bg-white/30 transition-all duration-200"
        >
          View Pricing
        </Link>
      </div>
    </div>
  </div>
);

const Features = () => {
  const {
    handleGetStarted,
    headerProps, // NEW: Contains onSettingsClick
    settingsProps, // NEW: Contains all settings modal props
  } = usePublicNavigation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

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
    { id: "platform", name: "Platform & Apps", icon: DevicePhoneMobileIcon },
  ];

  const allFeatures = [
    {
      category: "ai",
      title: "Advanced AI Face Recognition",
      description:
        "Our cutting-edge AI identifies faces across thousands of photos with incredible accuracy, even in challenging lighting conditions.",
      icon: FaceSmileIcon,
      details: [
        "Recognizes faces from different angles and lighting",
        "Learns and improves with each photo uploaded",
        "Groups photos by person automatically",
        "Works with partial faces and side profiles",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "ai",
      title: "Smart Object Detection",
      description:
        "AI-powered object recognition helps you find photos containing specific items, locations, or activities.",
      icon: MagnifyingGlassIcon,
      details: [
        "Detects objects, animals, and landmarks",
        "Identifies activities and scenes",
        "Location-based photo grouping",
        "Weather and time-of-day recognition",
      ],
      premium: true,
      comingSoon: false,
    },
    {
      category: "ai",
      title: "Emotion & Mood Analysis",
      description:
        "Discover your happiest moments with AI that detects emotions and moods in your photos.",
      icon: HeartIcon,
      details: [
        "Identifies happy, sad, surprised expressions",
        "Groups photos by emotional content",
        "Creates mood-based photo collections",
        "Highlights your best memories",
      ],
      premium: true,
      comingSoon: true,
    },
    {
      category: "sharing",
      title: "Collaborative Trip Albums",
      description:
        "Create shared trip albums where everyone can contribute photos and relive memories together.",
      icon: UserGroupIcon,
      details: [
        "Invite unlimited friends and family",
        "Real-time photo contributions",
        "Collaborative editing and organizing",
        "Group chat within albums",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "sharing",
      title: "Smart Sharing Links",
      description:
        "Share photos and albums with secure, customizable links that work without requiring account creation.",
      icon: ShareIcon,
      details: [
        "Password-protected sharing",
        "Expiring links for temporary access",
        "Download permissions control",
        "View-only or full access options",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "sharing",
      title: "Social Media Integration",
      description:
        "Seamlessly share your organized photos to all major social media platforms with one click.",
      icon: GlobeAltIcon,
      details: [
        "Direct posting to Instagram, Facebook, Twitter",
        "Optimized image sizing for each platform",
        "Batch sharing capabilities",
        "Story and post format options",
      ],
      premium: true,
      comingSoon: true,
    },
    {
      category: "organization",
      title: "Intelligent Auto-Tagging",
      description:
        "Automatically tag photos based on content, location, people, and events for effortless organization.",
      icon: TagIcon,
      details: [
        "Automatic location tagging via GPS",
        "Event and occasion recognition",
        "Custom tag suggestions",
        "Batch tagging tools",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "organization",
      title: "Timeline & Memory Lane",
      description:
        "View your photos in beautiful timeline layouts and get reminded of memories from past years.",
      icon: ClockIcon,
      details: [
        "Chronological photo timeline",
        "Memory notifications and reminders",
        "Year-in-review compilations",
        "Anniversary and birthday highlights",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "organization",
      title: "Advanced Search & Filters",
      description:
        "Find any photo instantly with powerful search capabilities and intelligent filtering options.",
      icon: MagnifyingGlassIcon,
      details: [
        "Search by people, objects, locations",
        "Date and time range filtering",
        "Advanced metadata search",
        "Natural language queries",
      ],
      premium: true,
      comingSoon: false,
    },
    {
      category: "organization",
      title: "Duplicate Photo Detection",
      description:
        "Automatically find and manage duplicate photos to save storage space and keep your library clean.",
      icon: DocumentTextIcon,
      details: [
        "Intelligent duplicate detection",
        "Side-by-side comparison tools",
        "Bulk deletion options",
        "Similar photo grouping",
      ],
      premium: true,
      comingSoon: false,
    },
    {
      category: "security",
      title: "End-to-End Encryption",
      description:
        "Your photos are protected with military-grade encryption both in transit and at rest.",
      icon: LockClosedIcon,
      details: [
        "AES-256 encryption standard",
        "Zero-knowledge architecture",
        "Encrypted local storage",
        "Secure backup protocols",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "security",
      title: "Private Photo Vaults",
      description:
        "Keep sensitive photos in secure, password-protected vaults with additional security layers.",
      icon: ShieldCheckIcon,
      details: [
        "Biometric authentication access",
        "Hidden from main photo library",
        "Additional password protection",
        "Secure sharing capabilities",
      ],
      premium: true,
      comingSoon: false,
    },
    {
      category: "security",
      title: "Privacy Controls",
      description:
        "Granular privacy settings give you complete control over who can see your photos and albums.",
      icon: EyeIcon,
      details: [
        "Individual photo privacy settings",
        "Album-level access controls",
        "Friend permission management",
        "Anonymous viewing options",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "platform",
      title: "Cross-Platform Sync",
      description:
        "Access your photos seamlessly across all devices with real-time synchronization.",
      icon: CloudIcon,
      details: [
        "iOS, Android, and web apps",
        "Real-time cross-device sync",
        "Offline photo access",
        "Progressive photo loading",
      ],
      premium: false,
      comingSoon: false,
    },
    {
      category: "platform",
      title: "Desktop Applications",
      description:
        "Full-featured desktop apps for Windows and Mac with advanced editing and organization tools.",
      icon: DevicePhoneMobileIcon,
      details: [
        "Native Windows and Mac apps",
        "Bulk upload and organization",
        "Advanced editing tools",
        "Local storage management",
      ],
      premium: true,
      comingSoon: true,
    },
    {
      category: "platform",
      title: "API & Integrations",
      description:
        "Connect Groupify with your favorite apps and services through our comprehensive API.",
      icon: CogIcon,
      details: [
        "RESTful API with full documentation",
        "Webhooks for real-time updates",
        "Third-party app integrations",
        "Custom workflow automation",
      ],
      premium: true,
      comingSoon: true,
    },
    {
      category: "organization",
      title: "Photo Editing Tools",
      description:
        "Built-in photo editing tools to enhance your memories without leaving the app.",
      icon: PencilIcon,
      details: [
        "Basic adjustments and filters",
        "Crop, rotate, and straighten",
        "Color correction and enhancement",
        "Batch editing capabilities",
      ],
      premium: true,
      comingSoon: false,
    },
    {
      category: "sharing",
      title: "Photo Books & Prints",
      description:
        "Create beautiful photo books and order professional prints directly from your organized albums.",
      icon: PrinterIcon,
      details: [
        "Custom photo book creation",
        "Professional print ordering",
        "Multiple format options",
        "High-quality printing partners",
      ],
      premium: true,
      comingSoon: false,
    },
    {
      category: "ai",
      title: "Video Organization",
      description:
        "AI-powered video organization with scene detection, people recognition, and smart highlights.",
      icon: PlayIcon,
      details: [
        "Automatic video scene detection",
        "Face recognition in videos",
        "Smart highlight creation",
        "Video timeline organization",
      ],
      premium: true,
      comingSoon: true,
    },
    {
      category: "organization",
      title: "Analytics & Insights",
      description:
        "Gain insights into your photo collection with detailed analytics and usage statistics.",
      icon: ChartBarIcon,
      details: [
        "Photo collection statistics",
        "Usage and engagement metrics",
        "Storage utilization reports",
        "Sharing activity insights",
      ],
      premium: true,
      comingSoon: false,
    },
  ];

  const filteredFeatures =
    activeCategory === "all"
      ? allFeatures
      : allFeatures.filter((feature) => feature.category === activeCategory);

  const comingSoonFeatures = allFeatures.filter((f) => f.comingSoon);

  const stats = [
    { number: "99.9%", label: "Face Recognition Accuracy" },
    { number: "10M+", label: "Photos Organized" },
    { number: "<0.5s", label: "Average Search Time" },
    { number: "256-bit", label: "Encryption Standard" },
  ];

  return (
    <PublicLayout
      headerType="public"
      headerProps={headerProps}
      footerType="extended"
      footerProps={{
        customText: "© 2025 Groupify. Powerful features, simple experience.",
      }}
    >
      {/* Hero Section */}
      <HeroSection
        badge={{ icon: SparklesIcon, text: "Powerful Features" }}
        title="Everything You Need to Organize Your Photos"
        description="From AI-powered face recognition to secure sharing, discover all the features that make Groupify the smartest way to manage your memories."
        primaryCTA={{
          text: "Get Started Free",
          onClick: handleGetStarted,
          icon: ArrowRightIcon,
        }}
        variant="features"
      />

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

      {/* Settings Modal*/}
      <SettingsModal {...settingsProps} />
    </PublicLayout>
  );
};

export default Features;
