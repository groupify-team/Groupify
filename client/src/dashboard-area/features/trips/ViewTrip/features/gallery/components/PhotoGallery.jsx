import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { uploadPhoto } from "@shared/services/firebase/storage";
import { useAuth } from "@/auth-area/contexts/AuthContext";
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@shared/services/firebase/config";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import {
  PhotoIcon,
  EyeIcon,
  CameraIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const PhotoGallery = ({
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
  const [gridCols, setGridCols] = useState(6);

  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  useEffect(() => {
    const calculateGrid = () => {
      const width = window.innerWidth;
      setGridCols(width < 640 ? 4 : width < 768 ? 6 : width < 1024 ? 8 : 10);
    };
    calculateGrid();
    window.addEventListener("resize", calculateGrid);
    return () => window.removeEventListener("resize", calculateGrid);
  }, []);

  const fixPhotoUrl = (url) =>
    url.replace(
      "groupify-77202.appspot.com",
      "groupify-77202.firebasestorage.app"
    );

  const visiblePhotos = localPhotos.slice(0, gridCols - 1);
  const overflowCount = Math.max(0, localPhotos.length - visiblePhotos.length);

  const toggleSelection = (photoId) => {
    // This function is no longer needed since we removed select mode
  };

  const handleFileUpload = async (files) => {
    if (!files?.length || !tripId || !currentUser?.uid) return;

    const availableSlots = maxPhotos - localPhotos.length;
    if (availableSlots <= 0) {
      toast.error("Photo limit reached!");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    setLoading(true);
    const uploadedPhotos = [];

    try {
      const loadingToast = toast.loading(
        `Uploading ${filesToUpload.length} photos...`
      );

      for (const file of filesToUpload) {
        try {
          const photoData = await uploadPhoto(file, tripId, currentUser.uid);
          uploadedPhotos.push(photoData);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      toast.dismiss(loadingToast);

      if (uploadedPhotos.length > 0) {
        setLocalPhotos((prev) => [...uploadedPhotos, ...prev]);
        onPhotoUploaded?.(uploadedPhotos);
        toast.success(`${uploadedPhotos.length} photos uploaded!`);
        setShowModal(null);
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // Delete functionality moved to AllPhotosModal
  };

  const handleExport = async (type) => {
    // Export functionality moved to AllPhotosModal
  };

  const Modal = ({ children, onClose }) => (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 animate-slide-in-scale">
        {children}
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-900/30 dark:to-pink-900/30 p-4 border-b border-purple-200/30 dark:border-purple-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <PhotoIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Trip Gallery
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {localPhotos.length} photos •{" "}
                  {Math.max(0, maxPhotos - localPhotos.length)} slots left
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal("upload")}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4" />
                Add Photos
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {localPhotos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CameraIcon className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No photos yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                Start building your trip memories
              </p>
              <button
                onClick={() => setShowModal("upload")}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto"
              >
                <PlusIcon className="w-5 h-5" />
                Upload First Photos
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
              >
                {visiblePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square cursor-pointer group transition-all duration-200 hover:scale-105"
                    onClick={() => onPhotoSelect(photo)}
                  >
                    <img
                      src={fixPhotoUrl(photo.downloadURL)}
                      alt={photo.fileName}
                      className="w-full h-full object-cover rounded-lg"
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ))}

                {overflowCount > 0 && (
                  <div
                    className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center cursor-pointer hover:from-purple-200 hover:to-pink-200 transition-all"
                    onClick={onShowAllPhotos}
                  >
                    <div className="text-center">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        +{overflowCount}
                      </span>
                      <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                        more
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onShowAllPhotos}
                className="w-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 py-3 rounded-xl font-medium transition-all border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700"
              >
                View All {localPhotos.length} Photos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showModal === "upload" && (
        <Modal onClose={() => !loading && setShowModal(null)}>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Upload Photos</h3>
              {!loading && (
                <button
                  onClick={() => setShowModal(null)}
                  className="text-white hover:bg-white/20 p-1 rounded"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <div className="p-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
              <CameraIcon className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop photos here
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                or click to browse files
              </p>
              <label
                className={`bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium cursor-pointer transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Uploading..." : "Choose Files"}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={loading}
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default PhotoGallery;
