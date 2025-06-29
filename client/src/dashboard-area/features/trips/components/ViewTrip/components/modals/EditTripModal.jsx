import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  MapPinIcon,
  CalendarIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useAuth } from "@auth/contexts/AuthContext";
import { updateTrip, deleteTrip } from "@shared/services/firebase/trips";

const EditTripModal = ({
  isOpen,
  onClose,
  trip,
  onTripUpdated,
  onTripDeleted,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { currentUser } = useAuth();

  // Check if current user is admin
  const isAdmin =
    trip?.admins?.includes(currentUser?.uid) ||
    trip?.createdBy === currentUser?.uid;

  // Populate form with trip data when trip changes or modal opens
  useEffect(() => {
    if (trip && isOpen) {
      setName(trip.name || "");
      setDescription(trip.description || "");
      setLocation(trip.location || "");
      setStartDate(trip.startDate || "");
      setEndDate(trip.endDate || "");
      setError(null);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
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

  const handleDelete = async () => {
    if (deleteConfirmText !== trip.name) {
      setError(`Please type "${trip.name}" exactly to confirm deletion`);
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      toast.loading("Deleting trip... This may take a moment.", {
        id: "deleting-trip",
      });

      // Delete the trip
      await deleteTrip(trip.id);

      // Show success message
      toast.dismiss("deleting-trip");
      toast.success("Trip deleted successfully!");

      // Close modal
      onClose();

      // SIMPLE: Just go to dashboard and refresh
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast.dismiss("deleting-trip");
      setError("Failed to delete trip. Please try again.");
      toast.error("Failed to delete trip. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!loading && !deleting) {
      // Reset form to original trip data
      if (trip) {
        setName(trip.name || "");
        setDescription(trip.description || "");
        setLocation(trip.location || "");
        setStartDate(trip.startDate || "");
        setEndDate(trip.endDate || "");
      }
      setError(null);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
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
      <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
        <div className="relative w-full max-w-[300px] sm:max-w-sm md:max-w-md my-0 mx-2 max-[320px]:max-w-[280px]">
          {/* Background blur effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl blur opacity-20"></div>

          {/* Modal content */}
          <div
            className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-white/20 backdrop-blur-sm rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center">
                    <PencilIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">
                      {showDeleteConfirm ? "Delete Trip" : "Edit Trip"}
                    </h3>
                    <p className="text-white/70 text-xs hidden sm:block">
                      {showDeleteConfirm
                        ? "Confirm deletion"
                        : "Update your adventure"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  disabled={loading || deleting}
                  className="p-1 sm:p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4 max-[320px]:p-2 max-[320px]:space-y-1">
              {/* Error message */}
              {error && (
                <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{error}</span>
                </div>
              )}

              {/* Delete Confirmation View */}
              {showDeleteConfirm ? (
                <div className="space-y-4">
                  <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-lg sm:rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <ExclamationTriangleIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-red-800 dark:text-red-400">
                          ⚠️ Permanent Deletion
                        </h4>
                        <p className="text-red-700 dark:text-red-300 text-sm">
                          This action cannot be undone
                        </p>
                      </div>
                    </div>

                    <p className="text-red-700 dark:text-red-300 text-sm mb-3">
                      This will permanently delete:
                    </p>
                    <ul className="text-red-700 dark:text-red-300 text-sm list-disc list-inside space-y-1 mb-4">
                      <li>Trip details and information</li>
                      <li>All photos and memories</li>
                      <li>Member access and invitations</li>
                      <li>All associated data</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                      Type "{trip.name}" to confirm deletion:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => {
                        setDeleteConfirmText(e.target.value);
                        setError(null);
                      }}
                      placeholder={`Type ${trip.name} here`}
                      className="w-full px-2 py-2 sm:px-3 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm max-[320px]:px-2 max-[320px]:py-1.5 max-[320px]:text-xs"
                      disabled={deleting}
                    />
                  </div>

                  {/* Delete Confirmation Buttons */}
                  <div className="flex flex-row gap-2 sm:gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText("");
                        setError(null);
                      }}
                      disabled={deleting}
                      className="flex-1 bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-lg sm:rounded-xl font-medium transition-all border border-gray-200/50 dark:border-gray-600/50 disabled:opacity-50 text-sm"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting || deleteConfirmText !== trip.name}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 px-4 rounded-lg sm:rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
                    >
                      {deleting ? (
                        <>
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Delete Trip</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Form View */
                <>
                  {/* Trip Name */}
                  <div className="space-y-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                      Trip Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-2 py-2 sm:px-3 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm max-[320px]:px-2 max-[320px]:py-1.5 max-[320px]:text-xs"
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
                      className="w-full px-2 py-2 sm:px-3 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm max-[320px]:px-2 max-[320px]:py-1.5 max-[320px]:text-xs"
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
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                        Start Date
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <CalendarIcon className="w-4 h-4 text-green-500" />
                        </div>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 dark:text-white text-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                        End Date
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <CalendarIcon className="w-4 h-4 text-cyan-500" />
                        </div>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          className="w-full pl-10 pr-3 py-3 sm:py-2.5 bg-white/70 dark:bg-gray-700/70 border border-white/30 dark:border-gray-600/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-gray-900 dark:text-white text-sm"
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
                  <div className="space-y-3 pt-3 sm:pt-4">
                    {/* Update and Cancel buttons - same line */}
                    <div className="flex gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 text-gray-800 dark:text-gray-200 py-2.5 px-4 rounded-lg sm:rounded-xl font-medium transition-all border border-gray-200/50 dark:border-gray-600/50 disabled:opacity-50 text-sm"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !name.trim() || !hasChanges}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2.5 px-4 rounded-lg sm:rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
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

                    {/* Delete button - separate line below, only show for admins */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading}
                        className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 py-2.5 px-4 rounded-lg sm:rounded-xl font-medium transition-all border border-red-200 dark:border-red-800 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                      >
                        <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Delete Trip</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTripModal;
