import React, { useState, useEffect } from "react";
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/ui/HeroSection";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";

import {
  SparklesIcon,
  HeartIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ClockIcon,
  HomeIcon,
  ShieldCheckIcon,
  GiftIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// Extract components for better organization
const CultureSection = ({ cultureValues }) => (
  <div className="py-12 sm:py-16 md:py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Our Culture & Values
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          We're building more than just a product – we're creating a culture
          where talented people can do their best work
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {cultureValues.map((value, index) => (
          <div
            key={index}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <value.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
              {value.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
              {value.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const BenefitsSection = ({ benefits }) => (
  <div className="py-12 sm:py-16 md:py-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Why You'll Love Working Here
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          We offer competitive benefits and perks to support your professional
          growth and personal well-being
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 text-center sm:text-left"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 mx-auto sm:mx-0">
              <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
              {benefit.title}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const JobCard = ({ job, onApply }) => (
  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300 max-w-4xl lg:max-w-none w-full">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
      <div className="mb-4 lg:mb-0">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center sm:text-left">
          {job.title}
        </h3>
        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center">
            <BriefcaseIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {job.department}
          </div>
          <div className="flex items-center">
            <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {job.location}
          </div>
          <div className="flex items-center">
            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {job.type}
          </div>
          <div className="flex items-center">
            <AcademicCapIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {job.experience}
          </div>
        </div>
      </div>
      <button
        onClick={() => onApply(job)}
        className="self-center lg:self-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg text-sm sm:text-base"
      >
        Apply Now
      </button>
    </div>

    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed text-center sm:text-left">
      {job.description}
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base text-center sm:text-left">
          Requirements
        </h4>
        <ul className="space-y-1 sm:space-y-2">
          {job.requirements.map((req, index) => (
            <li
              key={index}
              className="flex items-start text-gray-600 dark:text-gray-300 text-xs sm:text-sm"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></div>
              {req}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base text-center sm:text-left">
          What We Offer
        </h4>
        <ul className="space-y-1 sm:space-y-2">
          {job.benefits.map((benefit, index) => (
            <li
              key={index}
              className="flex items-start text-gray-600 dark:text-gray-300 text-xs sm:text-sm"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></div>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

const OpenPositionsSection = ({ jobListings, onApply }) => (
  <div
    id="open-positions"
    className="py-12 sm:py-16 md:py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm"
  >
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16 flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Open Positions
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Join our growing team and help shape the future of photo sharing and
          organization
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6 flex flex-col items-center lg:items-stretch">
        {jobListings.map((job) => (
          <JobCard key={job.id} job={job} onApply={onApply} />
        ))}
      </div>

      <div className="text-center mt-12 sm:mt-16">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 md:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Don't See a Perfect Match?
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed">
            We're always looking for talented individuals to join our team. If
            you're passionate about our mission and think you'd be a great fit,
            we'd love to hear from you.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </div>
  </div>
);

const HiringProcessSection = () => (
  <div className="py-12 sm:py-16 md:py-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Our Hiring Process
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
          Simple, transparent, and designed to help us get to know each other
        </p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {[
          {
            step: "1",
            title: "Application Review",
            description:
              "We review your application and portfolio within 3-5 business days.",
          },
          {
            step: "2",
            title: "Initial Chat",
            description:
              "A casual conversation with our team to learn about your background and interests.",
          },
          {
            step: "3",
            title: "Technical/Portfolio Review",
            description:
              "Depending on the role, we'll either have a technical discussion or review your work together.",
          },
          {
            step: "4",
            title: "Team Interview",
            description:
              "Meet with team members you'll be working with to ensure cultural alignment.",
          },
          {
            step: "5",
            title: "Final Decision",
            description:
              "We'll make our decision quickly and provide feedback regardless of the outcome.",
          },
        ].map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex-1">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 mr-4 sm:mr-8">
                <div className="flex flex-col items-center sm:flex-row sm:items-center mb-2 sm:mb-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                    {step.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center sm:text-left">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed text-center sm:text-left">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CallToActionSection = ({ handleGetStarted }) => (
  <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
    <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
      <RocketLaunchIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4 sm:mb-6" />
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
        Ready to Shape the Future?
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
        Join our mission to help people organize and share their most precious
        memories. Apply today and be part of something amazing.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <a
          href="#open-positions"
          className="inline-flex items-center justify-center bg-white text-indigo-600 px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
        >
          Browse Open Positions
        </a>
        <a
          href="/contact"
          className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold border border-white/30 hover:bg-white/30 transition-all duration-200"
        >
          Contact Us
        </a>
      </div>
    </div>
  </div>
);

const ApplicationModal = ({ job, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    experience: "",
    coverLetter: "",
    portfolio: "",
    availableDate: "",
  });
  const [cvFile, setCvFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      // 10MB limit
      setCvFile(file);
      toast.success(`CV uploaded: ${file.name}`, {
        duration: 2000,
        style: {
          background: "#10B981",
          color: "#fff",
          padding: "12px",
          borderRadius: "8px",
          fontSize: "13px",
        },
      });
    } else {
      toast.error("File size must be less than 10MB", {
        duration: 3000,
        style: {
          background: "#EF4444",
          color: "#fff",
          padding: "12px",
          borderRadius: "8px",
          fontSize: "13px",
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Convert CV file to base64 for sending
      let cvFileBase64 = null;
      if (cvFile) {
        const reader = new FileReader();
        cvFileBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(cvFile);
        });
      }

      // Call Firebase function with improved error handling
      const { httpsCallable } = await import("firebase/functions");
      const { functions } = await import(
        "@firebase-services/config"
      );

      const sendJobApplication = httpsCallable(
        functions,
        "sendJobApplicationEmail"
      );

      const applicationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        coverLetter: formData.coverLetter,
        portfolio: formData.portfolio,
        availableDate: formData.availableDate,
        position: job.title,
        department: job.department,
        cvFile: cvFileBase64,
        cvFileName: cvFile?.name,
      };

      const result = await sendJobApplication(applicationData);

      // Check if the function executed successfully
      // Firebase callable functions should return { data: ... }
      if (result && (result.data || result.data === null)) {
        // Toast success message
        toast.success(
          "Application submitted successfully! We'll get back to you soon.",
          {
            duration: 4000,
            style: {
              background: "#10B981",
              color: "#fff",
              padding: "16px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "500",
            },
          }
        );

        onClose();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Application submission error:", error);

      let errorMessage = "Failed to submit application. Please try again.";

      // Provide more specific error messages
      if (error.code === "functions/not-found") {
        errorMessage =
          "Service temporarily unavailable. Please try again later.";
      } else if (error.code === "functions/internal") {
        errorMessage = "Server error occurred. Please try again.";
      } else if (error.code === "functions/unauthenticated") {
        errorMessage = "Authentication required. Please refresh and try again.";
      } else if (error.message?.includes("data field")) {
        // This specific error - the function probably worked but didn't return data properly
        console.warn(
          "Function may have succeeded despite the error. Email might have been sent."
        );
        errorMessage =
          "Application may have been submitted. Please check your email or contact us if you don't hear back.";
      }

      // Toast error message
      toast.error(errorMessage, {
        duration: 6000,
        style: {
          background: "#EF4444",
          color: "#fff",
          padding: "16px",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: "500",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 rounded-t-2xl relative">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Apply for {job.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {job.department} • {job.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10 text-lg sm:text-xl"
          >
            ✕
          </button>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Years of Experience
              </label>
              <select
                value={formData.experience}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    experience: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
              >
                <option value="">Select experience level</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5+">5+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Upload CV/Resume *
              </label>
              <div className="relative">
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="cv-upload"
                />
                <div className="flex items-center justify-center w-full h-24 sm:h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                  <div>
                    {cvFile ? (
                      <div className="flex flex-row items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                            File Selected
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {cvFile.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Click to change file
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-row items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PDF, DOC, DOCX (max 10MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Portfolio/LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.portfolio}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    portfolio: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                placeholder="https://"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available Start Date
              </label>
              <input
                type="date"
                value={formData.availableDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    availableDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Letter
              </label>
              <textarea
                value={formData.coverLetter}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    coverLetter: e.target.value,
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm sm:text-base"
                placeholder="Tell us why you're interested in this position..."
              />
            </div>

            <div className="flex justify-center sm:justify-center space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !cvFile}
                className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="hidden sm:inline">Submitting...</span>
                    <span className="sm:hidden">Submitting...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Submit Application</span>
                    <span className="sm:hidden">Submit</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Careers = () => {
  const { handleGetStarted } = usePublicNavigation();
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const jobListings = [
    {
      id: 1,
      title: "Senior Full-Stack Developer",
      department: "Engineering",
      location: "Remote / Tel Aviv",
      type: "Full-time",
      experience: "3-5 years",
      description:
        "Join our engineering team to build cutting-edge AI-powered photo management features. Work with React, Node.js, and machine learning technologies.",
      requirements: [
        "3+ years of experience with React and Node.js",
        "Experience with cloud platforms (AWS, GCP)",
        "Knowledge of machine learning concepts",
        "Strong problem-solving skills",
      ],
      benefits: [
        "Competitive salary",
        "Equity package",
        "Remote-first culture",
        "Learning budget",
      ],
    },
    {
      id: 2,
      title: "Junior Full-Stack Developer",
      department: "Engineering",
      location: "Remote / Tel Aviv",
      type: "Full-time",
      experience: "0-2 years",
      description:
        "Join our engineering team as a junior developer and grow your skills while building innovative photo management features. Perfect opportunity for recent graduates or career changers.",
      requirements: [
        "Basic knowledge of React and JavaScript",
        "Familiarity with HTML, CSS, and modern web development",
        "Understanding of version control (Git)",
        "Eagerness to learn and grow",
        "Strong problem-solving mindset",
      ],
      benefits: [
        "Competitive salary",
        "Mentorship program",
        "Learning budget",
        "Career growth path",
      ],
    },
    {
      id: 3,
      title: "AI/ML Engineer",
      department: "Engineering",
      location: "Remote / Tel Aviv",
      type: "Full-time",
      experience: "2-4 years",
      description:
        "Drive the development of our computer vision and face recognition algorithms. Work on cutting-edge AI technologies that impact millions of photos.",
      requirements: [
        "Strong background in computer vision",
        "Experience with Python, TensorFlow/PyTorch",
        "Knowledge of deep learning architectures",
        "PhD or Master's in relevant field preferred",
      ],
      benefits: [
        "Competitive salary",
        "Equity package",
        "Conference attendance",
        "Research time",
      ],
    },
    {
      id: 4,
      title: "Product Designer",
      department: "Design",
      location: "Remote / Tel Aviv",
      type: "Full-time",
      experience: "2-4 years",
      description:
        "Shape the user experience of Groupify. Design intuitive interfaces that make photo organization delightful and effortless for our users.",
      requirements: [
        "2+ years of product design experience",
        "Proficiency in Figma and design systems",
        "Experience with user research and testing",
        "Portfolio demonstrating mobile and web design",
      ],
      benefits: [
        "Competitive salary",
        "Equity package",
        "Design tool subscriptions",
        "Creative freedom",
      ],
    },
    {
      id: 5,
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote / Tel Aviv",
      type: "Full-time",
      experience: "2-4 years",
      description:
        "Lead our marketing efforts to grow Groupify's user base. Develop strategies for user acquisition, retention, and brand awareness.",
      requirements: [
        "2+ years in digital marketing",
        "Experience with growth marketing",
        "Knowledge of analytics tools",
        "Creative campaign development",
      ],
      benefits: [
        "Competitive salary",
        "Equity package",
        "Marketing tool budget",
        "Conference attendance",
      ],
    },
    {
      id: 6,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote / Tel Aviv",
      type: "Full-time",
      experience: "1-3 years",
      description:
        "Help our users get the most out of Groupify. Build relationships, gather feedback, and ensure customer satisfaction and retention.",
      requirements: [
        "Experience in customer success or support",
        "Excellent communication skills",
        "Problem-solving mindset",
        "Familiarity with SaaS products",
      ],
      benefits: [
        "Competitive salary",
        "Equity package",
        "Customer interaction",
        "Career growth",
      ],
    },
  ];

  const benefits = [
    {
      icon: CurrencyDollarIcon,
      title: "Competitive Compensation",
      description:
        "Attractive salary packages with equity participation in our growing company.",
    },
    {
      icon: HomeIcon,
      title: "Remote-First Culture",
      description:
        "Work from anywhere with flexible hours and a focus on results, not location.",
    },
    {
      icon: AcademicCapIcon,
      title: "Learning & Development",
      description:
        "Annual learning budget for courses, books, conferences, and skill development.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Health & Wellness",
      description:
        "Comprehensive health insurance and wellness programs for you and your family.",
    },
    {
      icon: GiftIcon,
      title: "Perks & Benefits",
      description:
        "Latest tech equipment, team retreats, and various lifestyle benefits.",
    },
    {
      icon: RocketLaunchIcon,
      title: "Growth Opportunities",
      description:
        "Fast-growing company with opportunities to take on new challenges and responsibilities.",
    },
  ];

  const cultureValues = [
    {
      icon: HeartIcon,
      title: "People First",
      description:
        "We prioritize our team's well-being and create an environment where everyone can thrive and do their best work.",
    },
    {
      icon: SparklesIcon,
      title: "Innovation Mindset",
      description:
        "We encourage creative thinking, experimentation, and learning from failures to drive breakthrough solutions.",
    },
    {
      icon: UsersIcon,
      title: "Collaborative Spirit",
      description:
        "We believe the best results come from diverse teams working together towards shared goals.",
    },
    {
      icon: LightBulbIcon,
      title: "Continuous Learning",
      description:
        "We foster a growth mindset where everyone is encouraged to learn, share knowledge, and develop new skills.",
    },
  ];

  const handleApplyToJob = (job) => {
    setSelectedJobId(job.id);
    setShowApplicationModal(true);
  };

  const handleCloseModal = () => {
    setShowApplicationModal(false);
    setSelectedJobId(null);
  };

  return (
    <PublicLayout
      headerType="public"
      footerType="extended"
      footerProps={{
        customText: "© 2025 Groupify. Built with ❤️ by Ofir & Adir.",
      }}
    >
      {/* Hero Section */}
      <HeroSection
        badge={{ icon: BriefcaseIcon, text: "Join Our Team" }}
        title="Build the Future of Photo Sharing"
        description="Join our passionate team and help millions of people organize and share their most precious memories. We're building something amazing, and we want you to be part of it."
        primaryCTA={{
          text: "View Open Positions",
          href: "#open-positions",
        }}
        secondaryCTA={{
          text: "Learn About Us",
          href: "/about",
        }}
        variant="careers"
      />

      {/* Company Culture Section */}
      <CultureSection cultureValues={cultureValues} />

      {/* Benefits Section */}
      <BenefitsSection benefits={benefits} />

      {/* Open Positions Section */}
      <OpenPositionsSection
        jobListings={jobListings}
        onApply={handleApplyToJob}
      />

      {/* Application Process Section */}
      <HiringProcessSection />

      {/* Call to Action Section */}
      <CallToActionSection handleGetStarted={handleGetStarted} />

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          job={jobListings.find((job) => job.id === selectedJobId)}
          onClose={handleCloseModal}
        />
      )}
    </PublicLayout>
  );
};

export default Careers;
