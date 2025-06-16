import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase/config';
import { createFaceProfile } from '../../services/faceRecognition';
import { saveFaceProfileToStorage, deleteFaceProfileFromStorage } from '../../services/firebase/faceProfiles';
import { useAuth } from '../../contexts/AuthContext';
import {
  CameraIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PhotoIcon,
  UserCircleIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const FaceProfileManager = ({ onProfileLoaded }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      setError('Only image files are allowed');
      return;
    }

    if (validFiles.length < 2) {
      setError('Please select at least 2 photos for better accuracy');
      return;
    }

    if (validFiles.length > 10) {
      setError('Please select no more than 10 photos');
      return;
    }

    setSelectedFiles(validFiles);
    setError(null);
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const uploadFiles = async (files, userId) => {
    if (!userId) {
      throw new Error('User ID is required for uploading files');
    }

    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `profile_photos/${userId}/${timestamp}_${index}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return {
          url: downloadURL,
          fileName: file.name,
          uploadedAt: timestamp
        };
      } catch (uploadError) {
        console.error(`Failed to upload ${file.name}:`, uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }
    });
    
    return await Promise.all(uploadPromises);
  };

  const createProfile = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select photos first');
      return;
    }

    if (!currentUser || !currentUser.uid) {
      setError('You must be logged in to create a face profile. Please refresh the page and try again.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress({ type: 'initializing', phase: 'Starting profile creation...' });

    try {
      const userId = currentUser.uid;

      // Clean up any existing corrupted profile first
      try {
        await deleteFaceProfileFromStorage(userId);
      } catch (cleanupError) {
        console.warn('Could not clean up existing profile:', cleanupError);
      }

      // Upload files to Firebase Storage
      setProgress({ type: 'uploading', phase: 'Uploading photos...' });
      
      let uploadedImages;
      try {
        uploadedImages = await uploadFiles(selectedFiles, userId);
      } catch (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      // Extract URLs for face recognition
      const imageUrls = uploadedImages.map(img => img.url);

      // Create face profile with enhanced error handling
      setProgress({ type: 'processing', phase: 'Creating face profile...' });
      
      let profileData;
      try {
        profileData = await createFaceProfile(
          userId,
          imageUrls,
          (progressData) => {
            setProgress({
              ...progressData,
              phase: progressData.phase || 'Processing...'
            });
          }
        );
      } catch (faceError) {
        if (faceError.message.includes('CORS') || faceError.message.includes('Failed to fetch') || faceError.message.includes('No accessible images')) {
          throw new Error('Network access issue detected. This is common in development mode. Please try: 1) Refresh the page and try again, 2) Check your internet connection, 3) Try uploading different photos.');
        } else {
          throw new Error(`Face recognition failed: ${faceError.message}`);
        }
      }

      if (!profileData || !profileData.descriptors || profileData.descriptors.length === 0) {
        throw new Error('No faces could be detected in the uploaded photos. Please try with clearer images where your face is clearly visible.');
      }

      // Save profile metadata to Firebase
      setProgress({ type: 'saving', phase: 'Saving profile...' });
      
      try {
        await saveFaceProfileToStorage(userId, {
          images: uploadedImages,
          createdAt: Date.now(),
          descriptorCount: profileData.descriptors.length,
          avgQuality: profileData.metadata.avgQuality,
          successRate: profileData.metadata.successRate
        });
      } catch (storageError) {
        console.warn('Failed to save profile metadata to storage:', storageError);
      }

      setSelectedFiles([]);
      setProgress({
        type: 'completed',
        phase: 'Face profile created successfully!',
        descriptorsCreated: profileData.descriptors.length,
        avgQuality: profileData.metadata.avgQuality,
        successRate: profileData.metadata.successRate
      });

      if (onProfileLoaded) {
        onProfileLoaded(true);
      }

    } catch (error) {
      console.error('Failed to create profile:', error);
      
      let userMessage = error.message;
      
      if (error.message.includes('User not authenticated')) {
        userMessage = 'Authentication error. Please refresh the page and try again.';
      } else if (error.message.includes('No faces detected')) {
        userMessage = 'No faces could be detected in your photos. Please try with clearer, well-lit photos where your face is clearly visible.';
      } else if (error.message.includes('Upload failed')) {
        userMessage = 'Failed to upload photos. Please check your internet connection and try again.';
      } else if (error.message.includes('Network access issue')) {
        userMessage = error.message;
      } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        userMessage = 'Network configuration issue. Please try refreshing the page or contact support if the issue persists.';
      }
      
      setError(userMessage);
    } finally {
      setUploading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <UserCircleIcon className="w-10 h-10 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your Face Profile
          </h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Upload 3-5 clear photos of yourself for best results. Make sure your face is clearly visible in each photo.
          </p>
        </div>
      </div>

      {/* Authentication Status */}
      <div className={`p-4 rounded-2xl border backdrop-blur-sm ${
        currentUser 
          ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">Authenticated</p>
                <p className="text-sm text-green-600 dark:text-green-400">{currentUser.email}</p>
              </div>
            </>
          ) : (
            <>
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-300">Not authenticated</p>
                <p className="text-sm text-red-600 dark:text-red-400">Please refresh the page</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-300 mb-1">Error</h4>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!uploading ? (
        <div className="space-y-6">
          {/* File Selection */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Photos
            </label>
            
            {/* Custom File Input */}
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={!currentUser}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                  currentUser
                    ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 cursor-pointer'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 cursor-not-allowed opacity-50'
                }`}
              >
                <CloudArrowUpIcon className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {currentUser ? 'Click to upload photos' : 'Please log in first'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  2-10 photos recommended • PNG, JPG, JPEG
                </p>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 p-3 bg-green-50/50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    {selectedFiles.length} photos selected
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Selected Photos
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedFiles.length} of 10
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onLoad={() => URL.revokeObjectURL(file)}
                      />
                    </div>
                    
                    {/* File name overlay */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg truncate">
                        {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                    >
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                    
                    {/* Photo index */}
                    <div className="absolute top-2 left-2 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Profile Button */}
          <button
            onClick={createProfile}
            disabled={selectedFiles.length === 0 || !currentUser}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            <SparklesIcon className="w-6 h-6" />
            {!currentUser ? 'Please log in first' : `Create Face Profile (${selectedFiles.length} photos)`}
          </button>
        </div>
      ) : (
        /* Progress Section */
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
                <CameraIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Creating Your Face Profile
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we process your photos...
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {progress?.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {getProgressPercentage()}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status Information */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {progress?.phase || 'Processing...'}
                </span>
              </div>
              
              {progress?.profileInfo && (
                <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3">
                  Processing {progress.profileInfo.references} reference photos
                </div>
              )}
              
              {progress?.current > 0 && progress?.total > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
                  Photo {progress.current} of {progress.total}
                </div>
              )}
            </div>
          </div>

          {/* Completion Status */}
          {progress?.type === 'completed' && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-sm border border-green-200 dark:border-green-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
                    🎉 Face Profile Created Successfully!
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-700 dark:text-green-400">
                        {progress.descriptorsCreated}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-500">
                        Descriptors
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-700 dark:text-green-400">
                        {(progress.avgQuality * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-500">
                        Avg Quality
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-700 dark:text-green-400">
                        {progress.successRate}%
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-500">
                        Success Rate
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <EyeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
              💡 Tips for Best Results
            </h4>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                Use photos where your face is clearly visible and well-lit
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                Include photos from different angles and expressions
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                Avoid photos with sunglasses or face coverings
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                Higher quality photos will improve recognition accuracy
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceProfileManager;