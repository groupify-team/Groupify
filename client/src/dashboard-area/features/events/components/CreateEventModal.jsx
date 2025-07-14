import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@shared/utils/toast";
import { useEnhancedNavigation } from "@shared/hooks/useEnhancedNavigation";
import {
  XMarkIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ArrowUpIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@auth/hooks/useAuth";
import { eventsService } from "../services/eventsService";
import { usePlanLimits } from "../../../../shared/hooks/usePlanLimits";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import subscriptionService from "@shared/services/subscriptionService";

const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
  // ===== HOOKS SETUP =====
  const navigate = useNavigate();
  const { smoothNavigate } = useEnhancedNavigation();
  const { currentUser } = useAuth();
  const {
    canPerformAction,
    getUsageInfo,
    getPlanFeatures,
    isFreePlan,
    isPremiumPlan,
    isProPlan,
    loading: planLoading,
  } = usePlanLimits();

  // ===== STATE MANAGEMENT =====
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEventName, setCreatedEventName] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentEventCount, setCurrentEventCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ===== COMPUTED VALUES =====
  const usageInfo = getUsageInfo();
  const planFeatures = getPlanFeatures();

  // ===== UTILITY FUNCTIONS =====
  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setError(null);
  }, []);

  const loadEventCount = useCallback(async () => {
    try {
      if (currentUser?.uid) {
        const subscription = subscriptionService.getCurrentSubscription();
        const usageFromService = subscription?.usage?.events?.used || 0;
        const eventsQuery = query(
          collection(db, "events"),
          where("members", "array-contains", currentUser.uid)
        );
        const querySnapshot = await getDocs(eventsQuery);
        const actualCount = querySnapshot.size;
        setCurrentEventCount(actualCount);
        subscriptionService.updateUsage({ events: actualCount });
      }
    } catch (error) {
      console.error("Error loading event count:", error);
    }
  }, [currentUser]);

  const handleLocationSearch = async (query) => {
    if (query.length < 2) {
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:3001/api/city-search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Proxy failed");

      const cities = await response.json();
      const suggestions = cities.map((city) => {
        const state = city.state ? `, ${city.state}` : "";
        return `${city.name}${state}, ${city.country}`;
      });

      setLocationSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setShowSuggestions(false);
    }
  };

  // ===== EVENT HANDLERS =====
  const handleClose = useCallback(() => {
    if (!loading) {
      resetForm();
      onClose();
    }
  }, [loading, onClose, resetForm]);

  const handleUpgradeNavigation = (targetPlan, source) => {
    smoothNavigate(`/pricing?from=${source}&plan=${targetPlan}`, {
      delay: 150,
      showLoader: true,
      replace: false,
    });
  };

  // ===== FORM VALIDATION =====
  const validateForm = () => {
    if (!name.trim()) {
      setError("Event name is required");
      return false;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("End date must be after start date");
      return false;
    }

    return true;
  };

  // ===== FORM SUBMISSION =====
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Create the event
      const newEvent = await eventsService.createEvent({
        name,
        description,
        location,
        startDate: startDate || null,
        endDate: endDate || null,
        createdBy: currentUser.uid,
        members: [currentUser.uid],
        admins: [currentUser.uid],
        photoCount: 0,
      });

      // Update event count
      setCurrentEventCount((prev) => prev + 1);
      setCreatedEventName(name);

      // Calculate remaining events
      const remaining =
        planFeatures?.events === "unlimited"
          ? "unlimited"
          : planFeatures?.events - (currentEventCount + 1);

      // Show success toast
      toast.success(
        `Event "${name}" created successfully! ${
          remaining !== "unlimited"
            ? `(${currentEventCount + 1}/${planFeatures?.events} events)`
            : ""
        }`,
        { duration: 4000 }
      );

      // Reset form
      resetForm();

      // Notify parent component
      if (onEventCreated) {
        onEventCreated(newEvent);
      }

      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error creating event:", error);
      handleCreateEventError(error);
    } finally {
      setLoading(false);
    }
  };

  // ===== ERROR HANDLING =====
  const handleCreateEventError = (error) => {
    const isLimitError =
      error.message.includes("Event limit reached") ||
      error.message.includes("limit reached") ||
      error.message.includes("Free plan allows") ||
      error.message.includes("Premium plan allows") ||
      error.message.includes("Pro plan allows");

    if (isLimitError) {
      setError(error.message);

      // Show error toast with upgrade action
      toast.error(error.message, {
        duration: 6000,
        action: {
          label: "Upgrade Plan",
          onClick: () => {
            const targetPlan = isFreePlan ? "premium" : "pro";
            handleUpgradeNavigation(targetPlan, "events-error");
          },
        },
      });

      // Show upgrade modal
      setShowUpgradeModal(true);
    } else {
      const fallbackError = "Failed to create event. Please try again.";
      setError(fallbackError);
      toast.error(fallbackError, { duration: 4000 });
    }
  };

  // ===== EFFECTS =====

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !loading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, loading, handleClose]);

  // Load event count when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      loadEventCount();
    }
  }, [isOpen, currentUser, loadEventCount]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ===== RENDER CONDITIONS =====
  if (!isOpen) return null;

  // ===== PLAN STATUS HELPERS =====
  const isAtEventLimit = () => {
    return (
      !planLoading &&
      planFeatures &&
      currentEventCount >= (planFeatures?.events || 5) &&
      planFeatures?.events !== "unlimited"
    );
  };

  const getProgressBarColor = () => {
    if (planFeatures?.events === "unlimited") return "bg-green-500";

    const usage = currentEventCount / planFeatures.events;
    if (usage > 0.8) return "bg-red-500";
    if (usage > 0.6) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressBarWidth = () => {
    if (planFeatures?.events === "unlimited") return "0%";
    return `${Math.min((currentEventCount / planFeatures.events) * 100, 100)}%`;
  };

  // ===== SUCCESS MODAL HANDLERS =====
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const handleUpgradeModalClose = () => {
    setShowUpgradeModal(false);
  };

  // ===== MAIN RENDER =====
  return (
    <div
      className="modal-backdrop-standard animate-fade-in"
      onClick={handleClose}
    >
      <div className="relative w-full max-w-md mx-auto">
        {/* Background Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20"></div>

        {/* Modal Container */}
        <div
          className="create-event-modal-content bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden animate-slide-in-scale"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ===== HEADER ===== */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Event</h3>
                  <p className="text-white/70 text-xs">Plan your adventure</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                disabled={loading}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* ===== PLAN STATUS BAR ===== */}
          {!planLoading && usageInfo && (
            <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isFreePlan && (
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                  )}
                  {isPremiumPlan && (
                    <StarIcon className="w-4 h-4 text-blue-500" />
                  )}
                  {isProPlan && (
                    <StarIcon className="w-4 h-4 text-purple-500" />
                  )}

                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {isFreePlan && "Free Plan"}
                    {isPremiumPlan && "Premium Plan"}
                    {isProPlan && "Pro Plan"}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-gray-600 dark:text-gray-400">
                    Events: {currentEventCount}/
                    {planFeatures?.events === "unlimited"
                      ? "∞"
                      : planFeatures?.events || 5}
                  </span>

                  {(isFreePlan || isPremiumPlan) && (
                    <button
                      onClick={() => {
                        const targetPlan = isFreePlan ? "premium" : "pro";
                        handleUpgradeNavigation(targetPlan, "events-modal");
                      }}
                      className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                    >
                      <ArrowUpIcon className="w-3 h-3" />
                      Upgrade
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {planFeatures?.events !== "unlimited" && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                      style={{ width: getProgressBarWidth() }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== EVENT LIMIT WARNING BANNER ===== */}
          {isAtEventLimit() && (
            <div className="mx-6 mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm mb-1">
                    Event Limit Reached ({currentEventCount}/
                    {planFeatures?.events || 5})
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    You've reached your {isFreePlan ? "Free" : "Premium"} plan
                    limit.
                    {isFreePlan
                      ? " Upgrade to Premium for 50 events or Pro for unlimited events!"
                      : " Upgrade to Pro for unlimited events!"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const targetPlan = isFreePlan ? "premium" : "pro";
                    handleClose();
                    handleUpgradeNavigation(targetPlan, "events-limit");
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 flex-shrink-0"
                >
                  <StarIcon className="w-4 h-4" />
                  Upgrade to {isFreePlan ? "Premium" : "Pro"}
                </button>
              </div>
            </div>
          )}

          {/* ===== FORM CONTENT ===== */}
          <div className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Event Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Event name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Summer Vacation"
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="2"
                className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                placeholder="Event description..."
                disabled={loading}
              />
            </div>

            {/* Location with Autocomplete */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    handleLocationSearch(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Paris, France"
                  disabled={loading}
                />

                {/* Location Suggestions Dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationSuggestions
                      .slice(0, 4)
                      .map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setLocation(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 dark:text-white text-sm"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-gray-900 dark:text-white text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-xl font-medium transition-all border border-gray-200/50 dark:border-gray-600/50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !name.trim()}
                className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all transform shadow-lg flex items-center justify-center gap-2 ${
                  loading || !name.trim()
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:scale-105"
                } ${!loading && name.trim() ? "" : "hover:scale-100"}`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    <span className="text-sm">Create</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SUCCESS MODAL ===== */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[1100]"
          style={{ width: "100vw", height: "100vh", overflowY: "auto" }}
        >
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 max-w-md w-full text-center animate-slide-in-scale">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Event Created Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              "{createdEventName}" is ready for your memories
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-6 text-left">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 text-sm">
                What you can do now:
              </h4>
              <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
                <li>• Upload photos and create shared memories</li>
                <li>• Use face recognition to find your photos instantly</li>
                <li>• Invite friends to join and contribute photos</li>
                <li>• No more searching through endless folders!</li>
              </ul>
            </div>

            <button
              onClick={handleSuccessModalClose}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all"
            >
              Start Adding Photos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEventModal;
