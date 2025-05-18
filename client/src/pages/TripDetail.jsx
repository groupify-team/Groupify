import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getTrip, addTripMember } from "../services/firebase/trips";
import { getTripPhotos } from "../services/firebase/storage";
import PhotoUpload from "../components/photos/PhotoUpload";
import { getUserProfile } from "../services/firebase/users";
import { sendTripInvite } from "../services/firebase/trips";
import InviteFriendDropdown from "../components/trips/InviteFriendDropdown";


const TripDetail = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [trip, setTrip] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchTripAndPhotos = async () => {
      try {
        setLoading(true);

        // Fetch trip details
        const tripData = await getTrip(tripId);
        setTrip(tripData);

        // Check if current user is a member of this trip
        if (!tripData.members.includes(currentUser.uid)) {
          setError("You do not have access to this trip");
          setLoading(false);
          return;
        }

        // Fetch photos
        const tripPhotos = await getTripPhotos(tripId);
        setPhotos(tripPhotos);

        // Fetch member profiles
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
    // Add new photos to the list
    setPhotos((prevPhotos) => [...uploadedPhotos, ...prevPhotos]);

    // Update trip photo count
    if (trip) {
      setTrip((prevTrip) => ({
        ...prevTrip,
        photoCount: (prevTrip.photoCount || 0) + uploadedPhotos.length,
      }));
    }

    // Hide the upload form
    setShowUploadForm(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      setInviteError("Please enter an email address");
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteSuccess(false);

      // In a real app, you would send an invitation email
      // For now, we'll just show a success message

      setInviteSuccess(true);
      setInviteEmail("");
    } catch (error) {
      console.error("Error inviting user:", error);
      setInviteError("Failed to send invitation. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInviteFriend = async (friend) => {
    console.log("🔍 Sending invite to:", friend);

    try {
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
            xmlns="http://www.w3.org/2000/svg"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
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
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
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
      {/* Header */}
      <div className="bg-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{trip.name}</h1>

              <p className="text-indigo-200 mt-1">
                {trip.location || "No location specified"}
              </p>
              <div className="flex mt-2 text-sm">
                <span className="mr-4">
                  <span className="font-medium">
                    {trip.startDate || "No start date"}
                  </span>
                  {trip.startDate && trip.endDate && " - "}
                  {trip.endDate && (
                    <span className="font-medium">{trip.endDate}</span>
                  )}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trip Details */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Trip Details</h2>
              {trip.description ? (
                <p className="text-gray-700 mb-4">{trip.description}</p>
              ) : (
                <p className="text-gray-500 italic mb-4">
                  No description provided
                </p>
              )}

              <div className="flex justify-between items-center mt-6">
                <div>
                  <span className="text-sm text-gray-500">
                    {photos.length} photos
                  </span>
                </div>
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
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
          </div>

          {/* Invite People */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Invite People</h2>
              <div className="mb-2">
                <h3 className="text-md font-semibold mb-2">Invite a Friend</h3>
                <InviteFriendDropdown
                  currentUser={currentUser}
                  onSelect={handleInviteFriend}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trip Members */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Trip Members</h2>
          {memberProfiles.length === 0 ? (
            <p className="text-gray-500 text-sm">No members found.</p>
          ) : (
            <ul className="space-y-2">
              {memberProfiles.map((member) => (
                <li key={member.uid} className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-700 flex items-center justify-center rounded-full mr-3 text-sm font-bold">
                    {member.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm text-gray-700">
                    {member.displayName || member.email || member.uid}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

{showUploadForm && (
  <div className="mt-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Upload Photos</h2>
      <PhotoUpload
        tripId={tripId}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </div>
  </div>
)}


        {/* Photo Gallery */}
<div className="bg-white rounded-lg shadow p-6 mt-6">
  <h2 className="text-xl font-bold mb-4">Photos</h2>

  {photos.length === 0 ? (
    <div className="p-12 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-16 w-16 text-gray-400 mx-auto mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Yet</h3>
      <p className="text-gray-500 mb-4">Upload photos to share them with your trip members</p>
      <button
        onClick={() => setShowUploadForm(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Upload Photos
      </button>
    </div>
  ) : (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white rounded-lg shadow overflow-hidden cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.downloadURL.replace(
                "groupify-77202.appspot.com",
                "groupify-77202.firebasestorage.app"
              )}
              alt={photo.fileName}
              className="w-full h-32 object-cover"
            />
            <div className="p-2 text-xs text-gray-500">
              Uploaded {new Date(photo.uploadedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
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
    </>
  )}
</div>




      </div>
    </div>
  );
};

export default TripDetail;
