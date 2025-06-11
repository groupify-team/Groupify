import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  CameraIcon,
  MoonIcon,
  SunIcon,
  ArrowLeftIcon,
  SparklesIcon,
  HeartIcon,
  LightBulbIcon,
  RocketLaunchIcon,
  UsersIcon,
  GlobeAltIcon,
  StarIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ClockIcon,
  HomeIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";

const Careers = () => {
  const { theme, toggleTheme } = useTheme();

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
      id: 3,
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
      id: 4,
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote / Tel Aviv",
      type: "Full-time",
      experience: "3-5 years",
      description:
        "Build and maintain our cloud infrastructure. Ensure scalability, security, and reliability of our platform as we grow globally.",
      requirements: [
        "Experience with Kubernetes and Docker",
        "Knowledge of AWS/GCP services",
        "Experience with CI/CD pipelines",
        "Understanding of security best practices",
      ],
      benefits: [
        "Competitive salary",
        "Equity package",
        "Cloud certifications",
        "On-call compensation",
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-6">
            <BriefcaseIcon className="w-5 h-5 text-white mr-2" />
            <span className="text-white font-medium">Join Our Team</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Build the Future of Photo Sharing
          </h1>
          <p className="text-xl text-indigo-100 mb-8 leading-relaxed max-w-2xl mx-auto">
            Join our passionate team and help millions of people organize and
            share their most precious memories. We're building something
            amazing, and we want you to be part of it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#open-positions"
              className="inline-flex items-center justify-center bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              View Open Positions
            </a>
            <Link
              to="/about"
              className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold border border-white/30 hover:bg-white/30 transition-all duration-200"
            >
              Learn About Us
            </Link>
          </div>
        </div>
      </div>

      {/* Company Culture Section */}
      <div className="py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Culture & Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're building more than just a product – we're creating a culture
              where talented people can do their best work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cultureValues.map((value, index) => (
              <div
                key={index}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why You'll Love Working Here
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We offer competitive benefits and perks to support your
              professional growth and personal well-being
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions Section */}
      <div id="open-positions" className="py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Open Positions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join our growing team and help shape the future of photo sharing
              and organization
            </p>
          </div>

          <div className="space-y-6">
            {jobListings.map((job) => (
              <div
                key={job.id}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div className="mb-4 lg:mb-0">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <BriefcaseIcon className="w-4 h-4 mr-1" />
                        {job.department}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {job.type}
                      </div>
                      <div className="flex items-center">
                        <AcademicCapIcon className="w-4 h-4 mr-1" />
                        {job.experience}
                      </div>
                    </div>
                  </div>
                  <button className="self-start lg:self-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg">
                    Apply Now
                  </button>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {job.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Requirements
                    </h4>
                    <ul className="space-y-2">
                      {job.requirements.map((req, index) => (
                        <li
                          key={index}
                          className="flex items-start text-gray-600 dark:text-gray-300 text-sm"
                        >
                          <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      What We Offer
                    </h4>
                    <ul className="space-y-2">
                      {job.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          className="flex items-start text-gray-600 dark:text-gray-300 text-sm"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Don't See a Perfect Match?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                We're always looking for talented individuals to join our team.
                If you're passionate about our mission and think you'd be a
                great fit, we'd love to hear from you.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Application Process Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Hiring Process
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Simple, transparent, and designed to help us get to know each other
            </p>
          </div>

          <div className="space-y-8">
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
              <div
                key={index}
                className="flex items-center"
              >
                <div className="flex-1">
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6 mr-8">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                        {step.step}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <RocketLaunchIcon className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Shape the Future?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 leading-relaxed max-w-2xl mx-auto">
            Join our mission to help people organize and share their most
            precious memories. Apply today and be part of something amazing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#open-positions"
              className="inline-flex items-center justify-center bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Browse Open Positions
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold border border-white/30 hover:bg-white/30 transition-all duration-200"
            >
              Contact Us
            </Link>
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
              © 2025 Groupify. Built with ❤️ by Ofir & Adir.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Careers;