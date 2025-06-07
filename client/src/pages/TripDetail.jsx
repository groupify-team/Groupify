import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db, storage } from "../services/firebase/config";
import { filterPhotosByFace } from "../services/faceRecognition";
import logo from "../assets/logo/3.png";
import UserProfileModal from "../components/profile/UserProfileModal";
import {
  getTrip,
  addTripMember,
  sendTripInvite,
} from "../services/firebase/trips";
import { getTripPhotos } from "../services/firebase/storage";
import { ref, deleteObject } from "firebase/storage";
import PhotoUpload from "../components/photos/PhotoUpload";
import {
  getFriends,
  getUserProfile,
  sendFriendRequest,
  removeFriend,
} from "../services/firebase/users";
import InviteFriendDropdown from "../components/trips/InviteFriendDropdown";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";

const TripDetail = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [trip, setTrip] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const [faceRecognitionProgress, setFaceRecognitionProgress] = useState({
    current: 0,
    total: 0,
  });

  const isMember = trip?.members?.includes(currentUser?.uid);
  const canFilterByFace = isMember && !!currentUser?.photoURL;
  const [showAllPhotosModal, setShowAllPhotosModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const [cancelSuccess, setCancelSuccess] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  const handleToggleFaceFilter = () => {
    if (!canFilterByFace) {
      alert("Face filtering is only available for registered trip members.");
      return;
    }
    setFilterActive((prev) => !prev);
  };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleDeleteSelectedPhotos = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPhotos.length} selected photo(s)?`
    );
    if (!confirmed) return;

    try {
      for (const photoId of selectedPhotos) {
        const photo = photos.find((p) => p.id === photoId);
        if (!photo) continue;

        const photoRef = ref(storage, `photos/${tripId}/${photo.fileName}`);
        await deleteObject(photoRef);

        const docRef = doc(db, "tripPhotos", photoId);
        await deleteDoc(docRef);
      }

      setPhotos((prev) => prev.filter((p) => !selectedPhotos.includes(p.id)));
      alert(`${selectedPhotos.length} photos deleted successfully ✅`);
      setSelectedPhotos([]);

      setSelectMode(false);
    } catch (error) {
      console.error("Failed to delete selected photos:", error);
      alert("An error occurred while deleting photos.");
    }
  };

  useEffect(() => {
    const fetchTripAndPhotos = async () => {
      try {
        setLoading(true);
        const tripData = await getTrip(tripId);
        setTrip(tripData);
        setIsAdmin(tripData?.admins?.includes(currentUser?.uid));

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

  // FIXED: Use the new client-side face recognition
  useEffect(() => {
    const processPhotosByFace = async () => {
      if (!canFilterByFace || !photos.length || !filterActive) {
        setFilteredPhotos([]);
        return;
      }

      console.log("🔄 Starting face recognition process...");
      console.log("👤 Current user:", currentUser);
      console.log("📷 User photo URL:", currentUser.photoURL);
      console.log("📸 Number of photos to process:", photos.length);
      console.log("📸 First photo sample:", photos[0]);

      setLoadingFaces(true);

      try {
        const matchingPhotos = await filterPhotosByFace(
          photos,
          currentUser.photoURL,
          (current, total) => {
            console.log(`📊 Progress: ${current}/${total}`);
            setFaceRecognitionProgress({ current, total });
          }
        );

        console.log(`🎯 Found ${matchingPhotos.length} matching photos`);
        setFilteredPhotos(matchingPhotos);

        if (matchingPhotos.length === 0) {
          console.log("🔍 No photos found containing your face");
        }
      } catch (error) {
        console.error("❌ Face recognition failed:", error);
        setFilteredPhotos([]);
      } finally {
        setLoadingFaces(false);
        setFaceRecognitionProgress({ current: 0, total: 0 });
      }
    };

    processPhotosByFace();
  }, [currentUser, photos, filterActive, canFilterByFace]);

  // Get pending friend requests helper function
  const getPendingFriendRequests = async (uid) => {
    try {
      const q = query(
        collection(db, "friendRequests"),
        where("fromUid", "==", uid),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        uid: doc.data().toUid,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchFriendsAndPending = async () => {
      if (!currentUser?.uid) return;
      try {
        const userFriends = await getFriends(currentUser.uid);
        const friendIds = userFriends.map((f) => f.uid);
        setFriends(friendIds);
        console.log("✅ Loaded friends:", friendIds);

        const pending = await getPendingFriendRequests(currentUser.uid);
        const pendingIds = pending.map((r) => r.uid);
        setPendingFriendRequests(pendingIds);
        console.log("🕒 Pending requests:", pendingIds);
      } catch (error) {
        console.error("❌ Failed to fetch friends or pending:", error);
      }
    };

    fetchFriendsAndPending();
  }, [currentUser]);

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

  const handleAddFriend = async (targetUid) => {
    try {
      await sendFriendRequest(currentUser.uid, targetUid);
      setPendingFriendRequests((prev) => [...prev, targetUid]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      console.log("✅ Friend request sent to:", targetUid);

      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isPending: true,
      }));
    } catch (error) {
      console.error("❌ Failed to send friend request:", error);
    }
  };

  const handleRemoveFriend = async (targetUid) => {
    try {
      await removeFriend(currentUser.uid, targetUid);
      setFriends((prev) => prev.filter((uid) => uid !== targetUid));
      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isFriend: false,
      }));
      console.log("🗑️ Removed friend:", targetUid);
    } catch (error) {
      console.error("❌ Failed to remove friend:", error);
    }
  };

  const checkFriendStatus = async (myUid, otherUid) => {
    const ref = doc(db, "friendRequests", `${myUid}_${otherUid}`);
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.status === "pending" ? "pending" : "none";
    }
    return "none";
  };

  const handlePromoteToAdmin = (uid) => {
    setTrip((prevTrip) => ({
      ...prevTrip,
      admins: [...(prevTrip.admins || []), uid],
    }));
  };

  const handleDemoteFromAdmin = (uid) => {
    setTrip((prevTrip) => {
      const isLastAdmin =
        prevTrip.admins?.length === 1 && prevTrip.admins[0] === uid;

      if (isLastAdmin) {
        alert(
          "❌ You are the only Group Admin. Either delete the trip or assign another admin first."
        );
        return prevTrip;
      }
      return {
        ...prevTrip,
        admins: prevTrip.admins?.filter((id) => id !== uid),
      };
    });
  };

  const handleRemoveFromTrip = async (uid) => {
    try {
      const updatedTrip = {
        ...trip,
        members: trip.members?.filter((id) => id !== uid),
        admins: trip.admins?.filter((id) => id !== uid),
      };

      await updateTrip(trip.id, updatedTrip);
      setTrip(updatedTrip);

      toast.success("User removed from trip ✅");
    } catch (error) {
      console.error("Failed to remove user from trip:", error);
      toast.error("❌ Failed to remove user from trip");
    }
  };

  const handleCancelFriendRequest = async (targetUid) => {
    try {
      const ref = doc(db, "friendRequests", `${currentUser.uid}_${targetUid}`);
      await deleteDoc(ref);
      setPendingFriendRequests((prev) =>
        prev.filter((uid) => uid !== targetUid)
      );
      setCancelSuccess(
        `Friend request to ${
          selectedUser.displayName || selectedUser.email
        } was cancelled.`
      );
      setTimeout(() => setCancelSuccess(null), 3000);

      setSelectedUser((prevUser) => ({
        ...prevUser,
        __isPending: false,
      }));

      console.log("🗑️ Friend request canceled:", targetUid);
    } catch (error) {
      console.error("❌ Failed to cancel friend request:", error);
    }
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start">
            {/* Left side: Trip thumbnail + details */}
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              {photos.length > 0 && (
                <img
                  src={photos[0].downloadURL.replace(
                    "groupify-77202.appspot.com",
                    "groupify-77202.firebasestorage.app"
                  )}
                  alt="Trip Thumbnail"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white transform hover:scale-105 transition duration-300"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {trip.name}
                </h1>
                <p className="text-indigo-100 mt-1">
                  {trip.location || "No location specified"}
                </p>
                <div className="flex mt-2 text-sm text-indigo-200">
                  <span className="mr-4 font-medium">
                    {trip.startDate || "No start date"}
                    {trip.startDate && trip.endDate && " - "}
                    {trip.endDate}
                  </span>
                  <span>{trip.members?.length || 1} members</span>
                </div>
              </div>
            </div>

            {/* Right side: Logo with rounded background */}
            <Link to="/dashboard" title="Go to Dashboard">
              <div className="bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-16 h-16 rounded-full object-contain"
                />
              </div>
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

                <div className="flex gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => alert("Edit Trip modal will open here")}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Edit Trip
                    </button>
                  )}
                  <button
                    onClick={() => setShowUploadForm(!showUploadForm)}
                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {showUploadForm ? "Cancel Upload" : "Add Photos"}
                  </button>
                </div>
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
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAllPhotosModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    All Photos
                  </button>
                </div>
              </div>

              <div className="flex overflow-x-auto space-x-4 pb-2">
                {photos.map((photo) => (
                  <div
                    key={`all-${photo.id}`}
                    className="flex-shrink-0 w-64 cursor-pointer relative"
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
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Scanning photos for your face... (
                    {faceRecognitionProgress.current}/
                    {faceRecognitionProgress.total})
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width:
                          faceRecognitionProgress.total > 0
                            ? `${
                                (faceRecognitionProgress.current /
                                  faceRecognitionProgress.total) *
                                100
                              }%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>
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
                  {[...memberProfiles]
                    .sort((a, b) => {
                      // 1. Current user first
                      if (a.uid === currentUser.uid) return -1;
                      if (b.uid === currentUser.uid) return 1;

                      // 2. Admin second
                      if (a.uid === trip.createdBy) return -1;
                      if (b.uid === trip.createdBy) return 1;

                      // 3. Alphabetical for the rest
                      return (a.displayName || a.email || "").localeCompare(
                        b.displayName || b.email || ""
                      );
                    })
                    .map((member) => (
                      <li
                        key={member.uid}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <img
                            src={
                              member.photoURL ||
                              "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                            }
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover border mr-3"
                          />
                          <span
                            className="text-sm font-medium text-gray-700 hover:underline cursor-pointer"
                            onClick={async () => {
                              const isFriendNow = friends.includes(member.uid);
                              const status = await checkFriendStatus(
                                currentUser.uid,
                                member.uid
                              );
                              const isPendingNow = status === "pending";
                              setSelectedUser({
                                ...member,
                                __isFriend: isFriendNow,
                                __isPending: isPendingNow,
                              });
                            }}
                          >
                            {member.displayName || member.email || member.uid}
                            {member.uid === currentUser.uid && " (Me)"}
                          </span>
                        </div>

                        {/* Admin Badge */}
                        {member.uid === trip.createdBy ? (
                          <span className="bg-gray-300 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Trip Creator
                          </span>
                        ) : trip.admins?.includes(member.uid) ? (
                          <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Group Admin
                          </span>
                        ) : null}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {console.log("friends", friends)}

        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            currentUserId={currentUser?.uid}
            isAdmin={isAdmin}
            onAddFriend={handleAddFriend}
            onRemoveFriend={handleRemoveFriend}
            onCancelRequest={handleCancelFriendRequest}
            onClose={() => setSelectedUser(null)}
            trip={trip}
            setTrip={setTrip}
            onPromoteToAdmin={handlePromoteToAdmin}
            onDemoteFromAdmin={handleDemoteFromAdmin}
            onRemoveFromTrip={handleRemoveFromTrip}
          />
        )}

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

        {showSuccess && (
          <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
            Friend request sent ✅
          </div>
        )}
        {cancelSuccess && (
          <div className="fixed top-5 right-5 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50">
            {cancelSuccess}
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
                <div className="flex items-center gap-2">
                  {selectMode && selectedPhotos.length > 0 && (
                    <button
                      onClick={handleDeleteSelectedPhotos}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center"
                    >
                      <span className="mr-2">🗑️</span>
                      Delete {selectedPhotos.length}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setSelectMode(!selectMode);
                        setSelectedPhotos([]);
                      }}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                    >
                      {selectMode ? "Cancel Selection" : "Select Photos"}
                    </button>
                  )}
                  <button
                    onClick={() => setShowAllPhotosModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => {
                  const isSelected = selectedPhotos.includes(photo.id);
                  return (
                    <div
                      key={`modal-${photo.id}`}
                      className={`relative cursor-pointer rounded-lg overflow-hidden shadow ${
                        selectMode && !isSelected ? "opacity-60" : ""
                      }`}
                      onClick={() => {
                        if (selectMode) {
                          togglePhotoSelection(photo.id);
                        } else {
                          setSelectedPhoto(photo);
                          setShowAllPhotosModal(false);
                        }
                      }}
                    >
                      <img
                        src={photo.downloadURL.replace(
                          "groupify-77202.appspot.com",
                          "groupify-77202.firebasestorage.app"
                        )}
                        alt={photo.fileName}
                        className="w-full h-40 object-cover"
                      />
                      {selectMode && (
                        <div className="absolute top-2 right-2 w-5 h-5 border-2 border-white rounded bg-white flex items-center justify-center">
                          {isSelected && (
                            <span className="text-green-600 font-bold">✓</span>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Uploaded{" "}
                        {new Date(photo.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetail;
