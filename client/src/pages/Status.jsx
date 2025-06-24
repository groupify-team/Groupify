import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  CameraIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
  CloudIcon,
  DevicePhoneMobileIcon,
  CogIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

const Status = () => {
  const { theme, toggleTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoaded(true);
  }, []);

  // Mock service status data (in a real app, this would come from your monitoring API)
  const services = [
    {
      name: "Photo Upload Service",
      status: "operational",
      description: "Photo upload and processing",
      icon: CameraIcon,
      uptime: 99.98,
      responseTime: "156ms",
      lastIncident: null,
    },
    {
      name: "AI Face Recognition",
      status: "operational",
      description: "Face detection and recognition processing",
      icon: BoltIcon,
      uptime: 99.95,
      responseTime: "890ms",
      lastIncident: null,
    },
    {
      name: "Web Application",
      status: "operational",
      description: "Main web application and dashboard",
      icon: GlobeAltIcon,
      uptime: 99.99,
      responseTime: "89ms",
      lastIncident: null,
    },
    {
      name: "Mobile Apps",
      status: "operational",
      description: "iOS and Android mobile applications",
      icon: DevicePhoneMobileIcon,
      uptime: 99.97,
      responseTime: "123ms",
      lastIncident: null,
    },
    {
      name: "API Services",
      status: "operational",
      description: "Core API and third-party integrations",
      icon: CogIcon,
      uptime: 99.96,
      responseTime: "67ms",
      lastIncident: null,
    },
    {
      name: "Cloud Storage",
      status: "operational",
      description: "Photo storage and backup systems",
      icon: CloudIcon,
      uptime: 99.99,
      responseTime: "45ms",
      lastIncident: null,
    },
    {
      name: "Authentication",
      status: "degraded",
      description: "User login and security services",
      icon: ShieldCheckIcon,
      uptime: 99.92,
      responseTime: "234ms",
      lastIncident: "2 hours ago",
    },
    {
      name: "Database",
      status: "operational",
      description: "Primary and backup database systems",
      icon: ServerIcon,
      uptime: 99.98,
      responseTime: "23ms",
      lastIncident: null,
    },
  ];

  const incidents = [
    {
      id: 1,
      title: "Authentication Service Experiencing Delays",
      status: "investigating",
      severity: "minor",
      description:
        "We are currently investigating reports of slower than normal login times. Users may experience delays of 5-10 seconds when signing in.",
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      updates: [
        {
          time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          status: "investigating",
          message:
            "We have identified the cause and are implementing a fix. Authentication services are still functional but experiencing delays.",
        },
        {
          time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: "identified",
          message:
            "We are investigating reports of slower authentication response times.",
        },
      ],
    },
    {
      id: 2,
      title: "Scheduled Maintenance - Database Optimization",
      status: "scheduled",
      severity: "maintenance",
      description:
        "We will be performing routine database maintenance to improve performance. No service interruption is expected.",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours
      updates: [],
    },
  ];

  const historicalIncidents = [
    {
      id: 3,
      title: "Photo Upload Service Temporarily Unavailable",
      status: "resolved",
      severity: "major",
      description:
        "Photo uploads were temporarily unavailable due to a storage service issue.",
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 minutes
      duration: "45 minutes",
    },
    {
      id: 4,
      title: "Slow AI Processing Times",
      status: "resolved",
      severity: "minor",
      description:
        "Face recognition processing was slower than normal due to high demand.",
      startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      endTime: new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
      ), // 3 hours
      duration: "3 hours",
    },
    {
      id: 5,
      title: "Mobile App Push Notifications Delayed",
      status: "resolved",
      severity: "minor",
      description:
        "Push notifications were delayed due to a third-party service issue.",
      startTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
      endTime: new Date(
        Date.now() - 21 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000
      ), // 1.5 hours
      duration: "1.5 hours",
    },
  ];

  const uptime = [
    { date: "2025-06-17", uptime: 100.0 },
    { date: "2025-06-18", uptime: 99.95 },
    { date: "2025-06-19", uptime: 100.0 },
    { date: "2025-06-20", uptime: 99.98 },
    { date: "2025-06-21", uptime: 100.0 },
    { date: "2025-06-22", uptime: 99.97 },
    { date: "2025-06-23", uptime: 99.92 },
    { date: "2025-06-24", uptime: 99.96 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "degraded":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
      case "outage":
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      case "maintenance":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "operational":
        return CheckCircleIcon;
      case "degraded":
        return ExclamationTriangleIcon;
      case "outage":
        return XCircleIcon;
      case "maintenance":
        return WrenchScrewdriverIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "major":
        return "bg-orange-500";
      case "minor":
        return "bg-yellow-500";
      case "maintenance":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTime = (date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const getUptimeColor = (uptime) => {
    if (uptime >= 99.95) return "bg-green-500";
    if (uptime >= 99.5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const overallStatus = services.some((s) => s.status === "outage")
    ? "outage"
    : services.some((s) => s.status === "degraded")
    ? "degraded"
    : "operational";

  const overallUptime = (
    services.reduce((acc, service) => acc + service.uptime, 0) / services.length
  ).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
      {/* Navigation Header */}
      <nav className="relative z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4 sm:mb-6`}
          >
            {React.createElement(getStatusIcon(overallStatus), {
              className: "w-4 h-4 sm:w-5 sm:h-5 text-white mr-2",
            })}
            <span className="text-white font-medium text-sm sm:text-base">
              {overallStatus === "operational" && "All Systems Operational"}
              {overallStatus === "degraded" && "Some Systems Degraded"}
              {overallStatus === "outage" && "Service Disruption"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Groupify System Status
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
            Real-time status and performance monitoring for all Groupify
            services. We're committed to transparency and keeping you informed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-indigo-100">
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              <span className="text-sm sm:text-base">
                Last updated: {formatTime(currentTime)}
              </span>
            </div>
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
              <span className="text-sm sm:text-base">
                Overall uptime: {overallUptime}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Incidents */}
      {incidents.length > 0 && (
        <div className="py-8 sm:py-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
              Current Incidents & Maintenance
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      <div
                        className={`w-3 h-3 rounded-full ${getSeverityColor(
                          incident.severity
                        )} mt-2 mr-3 flex-shrink-0`}
                      ></div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {incident.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3">
                          {incident.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <span>Started: {formatTime(incident.startTime)}</span>
                          {incident.endTime && (
                            <span>
                              Scheduled end: {formatTime(incident.endTime)}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded-full font-medium ${getStatusColor(
                              incident.status
                            )}`}
                          >
                            {incident.status.charAt(0).toUpperCase() +
                              incident.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {incident.updates.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Updates:
                      </h4>
                      <div className="space-y-3">
                        {incident.updates.map((update, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {formatTime(update.time)}
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {update.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Service Status */}
      <div className="py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12 text-center">
            Service Status
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {services.map((service, index) => (
              <div
                key={service.name}
                className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 ${
                  isLoaded
                    ? `opacity-100 translate-y-0 delay-${index * 50}`
                    : "opacity-0 translate-y-8"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <service.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {service.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {service.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Uptime: {service.uptime}%
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Response: {service.responseTime}
                        </span>
                        {service.lastIncident && (
                          <span className="text-gray-500 dark:text-gray-400">
                            Last incident: {service.lastIncident}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(
                      service.status
                    )}`}
                  >
                    {service.status.charAt(0).toUpperCase() +
                      service.status.slice(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uptime History */}
      <div className="py-12 sm:py-16 md:py-20 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12 text-center">
            7-Day Uptime History
          </h2>

          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6">
            <div className="grid grid-cols-8 gap-1 sm:gap-2 mb-4">
              {uptime.map((day, index) => (
                <div key={day.date} className="text-center">
                  <div
                    className={`w-full h-8 sm:h-12 rounded ${getUptimeColor(
                      day.uptime
                    )} mb-2 relative group cursor-pointer`}
                    title={`${day.date}: ${day.uptime}% uptime`}
                  >
                    <div className="absolute inset-x-0 -top-8 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {day.uptime}%
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span>99.95%+ uptime</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                <span>99.5-99.95% uptime</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span>&lt;99.5% uptime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident History */}
      <div className="py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12 text-center">
            Recent Incident History
          </h2>

          {historicalIncidents.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {historicalIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div
                        className={`w-3 h-3 rounded-full ${getSeverityColor(
                          incident.severity
                        )} mt-2 mr-3 flex-shrink-0`}
                      ></div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {incident.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3">
                          {incident.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <span>{formatTime(incident.startTime)}</span>
                          <span>Duration: {incident.duration}</span>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-medium">
                            Resolved
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Recent Incidents
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All systems have been running smoothly in the past 30 days.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subscribe Section */}
      <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <ChartBarIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4 sm:mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Stay Informed
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
            Subscribe to status updates and get notified about incidents,
            maintenance, and service updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
            <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap">
              Subscribe
            </button>
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
              © 2025 Groupify. Transparent and reliable service monitoring.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Status;
