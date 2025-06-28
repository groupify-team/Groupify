import React, { useState } from "react";
import {
  XMarkIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../auth/contexts/AuthContext";
import {
  createTrip,
  canUserCreateTrip,
  getUserTripCount,
  MAX_TRIPS_PER_USER,
} from "../../../shared/services/firebase/trips";

const CreateTripModal = ({ isOpen, onClose, onTripCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth();

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

    try {
      setLoading(true);
      setError(null);

      // Check trip limit before creating
      const canCreate = await canUserCreateTrip(currentUser.uid);
      if (!canCreate) {
        const currentCount = await getUserTripCount(currentUser.uid);
        setError(
          `Trip limit reached! You can only create ${MAX_TRIPS_PER_USER} trips. You currently have ${currentCount} trips.`
        );
        setLoading(false);
        return;
      }

      const newTrip = await createTrip({
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

      // Reset form
      setName("");
      setDescription("");
      setLocation("");
      setStartDate("");
      setEndDate("");

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
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-md">
        {/* Background blur effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20"></div>

        {/* Modal content */}
        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
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

          {/* Compact Form */}
          <div className="p-6 space-y-4">
            {/* Error message */}
            {error && (
              <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
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
                placeholder="Trip description..."
                disabled={loading}
              />
            </div>

            {/* Location */}
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
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Paris, France"
                  disabled={loading}
                />
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
                    disabled={loading}
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
                    disabled={loading}
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
                disabled={loading || !name.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 px-4 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg disabled:hover:scale-100 flex items-center justify-center gap-2"
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
    </div>
  );
};

export default CreateTripModal;
