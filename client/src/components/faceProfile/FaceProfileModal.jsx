import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createFaceProfile } from '../../services/faceRecognition';
import { saveFaceProfileToStorage } from '../../services/firebase/faceProfiles';
import { uploadBytes, getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../services/firebase/config';
import { 
  XMarkIcon, 
  CameraIcon, 
  PhotoIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const FaceProfileModal = ({ isOpen, onClose, onProfileCreated }) => {
  const { currentUser } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup function
  const cleanup = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError('');
    setSuccess(false);
    setProgress(null);
    stopCamera();
  };

  // Handle modal close
  const handleClose = () => {
    cleanup();
    onClose();
  };

  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      setError('Could not access camera. Please check permissions.');
      console.error('Camera error:', error);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      addFile(file);
    }, 'image/jpeg', 0.8);
  };

  // Add file to selection
  const addFile = (file) => {
    if (selectedFiles.length >= 10) {
      setError('Maximum 10 photos allowed');
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedFiles(prev => [...prev, file]);
    setPreviewUrls(prev => [...prev, url]);
    setError('');
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      addFile(file);
    });
  };

  // Remove photo
  const removePhoto = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files to Firebase Storage
  const uploadFiles = async (files) => {
    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = `profile_photos/${currentUser.uid}/${timestamp}_${index}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    });

    return await Promise.all(uploadPromises);
  };

  // Create face profile
  const handleCreateProfile = async () => {
    if (selectedFiles.length < 2) {
      setError('Please select at least 2 photos');
      return;
    }

    setIsCreating(true);
    setError('');
    
    try {
      // Upload files to Firebase Storage
      setProgress({ phase: 'Uploading photos...', current: 0, total: selectedFiles.length });
      const imageUrls = await uploadFiles(selectedFiles);

      // Create face profile using the service
      const profile = await createFaceProfile(currentUser.uid, imageUrls, (progressData) => {
        setProgress(progressData);
      });

      // Save profile metadata to Firebase
      await saveFaceProfileToStorage(currentUser.uid, {
        images: imageUrls.map((url, index) => ({
          url,
          uploadedAt: new Date().toISOString(),
          filename: selectedFiles[index].name
        })),
        createdAt: new Date().toISOString(),
        metadata: profile.metadata
      });

      setSuccess(true);
      setProgress({ phase: 'Face profile created successfully!', current: 100, total: 100 });
      
      // Call success callback
      if (onProfileCreated) {
        onProfileCreated(true);
      }

      // Auto-close after delay
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error creating face profile:', error);
      setError(error.message || 'Failed to create face profile');
    } finally {
      setIsCreating(false);
    }
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Handle video element when camera starts
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Face Profile
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Upload 2-10 clear photos of yourself for automatic recognition
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Authentication Status */}
          {currentUser && (
            <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-400">
                    Authenticated as {currentUser.displayName || currentUser.email}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Ready to create face profile
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-400">
                  Face profile created successfully! You can now use automatic photo recognition.
                </p>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {progress && (
            <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-blue-800 dark:text-blue-400">{progress.phase}</p>
              </div>
              {progress.current && progress.total && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Camera Section */}
          {showCamera && (
            <div className="bg-gray-50/50 dark:bg-gray-700/30 rounded-xl p-4 mb-6">
              <div className="text-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md mx-auto rounded-lg border border-gray-200 dark:border-gray-600"
                />
                <div className="flex gap-3 mt-4 justify-center">
                  <button
                    onClick={capturePhoto}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <CameraIcon className="w-4 h-4" />
                    Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Options */}
          {!showCamera && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isCreating}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <PhotoIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mb-3" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Upload Photos
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Select multiple photos from your device
                </p>
              </button>

              <button
                onClick={startCamera}
                disabled={isCreating}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <CameraIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mb-3" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Take Photos
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Use your camera to take photos
                </p>
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Selected Photos Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Selected Photos ({selectedFiles.length}/10)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      disabled={isCreating}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">
              📸 Tips for Best Results
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Upload 2-10 clear photos of yourself</li>
              <li>• Ensure your face is clearly visible and well-lit</li>
              <li>• Include photos from different angles and expressions</li>
              <li>• Avoid sunglasses, masks, or heavy shadows</li>
              <li>• Photos should be at least 200x200 pixels</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProfile}
              disabled={isCreating || selectedFiles.length < 2}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:shadow-none"
            >
              {isCreating ? 'Creating Profile...' : 'Create Face Profile'}
            </button>
          </div>
        </div>

        {/* Hidden Canvas for Camera Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default FaceProfileModal;