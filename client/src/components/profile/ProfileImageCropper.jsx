import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import { XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import getCroppedImg from '../../utils/cropImage'; // Make sure this path is correct

const ProfileImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Called automatically when cropping interaction ends
  const handleCropAreaChange = useCallback((_, croppedAreaPixels) => {
    setCroppedPixels(croppedAreaPixels); // Save pixels to use on manual "Save"
  }, []);

  // Called when user clicks "Save" button
  const handleSaveClick = async () => {
    if (!croppedPixels) return;
    
    setIsProcessing(true);
    try {
      const { blob, fileUrl } = await getCroppedImg(imageSrc, croppedPixels, rotation);
      onCropComplete(blob, fileUrl); // Send back both blob and preview URL
    } catch (error) {
      console.error('❌ Failed to crop image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset crop settings
  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Crop Profile Picture
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Adjust your image to look perfect
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image cropper area */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-600/50">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={handleCropAreaChange}
              style={{
                containerStyle: {
                  borderRadius: '1rem',
                },
                cropAreaStyle: {
                  border: '3px solid rgba(99, 102, 241, 0.8)',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
                },
              }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4 mt-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Zoom
                </label>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <div className="px-2">
                <Slider
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e, newZoom) => setZoom(newZoom)}
                  sx={{
                    color: '#6366f1',
                    height: 6,
                    '& .MuiSlider-track': {
                      border: 'none',
                      background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: '#e5e7eb',
                      opacity: 1,
                    },
                    '& .MuiSlider-thumb': {
                      height: 20,
                      width: 20,
                      backgroundColor: '#fff',
                      border: '3px solid #6366f1',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.5)',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Rotation
                </label>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                  {rotation}°
                </span>
              </div>
              <div className="px-2">
                <Slider
                  value={rotation}
                  min={-180}
                  max={180}
                  step={1}
                  onChange={(e, newRotation) => setRotation(newRotation)}
                  sx={{
                    color: '#8b5cf6',
                    height: 6,
                    '& .MuiSlider-track': {
                      border: 'none',
                      background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: '#e5e7eb',
                      opacity: 1,
                    },
                    '& .MuiSlider-thumb': {
                      height: 20,
                      width: 20,
                      backgroundColor: '#fff',
                      border: '3px solid #8b5cf6',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                      '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5)',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Reset button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-600/60 hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 border border-gray-200 dark:border-gray-500 shadow-sm hover:shadow-md"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Reset
            </button>

            <div className="flex items-center gap-2">
              {/* Cancel button */}
              <button
                onClick={onCancel}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              
              {/* Save button */}
              <button
                onClick={handleSaveClick}
                disabled={isProcessing || !croppedPixels}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Save
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

export default ProfileImageCropper;