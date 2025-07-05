// components/CreateTripModal.jsx
import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@auth/contexts/AuthContext";
import { tripsService } from "../services/tripsService";
import { usePlanLimits } from "../../../../shared/hooks/usePlanLimits";

const CreateTripModal = ({ isOpen, onClose, onTripCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTripName, setCreatedTripName] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentTripCount, setCurrentTripCount] = useState(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Plan limits integration
  const {
    canPerformAction,
    enforceLimit,
    getUsageInfo,
    getPlanFeatures,
    isFreePlan,
    isPremiumPlan,
    isProPlan,
    loading: planLoading
  } = usePlanLimits();

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
  }, [isOpen, loading]);

  // Load current trip count when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      loadTripCount();
    }
  }, [isOpen, currentUser]);

  const loadTripCount = async () => {
    try {
      const count = await tripsService.getUserTripCount(currentUser.uid);
      setCurrentTripCount(count);
    } catch (error) {
      console.error("Error loading trip count:", error);
    }
  };

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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      setError("Trip name is required");
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("End date must be after start date");
      return;
    }

    // Check plan limits before proceeding
    const limitCheck = canPerformAction('create_trip', { currentTripCount });
    
    if (!limitCheck.allowed) {
      if (limitCheck.upgradeRequired) {
        setShowUpgradePrompt(true);
        setError(limitCheck.reason);
        return;
      } else {
        setError(limitCheck.reason);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Legacy trip limit check (keeping for backward compatibility)
      const canCreate = await tripsService.canUserCreateTrip(currentUser.uid);
      if (!canCreate) {
        const currentCount = await tripsService.getUserTripCount(
          currentUser.uid
        );
        setError(
          `Trip limit reached! You can only create ${tripsService.MAX_TRIPS_PER_USER} trips. You currently have ${currentCount} trips.`
        );
        setLoading(false);
        return;
      }

      const newTrip = await tripsService.createTrip({
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

      // Update usage statistics
      setCurrentTripCount(prev => prev + 1);

      // Store trip name for success modal
      setCreatedTripName(name);

      // Reset form
      setName("");
      setDescription("");
      setLocation("");
      setStartDate("");
      setEndDate("");
      setShowSuccessModal(true);

      // Notify parent component
      if (onTripCreated) {
        onTripCreated(newTrip);
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error("Error creating trip:", error);
      if (error.message.includes("Trip limit reached")) {
        setError(error.message);
      } else {
        setError("Failed to create trip. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName("");
      setDescription("");
      setLocation("");
      setStartDate("");
      setEndDate("");
      setError(null);
      setShowUpgradePrompt(false);
      onClose();
    }
  };

  const handleUpgradeClick = () => {
    // Navigate to upgrade page or show upgrade modal
    console.log('Navigate to upgrade page');
    setShowUpgradePrompt(false);
    // onClose(); // Close this modal if navigating away
  };

  if (!isOpen) return null;

  const usageInfo = getUsageInfo();
  const planFeatures = getPlanFeatures();

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={handleClose}
    >
      <div className="relative w-full max-w-md">
        {/* Background blur effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20"></div>

        {/* Modal content */}
        <div
          className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden animate-slide-in-scale"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Trip</h3>
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

          {/* Plan Status Bar */}
          {!planLoading && usageInfo && (
            <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isFreePlan && <StarIcon className="w-4 h-4 text-yellow-500" />}
                  {isPremiumPlan && <StarIcon className="w-4 h-4 text-blue-500" />}
                  {isProPlan && <StarIcon className="w-4 h-4 text-purple-500" />}
                  
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {isFreePlan && 'Free Plan'}
                    {isPremiumPlan && 'Premium Plan'}
                    {isProPlan && 'Pro Plan'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 dark:text-gray-400">
                    Trips: {currentTripCount}/{planFeatures?.trips === 'unlimited' ? '∞' : planFeatures?.trips || 0}
                  </span>
                  
                  {(isFreePlan || isPremiumPlan) && (
                    <button
                      onClick={() => setShowUpgradePrompt(true)}
                      className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                    >
                      <ArrowUpIcon className="w-3 h-3" />
                      Upgrade
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar for trip usage */}
              {planFeatures?.trips !== 'unlimited' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        (currentTripCount / planFeatures.trips) > 0.8
                          ? 'bg-red-500'
                          : (currentTripCount / planFeatures.trips) > 0.6
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((currentTripCount / planFeatures.trips) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact Form */}
          <div className="p-6 space-y-4">
            {/* Error message */}
            {error && (
              <div className={`border px-4 py-3 rounded-xl flex items-center gap-2 ${
                showUpgradePrompt 
                  ? 'bg-blue-50/80 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-400'
                  : 'bg-red-50/80 dark:bg-red-900/30 border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400'
              }`}>
                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
                
                {showUpgradePrompt && (
                  <button
                    onClick={handleUpgradeClick}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  >
                    Upgrade Now
                  </button>
                )}
              </div>
            )}

            {/* Upgrade prompt for plan limits */}
            {showUpgradePrompt && !error && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <StarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Upgrade to Create More Trips
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      You've reached your {planFeatures?.trips || 0} trip limit. Upgrade to {isPremiumPlan ? 'Pro' : 'Premium'} for {isPremiumPlan ? 'unlimited' : 'more'} trips!
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpgradeClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Upgrade Plan
                      </button>
                      <button
                        onClick={() => setShowUpgradePrompt(false)}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trip Name */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Trip Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Summer Vacation"
                required
                disabled={loading || showUpgradePrompt}
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
                placeholder="Trip description..."
                disabled={loading || showUpgradePrompt}
              />
            </div>

            {/* Location with Autocomplete */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="w-4 h-4 text-indigo-500" />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    handleLocationSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Paris, France"
                  disabled={loading || showUpgradePrompt}
                />

                {/* Dropdown suggestions */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Start Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="w-4 h-4 text-green-500" />
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 dark:text-white text-sm"
                    disabled={loading || showUpgradePrompt}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  End Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="w-4 h-4 text-purple-500" />
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full pl-10 pr-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 dark:text-white text-sm"
                    disabled={loading || showUpgradePrompt}
                  />
                </div>
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
                disabled={loading || !name.trim() || showUpgradePrompt}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 px-4 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm">Creating...</span>
                  </>
                ) : showUpgradePrompt ? (
                  <>
                    <StarIcon className="w-4 h-4" />
                    <span className="text-sm">Upgrade Required</span>
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 max-w-md w-full text-center animate-slide-in-scale">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Trip Created Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              "{createdTripName}" is ready for your memories
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
              onClick={() => {
                setShowSuccessModal(false);
                onClose();
              }}
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

export default CreateTripModal;