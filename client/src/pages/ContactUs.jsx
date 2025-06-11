import React, { useState } from "react";
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

      // TODO: Implement contact form submission
      // await submitContactForm(formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again.");
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
      contact: "hello@groupify.com",
      action: "mailto:hello@groupify.com",
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available 9 AM - 6 PM PST",
      action: "#",
    },
    {
      icon: PhoneIcon,
      title: "Call Us",
      description: "Speak directly with our team",
      contact: "+1 (555) 123-4567",
      action: "tel:+15551234567",
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
        {/* Navigation Header */}
        <nav className="relative z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
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
          <div className="max-w-md w-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Message Sent Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for reaching out! We've received your message and will
              get back to you within 24 hours.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setSubmitted(false)}
                className="w-full text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
              >
                Send Another Message
              </button>
              <Link
                to="/"
                className="block w-full btn-primary text-center py-3"
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
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Groupify
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Home
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-6">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-white mr-2" />
            <span className="text-white font-medium">Get In Touch</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-indigo-100 mb-8 leading-relaxed max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you. Send us a
            message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="py-16 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {info.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {info.description}
                </p>
                <a
                  href={info.action}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                >
                  {info.contact}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Send us a message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                      className="input-primary pl-12"
                      placeholder="John Doe"
                      disabled={loading}
                    />
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                      className="input-primary pl-12"
                      placeholder="you@example.com"
                      disabled={loading}
                    />
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
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
                  className="w-full btn-primary flex items-center justify-center py-3 relative overflow-hidden"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending message...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Get in touch
                </h3>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <MapPinIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Office Location
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        123 Innovation Drive
                        <br />
                        San Francisco, CA 94105
                        <br />
                        United States
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <ClockIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Business Hours
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Monday - Friday: 9:00 AM - 6:00 PM PST
                        <br />
                        Saturday: 10:00 AM - 4:00 PM PST
                        <br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Response Time
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        We typically respond to all inquiries within 24 hours
                        during business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 p-6">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                  Need immediate help?
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Check out our help center for quick answers to common
                  questions.
                </p>
                <Link
                  to="/help"
                  className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                >
                  Visit Help Center →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 Groupify. We're here to help.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;
