// EditProfileModal.jsx
import React, { useState, useEffect } from "react";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../services/firebase/config";
import { updateEmail, updatePassword } from "firebase/auth";
import ProfileImageCropper from "./ProfileImageCropper";
import { useAuth } from "../../contexts/AuthContext";
import { useRef } from "react";
import { CameraIcon, PlusIcon } from "@heroicons/react/24/outline";

const EditProfileModal = ({ isOpen, onClose }) => {
  // Form states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState(null);

  // Image upload & crop states
  const [profileImage, setProfileImage] = useState(null); // This will hold the final cropped blob
  const [previewUrl, setPreviewUrl] = useState(null); // For showing cropped image in UI
  const [rawImage, setRawImage] = useState(null); // Uncropped image for Cropper
  const [cropping, setCropping] = useState(false); // Whether Cropper is active
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { updateUserProfile, setCurrentUser } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);

  // Load user data when modal opens
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
        setPreviewUrl(data.photoURL || null);
        if (data.gender) {
          setGender(data.gender);
        }
      }
    };

    if (isOpen) loadUserData();
  }, [isOpen]);

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

  // Handle raw file selection and open cropper
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRawImage(URL.createObjectURL(file));
      setCropping(true);
    }
  };

  // Receive cropped image blob and preview URL from cropper
  const handleCropComplete = (blob, fileUrl) => {
    console.log("📸 Received blob from cropper:", blob);
    setProfileImage(blob);
    setPreviewUrl(fileUrl);
    setCropping(false);
  };

  // Upload the blob to Firebase Storage and return the download URL
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

  // Save all profile data (including new image URL if changed)
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);
      const updates = { displayName, birthdate, gender }; // ✅ gender is now included

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
            throw error; // Let it go to the outer catch if it's another error
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
        updates.photoURL = imageUrl; // Update Firestore
        await updateUserProfile({ photoURL: imageUrl }); // Update Firebase Auth
        setCurrentUser((prev) => ({ ...prev, photoURL: imageUrl })); // Update local context
      }

      await updateDoc(userRef, updates); // ✅ update Firestore with all fields
      onClose();
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
      {showCamera && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center space-y-4 w-[320px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 rounded-xl object-cover border bg-black"
            />
            <button
              onClick={capturePhoto}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md shadow transition"
            >
              📸 Capture Photo
            </button>
            <button
              onClick={cancelCamera}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {cropping && (
        <ProfileImageCropper
          imageSrc={rawImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropping(false)}
        />
      )}

      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white shadow-2xl rounded-2xl px-8 py-6 w-full max-w-md relative animate-fade-in">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-5">
            Edit Your Profile
          </h2>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-6 space-y-3">
            <div className="relative w-28 h-28">
              <img
                src={
                  previewUrl ||
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                }
                alt="Profile"
                className="w-full h-full object-cover rounded-full border-4 border-gray-200 shadow-sm"
              />
            </div>

            {/* Upload and Camera Buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => document.getElementById("fileInput").click()}
                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center shadow-md transition"
                title="Upload from device"
              >
                <PlusIcon className="w-5 h-5 text-white" />
              </button>

              <button
                type="button"
                onClick={handleCaptureFromCamera}
                className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-md transition"
                title="Take a photo"
              >
                <CameraIcon className="w-5 h-5 text-white" />
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
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty to keep current"
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Gender Selection */}
            <div className="flex items-center justify-between w-full">
              <label className="text-sm font-semibold text-gray-700">
                Gender
              </label>
              <div className="flex space-x-3 justify-center flex-1 ml-[-20px]">
                {["male", "female", "other"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGender(option)}
                    className={`px-4 py-1 rounded-full border text-sm font-medium transition-all ${
                      gender === option
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Birthdate
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default EditProfileModal;
