import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  MapPinIcon,
  CalendarIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { updateTrip } from "../../services/firebase/trips";

const EditTripModal = ({ isOpen, onClose, trip, onTripUpdated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth();

  // Populate form with trip data when trip changes or modal opens
  useEffect(() => {
    if (trip && isOpen) {
      setName(trip.name || "");
      setDescription(trip.description || "");
      setLocation(trip.location || "");
      setStartDate(trip.startDate || "");
      setEndDate(trip.endDate || "");
      setError(null);
    }
  }, [trip, isOpen]);

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

      const updatedTripData = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        updatedAt: new Date().toISOString(),
      };

      await updateTrip(trip.id, updatedTripData);

      // Notify parent component with updated trip data
      if (onTripUpdated) {
        onTripUpdated({
          ...trip,
          ...updatedTripData,
        });
      }

      // Show success toast
      toast.success("Trip updated successfully!");

      // Close modal
      onClose();
    } catch (error) {
      console.error("Error updating trip:", error);
      setError("Failed to update trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form to original trip data
      if (trip) {
        setName(trip.name || "");
        setDescription(trip.description || "");
        setLocation(trip.location || "");
        setStartDate(trip.startDate || "");
        setEndDate(trip.endDate || "");
      }
      setError(null);
      onClose();
    }
  };

  // Check if form has been modified
  const hasChanges =
    trip &&
    (name !== (trip.name || "") ||
      description !== (trip.description || "") ||
      location !== (trip.location || "") ||
      startDate !== (trip.startDate || "") ||
      endDate !== (trip.endDate || ""));

  if (!isOpen || !trip) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={handleClose}
    >
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-sm sm:max-w-md my-auto">
          {/* Background blur effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl blur opacity-20"></div>

          {/* Modal content */}
          <div
            className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
                    <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Edit Trip
                    </h3>
                    <p className="text-white/70 text-xs hidden sm:block">
                      Update your adventure
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-1 sm:p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Compact Form */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{error}</span>
                </div>
              )}

              {/* Trip Name */}
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                  Trip Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  placeholder="Summer Vacation"
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none text-sm"
                  placeholder="Trip description..."
                  disabled={loading}
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-8 pr-3 sm:pl-10 py-2 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                    placeholder="Paris, France"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                    Start Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-8 pr-3 sm:pl-10 py-2 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 dark:text-white text-xs sm:text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                    End Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500" />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full pl-8 pr-3 sm:pl-10 py-2 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-gray-900 dark:text-white text-xs sm:text-sm"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Change indicator */}
              {hasChanges && !loading && (
                <div className="bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 px-3 py-2 sm:px-4 rounded-lg sm:rounded-xl flex items-center gap-2">
                  <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">
                    You have unsaved changes
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="w-full sm:flex-1 bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-lg sm:rounded-xl font-medium transition-all border border-gray-200/50 dark:border-gray-600/50 disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !name.trim() || !hasChanges}
                  className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 px-4 rounded-lg sm:rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Update</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTripModal;
