import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// New Architecture Components
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/ui/HeroSection";
import { FeatureGrid } from "../../components/ui/FeatureCard";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";
import SettingsModal from "@dashboard/features/settings/components/modals/EditProfileModal";

// Icons
import {
  RocketLaunchIcon,
  HeartIcon,
  SparklesIcon,
  UsersIcon,
  LightBulbIcon,
  StarIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ChartBarIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

// Profile images
import ofirprofile from "../../../assets/ofirprofile.jpg";
import adirprofile from "../../../assets/adirprofile.jpg";

const AboutPage = () => {
  const { handleGetStarted, headerProps, settingsProps } =
    usePublicNavigation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoaded(true);
  }, []);

  // Founders data
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

  // Values as feature cards
  const values = [
    {
      id: 1,
      icon: HeartIcon,
      title: "Privacy First",
      description:
        "Your memories are personal. We build with privacy and security at the core of everything we do.",
      variant: "simple",
    },
    {
      id: 2,
      icon: SparklesIcon,
      title: "Innovation",
      description:
        "We leverage cutting-edge AI technology to create magical experiences that make organizing photos effortless.",
      variant: "simple",
    },
    {
      id: 3,
      icon: UsersIcon,
      title: "Community",
      description:
        "Photos are meant to be shared. We build tools that bring people together through shared memories.",
      variant: "simple",
    },
    {
      id: 4,
      icon: LightBulbIcon,
      title: "Simplicity",
      description:
        "Complex technology should feel simple. We design intuitive experiences that anyone can use.",
      variant: "simple",
    },
  ];

  // Milestones data
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
    <PublicLayout
      headerType="public"
      headerProps={headerProps}
      footerType="default"
      footerProps={{
        customText: "© 2025 Groupify. Built with ❤️ by Ofir & Adir.",
      }}
    >
      {/* Hero Section */}
      <HeroSection
        badge={{
          icon: RocketLaunchIcon,
          text: "Our Story",
        }}
        title="About Groupify"
        description="We're on a mission to help people organize and share their most precious memories through the power of AI and beautiful design."
        primaryCTA={{
          text: "Start Organizing",
          href: "/signup",
          onClick: handleGetStarted,
        }}
        secondaryCTA={{
          text: "Contact Us",
          href: "/contact",
        }}
      />

      {/* Mission Section */}
      <div className="py-12 sm:py-16 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Our Mission
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                Every photo tells a story, but finding the right story in
                thousands of photos can be overwhelming. We believe that
                organizing and sharing memories should be as joyful as creating
                them.
              </p>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                That's why we built Groupify – to use the latest AI technology
                to automatically organize your photos and make sharing moments
                with friends and family effortless and magical.
              </p>

              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    10K+
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Happy Users
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    1M+
                  </div>
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Photos Organized
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Photo Grid Mockup */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3 sm:space-y-4">
                  {/* Family Photo */}
                  <div className="aspect-square bg-gradient-to-br from-orange-300 to-pink-300 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center">
                    <UsersIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                  </div>
                  {/* Travel Photo */}
                  <div className="aspect-square bg-gradient-to-br from-blue-300 to-indigo-300 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center">
                    <GlobeAltIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-8">
                  {/* Friends Photo */}
                  <div className="aspect-square bg-gradient-to-br from-purple-300 to-pink-300 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center">
                    <HeartIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                  </div>
                  {/* Events Photo */}
                  <div className="aspect-square bg-gradient-to-br from-green-300 to-teal-300 rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center">
                    <StarIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Founders Section */}
      <div className="py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our Founders
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The passionate duo behind Groupify's vision of making photo
              organization simple and beautiful
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {founders.map((founder, index) => (
              <div
                key={index}
                className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 md:p-8 hover:shadow-2xl transition-all duration-300 ${
                  isLoaded
                    ? `opacity-100 translate-y-0 delay-${index * 200}`
                    : "opacity-0 translate-y-8"
                }`}
              >
                {/* Profile Image */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden mx-auto mb-4 sm:mb-6 shadow-lg border-4 border-white dark:border-gray-700">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {founder.name}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-3 sm:mb-4 text-sm sm:text-base">
                    {founder.title}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center text-sm sm:text-base">
                    {founder.bio}
                  </p>
                </div>

                <div className="mb-4 sm:mb-6 text-center">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">
                    Expertise
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                    {founder.expertise.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-2 py-1 sm:px-3 sm:py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs sm:text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center space-x-3 sm:space-x-4">
                  <a
                    href={founder.social.linkedin}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">LinkedIn</span>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
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
                      className="w-4 h-4 sm:w-5 sm:h-5"
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
                      className="w-4 h-4 sm:w-5 sm:h-5"
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
      <div className="py-12 sm:py-16 md:py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we do at Groupify
            </p>
          </div>

          <FeatureGrid
            features={values}
            columns={4}
            variant="simple"
            isLoaded={isLoaded}
          />
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              From idea to reality – the milestones that shaped Groupify
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`flex flex-col md:flex-row items-center ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className="flex-1 w-full">
                  <div
                    className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 text-center md:text-left transition-all duration-300 hover:shadow-lg ${
                      index % 2 === 0 ? "md:mr-8" : "md:ml-8"
                    } ${
                      isLoaded
                        ? `opacity-100 translate-y-0 delay-${index * 150}`
                        : "opacity-0 translate-y-8"
                    }`}
                  >
                    <div className="flex items-center justify-center md:justify-start mb-2 sm:mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                        <StarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {milestone.year}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
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
      <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <GlobeAltIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4 sm:mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Join Our Mission
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
            Ready to organize your memories and share them with the people you
            love? Join thousands of users who trust Groupify with their precious
            moments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center bg-white text-indigo-600 px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Start Organizing
            </button>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold border border-white/30 hover:bg-white/30 transition-all duration-200"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
      <SettingsModal {...settingsProps} />
    </PublicLayout>
  );
};

export default AboutPage;
