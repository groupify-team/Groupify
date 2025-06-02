import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getTrip,
  addTripMember,
  sendTripInvite,
} from "../services/firebase/trips";
import { getTripPhotos } from "../services/firebase/storage";
import PhotoUpload from "../components/photos/PhotoUpload";
import { getUserProfile } from "../services/firebase/users";
import InviteFriendDropdown from "../components/trips/InviteFriendDropdown";
import { collection, getDocs, query, where, doc } from "firebase/firestore";
import { db } from "../services/firebase/config";
import { compareFaces } from "../services/rekognitionService";

const TripDetail = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [trip, setTrip] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [loadingFaces, setLoadingFaces] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  const isMember = trip?.members?.includes(currentUser?.uid);
  const canFilterByFace = isMember && !!currentUser?.photoURL;
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);

  const handleToggleFaceFilter = () => {
    if (!canFilterByFace) {
      alert("Face filtering is only available for registered trip members.");
      return;
    }
    setFilterActive((prev) => !prev);
  };

  useEffect(() => {
    const fetchTripAndPhotos = async () => {
      try {
        setLoading(true);
        const tripData = await getTrip(tripId);
        setTrip(tripData);

        if (!tripData.members.includes(currentUser.uid)) {
          setError("You do not have access to this trip");
          setLoading(false);
          return;
        }

        const photos = await getTripPhotos(tripId);
        setPhotos(photos);

        if (tripData.members.length > 0) {
          const memberData = await Promise.all(
            tripData.members.map((uid) => getUserProfile(uid))
          );
          setMemberProfiles(memberData);
        }
      } catch (error) {
        console.error("Error fetching trip data:", error);
        setError("Failed to load trip data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (tripId && currentUser) {
      fetchTripAndPhotos();
    }
  }, [tripId, currentUser]);

  useEffect(() => {
    const filterPhotosByFace = async () => {
      if (!canFilterByFace || !photos.length || !filterActive) return;

      setLoadingFaces(true);
      const result = [];

      for (const photo of photos) {
        const isMatch = await compareFaces(
          currentUser.photoURL,
          photo.downloadURL
        );
        if (isMatch) result.push(photo);
      }

      setFilteredPhotos(result);
      setLoadingFaces(false);
    };

    filterPhotosByFace();
  }, [currentUser, photos, filterActive]);

  const handlePhotoUploaded = (uploadedPhotos) => {
    setPhotos((prev) => [...uploadedPhotos, ...prev]);

    if (trip) {
      setTrip((prevTrip) => ({
        ...prevTrip,
        photoCount: (prevTrip.photoCount || 0) + uploadedPhotos.length,
      }));
    }

    setShowUploadForm(false);
  };

  const handleInviteFriend = async (friend) => {
    try {
      const q = query(
        collection(db, "tripInvites"),
        where("tripId", "==", tripId),
        where("inviteeUid", "==", friend.uid),
        where("status", "==", "pending")
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        alert(`${friend.displayName} already has a pending invite.`);
        return;
      }

      await sendTripInvite(tripId, currentUser.uid, friend.uid);
      alert(`Invitation sent to ${friend.displayName}.`);
    } catch (error) {
      console.error("Error sending trip invite:", error);
      alert("Failed to send invitation.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading trip details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{trip.name}</h1>
              <p className="text-indigo-200 mt-1">
                {trip.location || "No location specified"}
              </p>
              <div className="flex mt-2 text-sm">
                <span className="mr-4 font-medium">
                  {trip.startDate || "No start date"}
                  {trip.startDate && trip.endDate && " - "}
                  {trip.endDate}
                </span>
                <span>{trip.members?.length || 1} members</span>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="bg-white text-indigo-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Trip Details</h2>
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {showUploadForm ? "Cancel Upload" : "Add Photos"}
                </button>
              </div>

              {trip.description ? (
                <p className="text-gray-700">{trip.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}

              <div className="text-sm text-gray-500 mt-2">
                {photos.length} photos
              </div>
            </div>

            {showUploadForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Upload Photos</h2>
                <PhotoUpload
                  tripId={tripId}
                  onPhotoUploaded={handlePhotoUploaded}
                />
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">All Trip Photos</h2>
                <button
                  onClick={() => setShowAllPhotosModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  All Photos
                </button>
              </div>
              <div className="flex overflow-x-auto space-x-4 pb-2">
                {photos.map((photo) => (
                  <div
                    key={`all-${photo.id}`}
                    className="flex-shrink-0 w-64 cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.downloadURL.replace(
                        "groupify-77202.appspot.com",
                        "groupify-77202.firebasestorage.app"
                      )}
                      alt={photo.fileName}
                      className="w-full h-40 object-cover rounded-lg shadow"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Uploaded {new Date(photo.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Photos With Me</h2>
                <button
                  onClick={handleToggleFaceFilter}
                  className={`px-4 py-2 text-sm rounded-md ${
                    canFilterByFace
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {filterActive ? "Hide Filter" : "Show Only My Face"}
                </button>
              </div>

              {loadingFaces ? (
                <p className="text-sm text-gray-500 mb-4">
                  Scanning photos for your face...
                </p>
              ) : filterActive && filteredPhotos.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No matching photos found.
                </p>
              ) : filterActive ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPhotos.map((photo) => (
                    <div
                      key={`filtered-${photo.id}`}
                      className="cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo.downloadURL.replace(
                          "groupify-77202.appspot.com",
                          "groupify-77202.firebasestorage.app"
                        )}
                        alt={photo.fileName}
                        className="w-full h-32 object-cover rounded-lg shadow"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Uploaded{" "}
                        {new Date(photo.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Click the button to filter photos that include your face.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Invite People</h2>
              <InviteFriendDropdown
                currentUser={currentUser}
                onSelect={handleInviteFriend}
                excludedUserIds={trip.members}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Trip Members</h2>
              {memberProfiles.length === 0 ? (
                <p className="text-gray-500 text-sm">No members found.</p>
              ) : (
                <ul className="space-y-3">
                  {memberProfiles
                    .slice()
                    .sort((a, b) => {
                      if (a.uid === currentUser.uid) return -1;
                      if (b.uid === currentUser.uid) return 1;
                      return (a.displayName || a.email || "").localeCompare(
                        b.displayName || b.email || ""
                      );
                    })
                    .map((member) => (
                      <li key={member.uid} className="flex items-center">
                        <img
                          src={
                            member.photoURL ||
                            "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                          }
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover border mr-3"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {member.displayName || member.email || member.uid}
                          {member.uid === currentUser.uid && " (Me)"}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setSelectedPhoto(null)}
          >
            <img
              src={selectedPhoto.downloadURL.replace(
                "groupify-77202.appspot.com",
                "groupify-77202.firebasestorage.app"
              )}
              alt="Full view"
              className="max-w-4xl max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        )}

        {showAllPhotosModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            onClick={() => setShowAllPhotosModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg max-w-6xl max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">All Trip Photos</h3>
                <button
                  onClick={() => setShowAllPhotosModal(false)}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div
                    key={`modal-${photo.id}`}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setShowAllPhotosModal(false);
                    }}
                  >
                    <img
                      src={photo.downloadURL.replace(
                        "groupify-77202.appspot.com",
                        "groupify-77202.firebasestorage.app"
                      )}
                      alt={photo.fileName}
                      className="w-full h-40 object-cover rounded-lg shadow"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Uploaded {new Date(photo.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetail;
