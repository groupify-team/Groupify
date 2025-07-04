import React, { useState } from "react";
import {
  XMarkIcon,
  PhotoIcon,
  CheckIcon,
  TrashIcon,
  EyeIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

const AllPhotosModal = ({
  isOpen,
  photos,
  maxPhotos,
  isAdmin,
  selectMode: externalSelectMode,
  selectedPhotos: externalSelectedPhotos,
  onClose,
  onPhotoSelect,
  onToggleSelectMode,
  onSelectPhoto,
  onDeleteSelected,
  onRandomPhoto,
}) => {
  const [localSelectMode, setLocalSelectMode] = useState(false);
  const [localSelectedPhotos, setLocalSelectedPhotos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, name

  const fixPhotoUrl = (url) => {
    return url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );
  };

  // Use local state for selection
  const selectMode = localSelectMode;
  const selectedPhotos = localSelectedPhotos;

  const toggleSelectMode = () => {
    setLocalSelectMode(!localSelectMode);
    setLocalSelectedPhotos([]);
  };

  const togglePhotoSelection = (photoId) => {
    setLocalSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotos.length === filteredPhotos.length) {
      setLocalSelectedPhotos([]);
    } else {
      setLocalSelectedPhotos(filteredPhotos.map((p) => p.id));
    }
  };

  const handleExportPhotos = () => {
    const photosToExport = selectMode
      ? photos.filter((p) => selectedPhotos.includes(p.id))
      : filteredPhotos;

    photosToExport.forEach((photo, index) => {
      const link = document.createElement("a");
      link.href = fixPhotoUrl(photo.downloadURL);
      link.download = photo.fileName || `photo-${index + 1}.jpg`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Filter and sort photos
  const filteredPhotos = photos
    .filter((photo) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        photo.fileName?.toLowerCase().includes(searchLower) ||
        new Date(photo.uploadedAt).toLocaleDateString().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        case "oldest":
          return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        case "name":
          return (a.fileName || "").localeCompare(b.fileName || "");
        default:
          return 0;
      }
    });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          setLocalSelectMode(false);
          setLocalSelectedPhotos([]);
          setSearchTerm("");
        }
      }}
    >
      <div
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl shadow-2xl max-w-7xl max-h-[90vh] overflow-hidden w-full border border-white/20 dark:border-gray-700/50 animate-slide-in-scale flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 border-b border-purple-200/30 dark:border-purple-800/30 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Title and Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <PhotoIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  Trip Gallery
                </h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                    {filteredPhotos.length} Photos
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round((photos.length / maxPhotos) * 100)}% storage
                    used
                  </span>
                  {selectMode && selectedPhotos.length > 0 && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                      {selectedPhotos.length} selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                onClose();
                setLocalSelectMode(false);
                setLocalSelectedPhotos([]);
                setSearchTerm("");
              }}
              className="self-end sm:self-auto w-10 h-10 flex items-center justify-center transition-all duration-300 hover:scale-110 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search photos by name or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/70 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white/70 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Name</option>
            </select>

            {/* View Mode Toggle */}
            <div className="relative flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <div
                className={`absolute top-1 bottom-1 w-8 bg-white dark:bg-gray-600 rounded-lg shadow-sm transition-all duration-300 ease-in-out transform ${
                  viewMode === "grid" ? "translate-x-0" : "translate-x-8"
                }`}
              />
              <button
                onClick={() => setViewMode("grid")}
                className="relative z-10 p-2 rounded-lg transition-all duration-300"
              >
                <Squares2X2Icon
                  className={`w-4 h-4 transition-colors duration-300 ${
                    viewMode === "grid"
                      ? "text-gray-700 dark:text-gray-200"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="relative z-10 p-2 rounded-lg transition-all duration-300"
              >
                <EyeIcon
                  className={`w-4 h-4 transition-colors duration-300 ${
                    viewMode === "list"
                      ? "text-gray-700 dark:text-gray-200"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-gray-50/80 dark:bg-gray-700/50 border-b border-gray-200/30 dark:border-gray-600/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Actions */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={toggleSelectMode}
                  className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                    selectMode
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                      : "bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 dark:from-gray-600 dark:to-gray-700 dark:text-gray-200"
                  }`}
                >
                  <Cog6ToothIcon className="w-4 h-4 inline mr-2" />
                  {selectMode ? "Cancel" : "Manage"}
                </button>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {selectMode && (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg font-medium transition-all text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    {selectedPhotos.length === filteredPhotos.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>

                  {selectedPhotos.length > 0 && (
                    <button
                      onClick={() => {
                        // Handle delete logic here
                      }}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete ({selectedPhotos.length})
                    </button>
                  )}
                </>
              )}

              <button
                onClick={handleExportPhotos}
                disabled={selectMode && selectedPhotos.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export{" "}
                {selectMode && selectedPhotos.length > 0
                  ? `(${selectedPhotos.length})`
                  : "All"}
              </button>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredPhotos.length === 0 ? (
            /* Empty State */
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PhotoIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? "No photos found" : "No photos yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Upload photos to start your gallery"}
                </p>
              </div>
            </div>
          ) : (
            /* Photos Grid */
            <div className="p-6">
              <div
                className={`transition-all duration-500 ease-in-out ${
                  viewMode === "grid"
                    ? "grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3"
                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                }`}
              >
                {" "}
                {filteredPhotos.map((photo, index) => {
                  const isSelected = selectedPhotos.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      className={`relative aspect-square cursor-pointer rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-1 group ${
                        selectMode && !isSelected
                          ? "opacity-60 hover:opacity-80"
                          : ""
                      } ${
                        isSelected
                          ? "ring-3 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800 scale-105"
                          : ""
                      }`}
                      onClick={() => {
                        if (selectMode) {
                          togglePhotoSelection(photo.id);
                        } else {
                          onPhotoSelect(photo);
                          onClose();
                        }
                      }}
                    >
                      <img
                        src={fixPhotoUrl(photo.downloadURL)}
                        alt={photo.fileName}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                      />

                      {/* Selection Indicator */}
                      {selectMode && (
                        <div className="absolute top-2 right-2 w-6 h-6 border-2 border-white rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all">
                          {isSelected && (
                            <CheckIcon className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                      )}

                      {/* Photo Number Badge */}
                      {!selectMode && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-bold">
                          #{index + 1}
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-1 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg flex items-end">
                        <div className="p-2 w-full">
                          <div className="flex items-center justify-between text-white">
                            <span className="text-xs">
                              {new Date(photo.uploadedAt).toLocaleDateString()}
                            </span>
                            <EyeIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllPhotosModal;
