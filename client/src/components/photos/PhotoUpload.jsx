import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadPhoto } from '../../services/firebase/storage';
import { storage } from '../../services/firebase/config';
console.log('🔍 STORAGE:', storage);

const PhotoUpload = ({ tripId, onPhotoUploaded }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const uploadedPhotos = [];
      let completed = 0;

      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} is not an image. Only images are allowed.`);
          continue;
        }

const uploadedPhoto = await uploadPhoto(
  file,
  tripId,
  currentUser.uid,
  {
    originalName: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  },
  (percent) => {
    const overall = Math.round(((completed + percent / 100) / selectedFiles.length) * 100);
    setUploadProgress(overall);
  }
);

        uploadedPhotos.push(uploadedPhoto);
        completed++;
        setUploadProgress(Math.round((completed / selectedFiles.length) * 100));
      }

      setSelectedFiles([]);
      setUploadProgress(0);

      if (onPhotoUploaded && uploadedPhotos.length > 0) {
        onPhotoUploaded(uploadedPhotos);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      setError('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Upload Photos</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Photos</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
          disabled={uploading}
        />
        <p className="mt-1 text-sm text-gray-500">
          {selectedFiles.length > 0
            ? `${selectedFiles.length} file(s) selected`
            : 'JPG, PNG, or GIF files up to 10MB'}
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex justify-between">
                <span>{file.name}</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Upload Photos'}
      </button>
    </div>
  );
};

export default PhotoUpload;
