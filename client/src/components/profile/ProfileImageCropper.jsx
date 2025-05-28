import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import getCroppedImg from '../../utils/cropImage'; // Make sure this path is correct

const ProfileImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);

  // Called automatically when cropping interaction ends
  const handleCropAreaChange = useCallback((_, croppedAreaPixels) => {
    setCroppedPixels(croppedAreaPixels); // Save pixels to use on manual "Save"
  }, []);

  // Called when user clicks "Save" button
  const handleSaveClick = async () => {
    if (!croppedPixels) return;
    try {
      const { blob, fileUrl } = await getCroppedImg(imageSrc, croppedPixels);
      onCropComplete(blob, fileUrl); // Send back both blob and preview URL
    } catch (error) {
      console.error('❌ Failed to crop image:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow-md w-[90vw] max-w-md">
        {/* Image cropper area */}
        <div className="relative w-full h-64 bg-gray-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropAreaChange}
          />
        </div>

        {/* Zoom control */}
        <div className="mt-4">
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, newZoom) => setZoom(newZoom)}
          />
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileImageCropper;
