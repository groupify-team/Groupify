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
import { getFriends } from "../services/firebase/users";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase/config";

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

        const tripPhotos = await getTripPhotos(tripId);
        setPhotos(tripPhotos);

        if (tripData.members && tripData.members.length > 0) {
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
      console.log("📨 Trying to send invite with values:");
      console.log("tripId:", tripId);
      console.log("inviterUid (currentUser.uid):", currentUser?.uid);
      console.log("inviteeUid (friend.uid):", friend?.uid);
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
      console.log("📨 Sending invite", {
        tripId,
        inviterUid: currentUser.uid,
        inviteeUid: friend.uid,
      });

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
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-indigo-600 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="mt-4 text-lg text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <svg
            className="h-16 w-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M6.062 20h11.876c1.54 0 2.502-1.667 1.732-3L13.732 4a2 2 0 00-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
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
      {/* 🧭 Trip Header */}
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

      {/* 🔄 Trip Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 📸 Left: Trip Info & Photos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Trip Details</h2>
              {trip.description ? (
                <p className="text-gray-700">{trip.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}

              <div className="flex justify-between items-center mt-6">
                <span className="text-sm text-gray-500">
                  {photos.length} photos
                </span>
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {showUploadForm ? "Cancel Upload" : "Add Photos"}
                </button>
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

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Photos</h2>
              {photos.length === 0 ? (
                <div className="text-center text-gray-500">No photos yet.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
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
              )}
            </div>
          </div>

          {/* 🙋‍♂️ Right: Invite & Members */}
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

        {/* 🖼️ Modal: Full-Screen Photo */}
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
      </div>
    </div>
  );
};

export default TripDetail;
