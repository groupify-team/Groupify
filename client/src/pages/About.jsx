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
} from "@heroicons/react/24/outline";

import ofirprofile from "../assets/ofirprofile.jpg";
import adirprofile from "../assets/adirprofile.jpg";

const About = () => {
  const { theme, toggleTheme } = useTheme();

  const founders = [
    {
      name: "Ofir Almog",
      title: "CEO & Co-Founder",
      image: ofirprofile,
      bio: "Passionate about using technology to preserve and organize life's precious memories. With over 8 years of experience in software development and AI, Ofir leads Groupify's vision of making photo organization effortless and intuitive.",
      expertise: [
        "AI & Machine Learning",
        "Product Strategy",
        "Team Leadership",
      ],
      social: {
        linkedin: "https://www.linkedin.com/in/ofir-almog-714858218/",
        twitter: "https://x.com/ofiguu",
        email: "ofir.almog2@gmail.com",
      },
    },
    {
      name: "Adir Edri",
      title: "CEO & Co-Founder",
      image: adirprofile,
      bio: "Expert in computer vision and cloud architecture, Adir brings the technical expertise that powers Groupify's advanced face recognition and photo management capabilities. His innovative approach ensures our platform scales seamlessly.",
      expertise: ["Cloud Architecture", "Full-Stack Development", "Vision AI"],
      social: {
        linkedin: "https://www.linkedin.com/in/adiredri/",
        twitter: "https://x.com/adir_edri1",
        email: "adire7399@gmail.com",
      },
    },
  ];

  const values = [
    {
      icon: HeartIcon,
      title: "Privacy First",
      description:
        "Your memories are personal. We build with privacy and security at the core of everything we do.",
    },
    {
      icon: SparklesIcon,
      title: "Innovation",
      description:
        "We leverage cutting-edge AI technology to create magical experiences that make organizing photos effortless.",
    },
    {
      icon: UsersIcon,
      title: "Community",
      description:
        "Photos are meant to be shared. We build tools that bring people together through shared memories.",
    },
    {
      icon: LightBulbIcon,
      title: "Simplicity",
      description:
        "Complex technology should feel simple. We design intuitive experiences that anyone can use.",
    },
  ];

  const milestones = [
    {
      year: "2023",
      title: "The Idea",
      description:
        "Frustrated by disorganized travel photos, Ofir and Adir decide to solve this problem for everyone.",
    },
    {
      year: "2024",
      title: "First Product",
      description:
        "Launch of Groupify with basic AI face recognition and photo organization features.",
    },
    {
      year: "2024",
      title: "Growing Community",
      description:
        "Reached 10,000+ active users organizing millions of photos and sharing countless memories.",
    },
    {
      year: "2025",
      title: "The Future",
      description:
        "Expanding globally with advanced AI features and enhanced collaboration tools.",
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
            <RocketLaunchIcon className="w-5 h-5 text-white mr-2" />
            <span className="text-white font-medium">Our Story</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About Groupify
          </h1>
          <p className="text-xl text-indigo-100 mb-8 leading-relaxed max-w-2xl mx-auto">
            We're on a mission to help people organize and share their most
            precious memories through the power of AI and beautiful design.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Every photo tells a story, but finding the right story in
                thousands of photos can be overwhelming. We believe that
                organizing and sharing memories should be as joyful as creating
                them.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                That's why we built Groupify – to use the latest AI technology
                to automatically organize your photos and make sharing moments
                with friends and family effortless and magical.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    10K+
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Happy Users
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    1M+
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Photos Organized
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-square bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl shadow-lg"></div>
                  <div className="aspect-square bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl shadow-lg"></div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="aspect-square bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl shadow-lg"></div>
                  <div className="aspect-square bg-gradient-to-br from-indigo-400 to-blue-500 rounded-2xl shadow-lg"></div>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/50"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Founders Section */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our Founders
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The passionate duo behind Groupify's vision of making photo
              organization simple and beautiful
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {founders.map((founder, index) => (
              <div
                key={index}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-8 hover:shadow-2xl transition-all duration-300"
              >
                {/* Profile Image Placeholder - Circular */}
                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-6 shadow-lg border-4 border-white dark:border-gray-700">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {founder.name}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-4">
                    {founder.title}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                    {founder.bio}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {founder.expertise.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <a
                    href={founder.social.linkedin}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">LinkedIn</span>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a
                    href={`mailto:${founder.social.email}`}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <span className="sr-only">Email</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </a>
                  <a
                    href={founder.social.twitter}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">Twitter</span>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.4 1.5a9.14 9.14 0 01-2.88 1.1A4.52 4.52 0 0016.5 0c-2.5 0-4.5 2.1-4.5 4.7 0 .37.04.73.12 1.07C8.6 5.6 5.6 3.7 3.6 1.1a4.74 4.74 0 00-.6 2.4c0 1.6.8 3.1 2 3.9a4.52 4.52 0 01-2-.6v.06c0 2.2 1.5 4 3.5 4.4-.37.1-.75.15-1.14.15-.28 0-.55-.03-.82-.08.56 1.8 2.2 3.1 4.2 3.1A9.06 9.06 0 010 19.5a12.9 12.9 0 007 2c8.4 0 13-7 13-13v-.6A9.4 9.4 0 0023 3z" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we do at Groupify
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
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

      {/* Timeline Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              From idea to reality – the milestones that shaped Groupify
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex items-center ${
                  index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div className="flex-1">
                  <div
                    className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6 ${
                      index % 2 === 0 ? "mr-8" : "ml-8"
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                        <StarIcon className="w-4 h-4" />
                      </div>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {milestone.year}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Join Us Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <GlobeAltIcon className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-indigo-100 mb-8 leading-relaxed max-w-2xl mx-auto">
            Ready to organize your memories and share them with the people you
            love? Join thousands of users who trust Groupify with their precious
            moments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Start Organizing
            </Link>
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

export default About;
