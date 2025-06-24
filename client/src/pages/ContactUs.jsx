import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  CameraIcon,
  MoonIcon,
  SunIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "../services/firebase/config";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      console.log("Attempting to send contact email with data:", formData);

      // Send email via Firebase Function
      const sendContactEmail = httpsCallable(functions, "sendContactEmail");
      const result = await sendContactEmail(formData);

      console.log("Email sent successfully:", result);

      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Contact form error details:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === "functions/internal") {
        toast.error("Server error. Please try again later.");
      } else if (error.code === "functions/unauthenticated") {
        toast.error("Authentication required. Please refresh the page.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "billing", label: "Billing Question" },
    { value: "privacy", label: "Privacy Concern" },
    { value: "partnership", label: "Partnership" },
    { value: "feedback", label: "Feedback" },
  ];

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: "Email Us",
      description: "Get in touch via email",
      contact: "groupify.ltd@gmail.com",
      action: "mailto:groupify.ltd@gmail.com",
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available 9 AM - 6 PM PST",
      action:
        "https://wa.me/972532448624?text=Hello%20Groupify%20Support%20Team",
    },
    {
      icon: PhoneIcon,
      title: "Call Us",
      description: "Speak directly with our team",
      contact: "+972 (53) 244-8624",
      action: "tel:+972532448624",
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
        {/* Navigation Header */}
        <nav className="relative z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link to="/" className="flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="ml-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Groupify
                </span>
              </Link>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

        {/* Success Message */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="max-w-sm sm:max-w-md w-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Message Sent Successfully!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              Thank you for reaching out! We've received your message and will
              get back to you within 24 hours.
            </p>

            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => setSubmitted(false)}
                className="w-full text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm sm:text-base"
              >
                Send Another Message
              </button>
              <Link
                to="/"
                className="block w-full btn-primary text-center py-2.5 sm:py-3 text-sm sm:text-base"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
      {/* Navigation Header */}
      <nav className="relative z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="ml-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Groupify
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === "dark" ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4 sm:mb-6">
            <ChatBubbleLeftRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white mr-2" />
            <span className="text-white font-medium text-sm sm:text-base">
              Get In Touch
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Contact Us
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you. Send us a
            message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="py-12 sm:py-16 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <info.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {info.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">
                  {info.description}
                </p>
                <a
                  href={info.action}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors text-sm sm:text-base"
                >
                  {info.contact}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Form */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-6 md:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
                Send us a message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
                  >
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-primary sm:pl-14"
                      placeholder="John Doe"
                      disabled={loading}
                    />
                    <UserIcon className="hidden sm:block absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-primary sm:pl-14"
                      placeholder="you@example.com"
                      disabled={loading}
                    />
                    <EnvelopeIcon className="hidden sm:block absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input-primary"
                    disabled={loading}
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
                  >
                    Subject *
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="input-primary"
                    placeholder="How can we help you?"
                    disabled={loading}
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    className="input-primary resize-none"
                    placeholder="Tell us more about your inquiry..."
                    disabled={loading}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center py-2.5 sm:py-3 text-sm sm:text-base relative overflow-hidden"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                      Sending message...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 md:p-8 text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
                  Get in touch
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start">
                    <MapPinIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    <div className="ml-2 sm:ml-3">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        Office Locations
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        <strong>San Francisco Office:</strong>
                        <br />
                        123 Innovation Drive
                        <br />
                        San Francisco, CA 94105, United States
                        <br />
                        <br />
                        <strong>Tel Aviv Office:</strong>
                        <br />
                        HaArba'a Street 28
                        <br />
                        Tel Aviv-Yafo, 6473925, Israel
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    <div className="ml-2 sm:ml-3">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        Business Hours
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        Monday - Friday: 9:00 AM - 6:00 PM PST
                        <br />
                        Saturday: 10:00 AM - 4:00 PM PST
                        <br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    <div className="ml-2 sm:ml-3">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                        Response Time
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        We typically respond to all inquiries within 24 hours
                        during business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 p-4 sm:p-6 text-center sm:text-left">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">
                  Need immediate help?
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">
                  Check out our help center for quick answers to common
                  questions.
                </p>
                <Link
                  to="/help"
                  className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors text-sm sm:text-base"
                >
                  Visit Help Center →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              © 2025 Groupify. We're here to help.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;
