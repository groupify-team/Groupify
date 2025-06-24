import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  CameraIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  SparklesIcon,
  UserGroupIcon,
  ShareIcon,
  ShieldCheckIcon,
  CogIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

const HelpCenter = () => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const helpCategories = [
    {
      icon: BookOpenIcon,
      title: "Getting Started",
      description: "Learn the basics of using Groupify",
      articles: [
        "How to create your first trip",
        "Uploading your first photos",
        "Setting up your profile",
        "Understanding the dashboard",
      ],
    },
    {
      icon: SparklesIcon,
      title: "AI Face Recognition",
      description: "Everything about finding yourself in photos",
      articles: [
        "How face recognition works",
        "Training the AI with your photos",
        "Improving recognition accuracy",
        "Privacy and face data",
      ],
    },
    {
      icon: UserGroupIcon,
      title: "Sharing & Collaboration",
      description: "Share trips and photos with friends",
      articles: [
        "Inviting friends to trips",
        "Setting sharing permissions",
        "Managing trip collaborators",
        "Downloading shared photos",
      ],
    },
    {
      icon: CogIcon,
      title: "Account Settings",
      description: "Manage your account and preferences",
      articles: [
        "Changing your password",
        "Updating profile information",
        "Managing privacy settings",
        "Deleting your account",
      ],
    },
    {
      icon: ShieldCheckIcon,
      title: "Privacy & Security",
      description: "Keep your photos safe and secure",
      articles: [
        "How we protect your photos",
        "Understanding privacy controls",
        "Two-factor authentication",
        "Data export and deletion",
      ],
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Troubleshooting",
      description: "Solutions to common problems",
      articles: [
        "Photos not uploading",
        "Face recognition not working",
        "Sharing issues",
        "Performance problems",
      ],
    },
  ];

  const faqs = [
    {
      question: "How does the AI face recognition work?",
      answer:
        "Our AI analyzes facial features in your photos to identify and group images of the same person. It uses advanced machine learning algorithms to recognize faces even in different lighting conditions, angles, and expressions. The more photos you upload, the more accurate it becomes.",
    },
    {
      question: "Is my data safe and private?",
      answer:
        "Absolutely! We use enterprise-grade encryption to protect your photos and data. Your photos are stored securely in the cloud with multiple backups. We never share your personal photos with third parties, and you maintain full control over who can see your trips and photos.",
    },
    {
      question: "Can I use Groupify offline?",
      answer:
        "While you need an internet connection to upload and sync photos, you can view previously downloaded photos offline. We're working on enhanced offline capabilities for future updates.",
    },
    {
      question: "How many photos can I upload?",
      answer:
        "Free accounts get 5GB of storage (approximately 2,500 photos). Premium accounts get unlimited storage. You can upgrade anytime from your account settings.",
    },
    {
      question: "Can I export my photos?",
      answer:
        "Yes! You can download individual photos, entire trips, or export all your data at any time. Go to Settings > Data Export to download your photos in their original quality.",
    },
    {
      question: "What photo formats are supported?",
      answer:
        "We support all major photo formats including JPEG, PNG, HEIC, and RAW files. Videos are also supported in MP4, MOV, and AVI formats.",
    },
    {
      question: "How do I invite friends to my trip?",
      answer:
        "Open your trip, click the 'Share' button, and enter your friends' email addresses. They'll receive an invitation to view and contribute to your trip. You can set permissions for each person (view-only or full access).",
    },
    {
      question: "Can I delete photos from shared trips?",
      answer:
        "Trip owners and users with full access can delete photos. If you only have view access, you can't delete photos, but you can hide them from your personal view.",
    },
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const filteredCategories = helpCategories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.articles.some((article) =>
        article.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Navigation Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Back */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
              <div className="hidden sm:flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Groupify
                </span>
              </div>
            </div>

            {/* Right side - Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === "dark" ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <QuestionMarkCircleIcon className="w-16 h-16 text-white mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How can we help you?
          </h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Find answers to your questions, learn how to use Groupify, and get
            the most out of your photo organization experience.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, or features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-white focus:ring-opacity-50 text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Help Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => (
              <div
                key={category.title}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
                    {category.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {category.description}
                </p>
                <ul className="space-y-2">
                  {category.articles
                    .slice(0, 3)
                    .map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <a
                          href="#"
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm transition-colors"
                        >
                          {article}
                        </a>
                      </li>
                    ))}
                  {category.articles.length > 3 && (
                    <li className="text-sm text-gray-500 dark:text-gray-400">
                      +{category.articles.length - 3} more articles
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg mb-4 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-8">
                      {faq.question}
                    </h3>
                    {openFaq === index ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 text-center">
          <ChatBubbleLeftRightIcon className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Still need help?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help
            you with any questions or issues you might have.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              Contact Support
            </Link>
            <a
              href="mailto:help@groupify.com"
              className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
