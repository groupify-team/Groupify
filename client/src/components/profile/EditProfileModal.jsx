import React, { useState, useEffect, useRef } from "react";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../services/firebase/config";
import { updateEmail, updatePassword } from "firebase/auth";
import ProfileImageCropper from "./ProfileImageCropper";
import { useAuth } from "../../contexts/AuthContext";
import {
  CameraIcon,
  PlusIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

const EditProfileModal = ({ isOpen, onClose }) => {
  // Form states - keeping your exact original structure
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState(null);

  // Image upload & crop states - keeping your exact original structure
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rawImage, setRawImage] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { updateUserProfile, setCurrentUser } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  // New UI state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Load user data when modal opens - keeping your exact logic
  useEffect(() => {
    const loadUserData = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setDisplayName(data.displayName || "");
        setEmail(data.email || "");
        setBirthdate(data.birthdate || "");
        setPreviewUrl(data.photoURL || null); // This will load your actual profile photo
        if (data.gender) {
          setGender(data.gender);
        }
      }
    };

    if (isOpen) {
      loadUserData();
      setError("");
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Camera functionality - keeping your exact logic
  useEffect(() => {
    const startCamera = async () => {
      if (showCamera && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setVideoStream(stream);
          console.log("🎥 Camera started successfully");
        } catch (err) {
          console.error("❌ Failed to start camera:", err);
          setError("Could not access camera");
        }
      }
    };

    startCamera();
  }, [showCamera]);

  // Handle raw file selection and open cropper - keeping your exact logic
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRawImage(URL.createObjectURL(file));
      setCropping(true);
    }
  };

  // Receive cropped image blob and preview URL from cropper - keeping your exact logic
  const handleCropComplete = (blob, fileUrl) => {
    console.log("📸 Received blob from cropper:", blob);
    setProfileImage(blob);
    setPreviewUrl(fileUrl);
    setCropping(false);
  };

  // Upload the blob to Firebase Storage - keeping your exact logic
  const handleImageUpload = async () => {
    if (!profileImage) {
      console.log("⚠️ No profile image selected");
      return null;
    }

    console.log("⏫ Uploading profile image...");
    const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, profileImage);
    const url = await getDownloadURL(storageRef);
    console.log("✅ Image uploaded:", url);
    return url;
  };

  const handleCaptureFromCamera = () => {
    setShowCamera(true);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "captured.jpg", { type: "image/jpeg" });
      setRawImage(URL.createObjectURL(file));
      setCropping(true);
      stopCamera();
    }, "image/jpeg");
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setShowCamera(false);
  };

  const cancelCamera = () => {
    stopCamera();
    setCapturedPhoto(null);
  };

  // Save all profile data - keeping your exact logic
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);
      const updates = { displayName, birthdate, gender };

      if (email !== user.email) {
        try {
          await updateEmail(user, email);
          updates.email = email;
        } catch (error) {
          if (error.code === "auth/requires-recent-login") {
            setError("Please re-login to update your email.");
            setLoading(false);
            return;
          } else {
            throw error;
          }
        }
      }

      if (password) {
        try {
          await updatePassword(user, password);
        } catch (error) {
          if (error.code === "auth/requires-recent-login") {
            setError("Please re-login to update your password.");
            setLoading(false);
            return;
          } else {
            throw error;
          }
        }
      }

      const imageUrl = await handleImageUpload();
      if (imageUrl) {
        updates.photoURL = imageUrl;
        await updateUserProfile({ photoURL: imageUrl });
        setCurrentUser((prev) => ({ ...prev, photoURL: imageUrl }));
      }

      await updateDoc(userRef, updates);
      setSuccessMessage("Profile updated successfully! ✨");
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000); // Show success message for 2 seconds before closing
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Don't render modal if it's closed
  if (!isOpen) return null;

  return (
    <>
      {/* Camera Modal - Enhanced UI */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-4 w-[400px]">
            <div className="flex items-center justify-between w-full mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                Take a Photo
              </h3>
              <button
                onClick={cancelCamera}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 rounded-xl object-cover border bg-black shadow-inner"
            />
            <div className="flex gap-3 w-full">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <CameraIcon className="w-5 h-5" />
                Capture Photo
              </button>
              <button
                onClick={cancelCamera}
                className="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper - keeping your exact component */}
      {cropping && (
        <ProfileImageCropper
          imageSrc={rawImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropping(false)}
        />
      )}

      {/* Main Modal - Enhanced UI but keeping your exact layout */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl relative transform transition-all duration-300 scale-100 max-h-[85vh] overflow-hidden custom-scrollbar">
          {/* Header - Enhanced */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(85vh-4rem)]">
            {/* Error Message - Enhanced */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-fade-in">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            {/* Success Message */}
            {showSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                <p className="text-green-700 text-sm font-medium">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Profile Image Section - Centered at Top */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg bg-gradient-to-br from-indigo-100 to-purple-100 group-hover:shadow-xl transition-all duration-300">
                  <img
                    src={
                      previewUrl ||
                      "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Upload and Camera Buttons - Centered */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => document.getElementById("fileInput").click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  title="Upload from device"
                >
                  <PlusIcon className="w-4 h-4" />
                  Upload
                </button>

                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  title="Take a photo"
                >
                  <CameraIcon className="w-4 h-4" />
                  Camera
                </button>

                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <form onSubmit={handleSave} className="space-y-4">
                {/* Row 1 - Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                </div>

                {/* Row 2 - Password and Birthdate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave empty to keep current"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Row 3 - Gender Selection - keeping your exact logic */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <div className="flex gap-3">
                    {["male", "female", "other"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setGender(option)}
                        className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all duration-200 ${
                          gender === option
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md transform scale-105"
                            : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                        }`}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons - Enhanced */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
          border: none;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }

        .custom-scrollbar {
          overflow-y: overlay;
        }
      `}</style>
    </>
  );
};

export default EditProfileModal;
