/**
 * Optimized PhotoGallery with Virtual Scrolling and Progressive Loading
 * This version uses virtual scrolling and lazy loading for maximum performance
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { toast } from "react-hot-toast";
import { uploadPhoto } from "@shared/services/firebase/storage";
import { useAuth } from "@/auth-area/hooks/useAuth";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import VirtualGrid from "@shared/components/VirtualGrid";
import ProgressiveImage from "@shared/components/ProgressiveImage";

import {
  PhotoIcon,
  EyeIcon,
  CameraIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const PhotoGallery = memo(
  ({
    photos = [],
    tripId,
    maxPhotos = 100,
    onPhotoSelect,
    onShowAllPhotos,
    onPhotoUploaded,
  }) => {
    const { currentUser } = useAuth();
    const [localPhotos, setLocalPhotos] = useState(photos);
    const [showModal, setShowModal] = useState(null); // 'upload'
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      setLocalPhotos(photos);
    }, [photos]);

    const fixPhotoUrl = useCallback((url) => {
      if (!url) return "";
      return url
        .replace(/&token=[^&]*/, "")
        .replace(/\?alt=media.*/, "?alt=media");
    }, []);

    // PERFORMANCE: Memoize displayed photos to prevent unnecessary re-renders
    const displayedPhotos = useMemo(() => {
      return localPhotos.slice(0, 8).map((photo) => ({
        ...photo,
        src: fixPhotoUrl(photo.url),
        alt: `Photo ${photo.id}`,
      }));
    }, [localPhotos, fixPhotoUrl]);

    // PERFORMANCE: Memoize available slots calculation
    const availableSlots = useMemo(() => {
      return Math.max(0, maxPhotos - localPhotos.length);
    }, [maxPhotos, localPhotos.length]);

    // PERFORMANCE: Memoize event handlers
    const handlePhotoClick = useCallback(
      (photo) => {
        if (onPhotoSelect) {
          onPhotoSelect(photo);
        }
      },
      [onPhotoSelect]
    );

    const handleShowAllPhotos = useCallback(() => {
      if (onShowAllPhotos) {
        onShowAllPhotos();
      }
    }, [onShowAllPhotos]);

    const handleUploadModalToggle = useCallback(() => {
      setShowModal(showModal === "upload" ? null : "upload");
    }, [showModal]);

    // PERFORMANCE: Memoize file upload handler
    const handleFileUpload = useCallback(
      async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setLoading(true);
        try {
          const uploadPromises = files.map((file) =>
            uploadPhoto(file, tripId, currentUser.uid, {}, (progress) => {
              console.log(`Upload progress: ${progress}%`);
            })
          );

          const uploadedPhotos = await Promise.all(uploadPromises);

          // Update local state
          setLocalPhotos((prev) => [...uploadedPhotos, ...prev]);

          // Notify parent
          if (onPhotoUploaded) {
            onPhotoUploaded(uploadedPhotos);
          }

          toast.success(`Successfully uploaded ${files.length} photo(s)!`);
          setShowModal(null);
        } catch (error) {
          console.error("Upload failed:", error);
          toast.error("Failed to upload photos. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      [tripId, currentUser.uid, onPhotoUploaded]
    );

    // PERFORMANCE: Memoize download handler
    const handleDownloadAll = useCallback(async () => {
      if (localPhotos.length === 0) return;

      setLoading(true);
      try {
        const zip = new JSZip();
        const downloadPromises = localPhotos.map(async (photo, index) => {
          const response = await fetch(fixPhotoUrl(photo.url));
          const blob = await response.blob();
          const extension = photo.fileName?.split(".").pop() || "jpg";
          zip.file(`photo_${index + 1}.${extension}`, blob);
        });

        await Promise.all(downloadPromises);
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `trip_photos_${tripId}.zip`);

        toast.success("Photos downloaded successfully!");
      } catch (error) {
        console.error("Download failed:", error);
        toast.error("Failed to download photos. Please try again.");
      } finally {
        setLoading(false);
      }
    }, [localPhotos, fixPhotoUrl, tripId]);

    // Custom render function for virtual grid
    const renderPhotoItem = useCallback(
      (photo) => (
        <div
          key={photo.id}
          className="relative group cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800"
          onClick={() => handlePhotoClick(photo)}
        >
          <ProgressiveImage
            src={photo.src}
            alt={photo.alt}
            className="w-full h-full object-cover"
            placeholderClassName="rounded-lg"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg">
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <EyeIcon className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>
      ),
      [handlePhotoClick]
    );

    if (localPhotos.length === 0) {
      return (
        <div className="relative group h-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <PhotoIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Photo Gallery
                </h2>
              </div>
              <button
                onClick={handleUploadModalToggle}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="font-medium">Upload Photos</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <CameraIcon className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Photos Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Start your journey by uploading some amazing photos from your
                trip!
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative group h-full">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/50 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <PhotoIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Photo Gallery
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {localPhotos.length} photo
                  {localPhotos.length !== 1 ? "s" : ""} • {availableSlots} slots
                  left
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadAll}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span className="font-medium">Download All</span>
              </button>

              <button
                onClick={handleUploadModalToggle}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="font-medium">Upload</span>
              </button>
            </div>
          </div>

          {/* Virtual Photo Grid */}
          <div className="flex-1 min-h-0">
            <VirtualGrid
              items={displayedPhotos}
              itemHeight={150}
              itemWidth={150}
              gap={12}
              className="h-full"
              renderItem={renderPhotoItem}
              onItemClick={handlePhotoClick}
            />
          </div>

          {/* View All Button */}
          {localPhotos.length > 8 && (
            <div className="mt-4 text-center">
              <button
                onClick={handleShowAllPhotos}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 font-medium"
              >
                <EyeIcon className="w-4 h-4" />
                View All {localPhotos.length} Photos
              </button>
            </div>
          )}

          {/* Upload Modal */}
          {showModal === "upload" && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upload Photos
                  </h3>
                  <button
                    onClick={handleUploadModalToggle}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Choose photos to upload
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

PhotoGallery.displayName = "PhotoGallery";

export default PhotoGallery;
