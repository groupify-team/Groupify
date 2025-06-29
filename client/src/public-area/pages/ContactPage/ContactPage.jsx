import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/ui/HeroSection";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";

import {
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
import { functions } from "../../../shared/services/firebase/config";

// Extract components for better organization
const ContactMethods = ({ contactInfo }) => (
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
);

const ContactForm = ({ formData, setFormData, handleSubmit, loading, categories }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
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
  );
};

const ContactInfo = () => (
  <div className="space-y-6 sm:space-y-8">
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 md:p-8 text-center sm:text-left">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
        Get in touch
      </h3>

      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start text-center sm:text-left">
          <MapPinIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1 mx-auto sm:mx-0 sm:mr-3" />
          <div className="mt-2 sm:mt-0 sm:ml-0">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base mb-3 sm:mb-2">
              Office Locations
            </h4>
            <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              <div className="grid grid-cols-2 sm:block gap-4 sm:gap-0 sm:space-y-0">
                <div className="text-center sm:text-left sm:mb-2">
                  <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                    San Francisco Office:
                  </p>
                  <p className="leading-relaxed">
                    123 Innovation Drive
                    <br />
                    San Francisco, CA 94105
                    <br />
                    United States
                  </p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                    Tel Aviv Office:
                  </p>
                  <p className="leading-relaxed">
                    HaArba'a Street 28
                    <br />
                    Tel Aviv-Yafo, 6473925
                    <br />
                    Israel
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start text-center sm:text-left">
          <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1 mx-auto sm:mx-0 sm:mr-3" />
          <div className="mt-2 sm:mt-0 sm:ml-0">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base mb-3 sm:mb-2">
              Business Hours
            </h4>
            <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed text-center sm:text-left">
              <p>
                Monday - Friday:
                <br />
                9:00 AM - 6:00 PM PST
              </p>
              <p className="mt-1">
                Saturday:
                <br />
                10:00 AM - 4:00 PM PST
              </p>
              <p className="mt-1">Sunday: Closed</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start text-center sm:text-left">
          <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1 mx-auto sm:mx-0 sm:mr-3" />
          <div className="mt-2 sm:mt-0 sm:ml-0">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base mb-3 sm:mb-2">
              Response Time
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed text-center sm:text-left">
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
);

const ContactFormSection = ({ formData, setFormData, handleSubmit, loading, categories }) => (
  <div className="py-12 sm:py-16">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
        {/* Form */}
        <ContactForm 
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          loading={loading}
          categories={categories}
        />

        {/* Contact Info */}
        <ContactInfo />
      </div>
    </div>
  </div>
);

const SuccessPage = ({ setSubmitted }) => (
  <PublicLayout
    headerType="simple"
    footerType="simple"
    footerProps={{ customText: "© 2025 Groupify. We're here to help." }}
  >
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4">
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
  </PublicLayout>
);

const ContactUs = () => {
  const { handleGetStarted } = usePublicNavigation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

      if (error.code === "functions/internal") {
        toast.error("Server error. Please try again later.");
      } else if (error.code === "functions/invalid-argument") {
        toast.error("Please check your input and try again.");
      } else if (error.code === "functions/unauthenticated") {
        toast.error("Authentication required. Please refresh the page.");
      } else {
        toast.error(
          error.message || "Failed to send message. Please try again."
        );
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

  // Show success page if submitted
  if (submitted) {
    return <SuccessPage setSubmitted={setSubmitted} />;
  }

  return (
    <PublicLayout
      headerType="public"
      footerType="extended"
      footerProps={{ customText: "© 2025 Groupify. We're here to help." }}
    >
      {/* Hero Section */}
      <HeroSection
        badge={{ icon: ChatBubbleLeftRightIcon, text: "Get In Touch" }}
        title="Contact Us"
        description="Have questions or feedback? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
        variant="contact"
      />

      {/* Contact Methods */}
      <ContactMethods contactInfo={contactInfo} />

      {/* Contact Form Section */}
      <ContactFormSection 
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        loading={loading}
        categories={categories}
      />
    </PublicLayout>
  );
};

export default ContactUs;