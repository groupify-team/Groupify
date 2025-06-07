import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase/config';
import { createFaceProfile } from '../../services/faceRecognition';
import { saveFaceProfileToStorage, deleteFaceProfileFromStorage } from '../../services/firebase/faceProfiles';
import { useAuth } from '../../contexts/AuthContext';

const FaceProfileManager = ({ onProfileLoaded }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth(); // Get current user from context

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

  // Enhanced authentication check
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
      // Continue anyway
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
      // Check if it's a CORS-related error
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
      // Continue anyway since the face profile is created in memory
    }

    setSelectedFiles([]);
    setProgress({
      type: 'completed',
      phase: 'Face profile created successfully!',
      descriptorsCreated: profileData.descriptors.length,
      avgQuality: profileData.metadata.avgQuality,
      successRate: profileData.metadata.successRate
    });

    // Notify parent component
    if (onProfileLoaded) {
      onProfileLoaded(true);
    }

  } catch (error) {
    console.error('Failed to create profile:', error);
    
    // Provide user-friendly error messages
    let userMessage = error.message;
    
    if (error.message.includes('User not authenticated')) {
      userMessage = 'Authentication error. Please refresh the page and try again.';
    } else if (error.message.includes('No faces detected')) {
      userMessage = 'No faces could be detected in your photos. Please try with clearer, well-lit photos where your face is clearly visible.';
    } else if (error.message.includes('Upload failed')) {
      userMessage = 'Failed to upload photos. Please check your internet connection and try again.';
    } else if (error.message.includes('Network access issue')) {
      userMessage = error.message; // Already user-friendly
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
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Create Your Face Profile
        </h3>
        <p className="text-sm text-gray-600">
          Upload 3-5 clear photos of yourself for best results. Make sure your face is clearly visible in each photo.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Authentication Status */}
      {currentUser ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
          ✅ Logged in as: {currentUser.email}
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          ❌ Not authenticated - please refresh the page
        </div>
      )}

      {!uploading ? (
        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Photos (2-10 recommended)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={!currentUser}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {selectedFiles.length > 0 && (
              <p className="mt-2 text-sm text-green-600">
                ✅ {selectedFiles.length} photos selected
              </p>
            )}
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Selected Photos:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                      onLoad={() => URL.revokeObjectURL(file)}
                    />
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                      {file.name.length > 12 ? file.name.substring(0, 12) + '...' : file.name}
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!currentUser ? 'Please log in first' : `Create Face Profile (${selectedFiles.length} photos)`}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress Information */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Creating Profile</span>
              {progress?.total > 0 && (
                <span className="font-medium">{getProgressPercentage()}%</span>
              )}
            </div>
            {progress?.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            )}
          </div>

          {/* Status Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-gray-800">
              {progress?.phase || 'Processing...'}
            </div>
            
            {progress?.profileInfo && (
              <div className="text-xs text-blue-600">
                Processing {progress.profileInfo.references} reference photos
              </div>
            )}
            
            {progress?.current > 0 && progress?.total > 0 && (
              <div className="text-xs text-gray-600">
                Photo {progress.current} of {progress.total}
              </div>
            )}
          </div>

          {/* Completion Status */}
          {progress?.type === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm font-medium text-green-800 mb-2">
                🎉 Face Profile Created Successfully!
              </div>
              <div className="text-xs text-green-600 space-y-1">
                <div>Descriptors created: {progress.descriptorsCreated}</div>
                <div>Average quality: {(progress.avgQuality * 100).toFixed(1)}%</div>
                <div>Success rate: {progress.successRate}%</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Tips for Best Results:</h4>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Use photos where your face is clearly visible and well-lit</li>
          <li>• Include photos from different angles and expressions</li>
          <li>• Avoid photos with sunglasses or face coverings</li>
          <li>• Higher quality photos will improve recognition accuracy</li>
        </ul>
      </div>
    </div>
  );
};

export default FaceProfileManager;