import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadFaceProfileImages, saveFaceProfile } from '../../services/firebase/faceProfiles';
import { createFaceProfile } from '../../services/faceRecognition';
import { CameraIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FaceProfileSetup = ({ isOpen, onClose, onProfileCreated }) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({
    phase: '',
    current: 0,
    total: 0,
    type: ''
  });
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [error, setError] = useState('');

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Limit to 5 images max
    const limitedFiles = files.slice(0, 5);
    
    // Validate file types
    const validFiles = limitedFiles.filter(file => 
      file.type.startsWith('image/') && file.size < 10 * 1024 * 1024 // 10MB limit
    );
    
    if (validFiles.length !== limitedFiles.length) {
      setError('Some files were skipped. Only images under 10MB are allowed.');
    } else {
      setError('');
    }
    
    setSelectedImages(prev => [...prev, ...validFiles].slice(0, 5));
    
    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls].slice(0, 5));
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setVideoStream(stream);
        setShowCamera(true);
      }
    } catch (err) {
      console.error('❌ Failed to start camera:', err);
      setError('Could not access camera. Please use file upload instead.');
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], `face-capture-${Date.now()}.jpg`, { 
        type: 'image/jpeg' 
      });
      
      if (selectedImages.length < 5) {
        setSelectedImages(prev => [...prev, file]);
        setPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);
      }
      
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  // Stop camera
  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setShowCamera(false);
  };

  // Remove image
  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]); // Clean up blob URL
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handle progress updates
  const handleProgress = (progressData) => {
    setProgress(progressData);
  };

  // Create face profile
  const handleCreateProfile = async () => {
    if (selectedImages.length === 0) {
      setError('Please select at least one clear photo of your face');
      return;
    }

    setIsProcessing(true);
    setError('');
    
    try {
      // Step 1: Upload images to Firebase Storage
      console.log('📤 Uploading face profile images...');
      const uploadedImages = await uploadFaceProfileImages(
        currentUser.uid,
        selectedImages,
        handleProgress
      );

      // Step 2: Create face profile with AI analysis
      console.log('🤖 Creating AI face profile...');
      const imageUrls = uploadedImages.map(img => img.url);
      const faceProfile = await createFaceProfile(
        currentUser.uid,
        imageUrls,
        handleProgress
      );

      // Step 3: Save profile metadata to Firestore
      console.log('💾 Saving face profile...');
      await saveFaceProfile(currentUser.uid, faceProfile, uploadedImages);

      // Success!
      setProgress({
        type: 'success',
        phase: 'Face profile created successfully!',
        profileData: {
          references: faceProfile.descriptors.length,
          avgQuality: (faceProfile.metadata.avgQuality * 100).toFixed(1),
          successRate: faceProfile.metadata.successRate
        }
      });

      setTimeout(() => {
        onProfileCreated(faceProfile);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('❌ Failed to create face profile:', error);
      setError(`Failed to create face profile: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Setup Face Profile</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add 2-5 clear photos of your face for better recognition accuracy
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-10">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 rounded-lg object-cover bg-black"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={capturePhoto}
                  disabled={selectedImages.length >= 5}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium"
                >
                  📸 Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">📋 Tips for best results:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use clear, well-lit photos of your face</li>
              <li>• Include different angles and expressions</li>
              <li>• Avoid sunglasses, masks, or heavy shadows</li>
              <li>• 2-5 photos work best (more isn't always better)</li>
            </ul>
          </div>

          {/* Upload Options */}
          {!isProcessing && selectedImages.length < 5 && (
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <PhotoIcon className="w-6 h-6 text-gray-400" />
                <span className="text-gray-600 font-medium">Upload Photos</span>
              </button>
              
              <button
                onClick={startCamera}
                className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <CameraIcon className="w-6 h-6 text-gray-400" />
                <span className="text-gray-600 font-medium">Take Photos</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview Images */}
          {previewUrls.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">
                Selected Photos ({selectedImages.length}/5)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Face ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      disabled={isProcessing}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-800 mb-2">
                  {progress.phase}
                </div>
                
                {progress.total > 0 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      {progress.current} / {progress.total}
                    </div>
                  </>
                )}
              </div>

              {progress.type === 'success' && progress.profileData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-800 mb-2">
                    ✅ Face Profile Created Successfully!
                  </div>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>References created: {progress.profileData.references}</div>
                    <div>Average quality: {progress.profileData.avgQuality}%</div>
                    <div>Success rate: {progress.profileData.successRate}%</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleCreateProfile}
              disabled={selectedImages.length === 0 || isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-6 rounded-lg font-medium"
            >
              {isProcessing ? 'Creating Profile...' : 
               selectedImages.length === 0 ? 'Select Photos First' :
               `Create Profile (${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceProfileSetup;