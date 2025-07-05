import React, { useState, useEffect, useRef } from "react";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../../../shared/services/firebase/config";
import { updateEmail, updatePassword, updateProfile } from "firebase/auth";
import ProfileImageCropper from "./ProfileImageCropper";
import { useAuth } from "../../../../auth-area/contexts/AuthContext";
import { useTheme } from "../../../../shared/contexts/ThemeContext";
import {
  CameraIcon,
  PlusIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  UserCircleIcon,
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
  const { currentUser, setCurrentUser } = useAuth();
  const { theme } = useTheme();
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  // New UI state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Create updateUserProfile function since it's not in your AuthContext
  const updateUserProfile = async (updates) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, updates);
    }
  };

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
      {/* Camera Modal - Enhanced with theme support */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl flex flex-col items-center space-y-4 w-[400px] border border-white/20 dark:border-gray-700/50">
            <div className="flex items-center justify-between w-full mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Take a Photo
              </h3>
              <button
                onClick={cancelCamera}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 rounded-xl object-cover border border-gray-200 dark:border-gray-600 bg-black shadow-inner"
            />
            <div className="flex gap-3 w-full">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <CameraIcon className="w-5 h-5" />
                Capture Photo
              </button>
              <button
                onClick={cancelCamera}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-all duration-200"
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

      {/* Main Modal - Redesigned with Dashboard styling */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-2xl rounded-2xl w-full max-w-2xl relative transform transition-all duration-300 scale-100 max-h-[90vh] overflow-hidden border border-white/20 dark:border-gray-700/50">
          {/* Header - Enhanced with glassmorphism */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-4 [@media(min-width:375px)]:px-6 py-2 [@media(min-width:375px)]:py-4 rounded-t-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2 [@media(min-width:375px)]:gap-3">
                <div className="w-6 h-6 [@media(min-width:375px)]:w-8 [@media(min-width:375px)]:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <UserCircleIcon className="w-4 h-4 [@media(min-width:375px)]:w-5 [@media(min-width:375px)]:h-5 text-white" />
                </div>
                <h2 className="text-lg [@media(min-width:375px)]:text-xl font-bold text-white">
                  Edit Profile
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1.5 [@media(min-width:375px)]:p-2 rounded-full hover:bg-white/20 backdrop-blur-sm"
              >
                <XMarkIcon className="w-4 h-4 [@media(min-width:375px)]:w-5 [@media(min-width:375px)]:h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(90vh-5rem)] bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30 dark:from-gray-900/30 dark:via-blue-900/30 dark:to-purple-900/30">
            {/* Error Message - Enhanced */}
            {error && (
              <div className="mb-4 p-4 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 animate-fade-in">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="mb-4 p-4 bg-green-50/80 dark:bg-green-900/30 backdrop-blur-sm border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-fade-in">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                <p className="text-green-700 dark:text-green-400 text-sm font-medium">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Profile Image Section - Left photo, right buttons */}
            <div className="flex items-center justify-center gap-6 mb-4">
              {/* Profile Photo - Left Side */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/50 dark:border-gray-600/50 shadow-2xl bg-gradient-to-br from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/50 dark:to-purple-900/50 group-hover:shadow-3xl transition-all duration-300 backdrop-blur-sm">
                  <img
                    src={
                      previewUrl ||
                      "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {/* Floating glow effect */}
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              </div>

              {/* Upload and Camera Buttons - Right Side, Stacked */}
              <div className="flex flex-col space-y-2 w-32">
                <button
                  type="button"
                  onClick={() => document.getElementById("fileInput").click()}
                  className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20"
                  title="Upload from device"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative flex items-center justify-center gap-2 px-3 py-2">
                    <PlusIcon className="w-4 h-4" />
                    <span className="text-xs font-semibold">Upload</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg backdrop-blur-sm border border-white/20"
                  title="Take a photo"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative flex items-center justify-center gap-2 px-3 py-2">
                    <CameraIcon className="w-4 h-4" />
                    <span className="text-xs font-semibold">Camera</span>
                  </div>
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

            {/* Form Fields - Enhanced with glassmorphism */}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Row 1 - Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Row 2 - Password and Birthdate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave empty to keep current"
                      className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Row 3 - Gender Selection - Enhanced */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["male", "female", "other"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setGender(option)}
                      className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
                        gender === option
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg transform scale-105"
                          : "bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons - Enhanced with glassmorphism */}
              <div className="flex gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-all duration-200 border border-gray-200/50 dark:border-gray-600/50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 disabled:hover:scale-100 backdrop-blur-sm flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfileModal;
