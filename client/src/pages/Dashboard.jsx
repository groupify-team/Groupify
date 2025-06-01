import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TripCard from "../components/trips/TripCard";
import CreateTripModal from "../components/trips/CreateTripModal";
import PhotoUpload from "../components/photos/PhotoUpload";
import AddFriend from "../components/friends/AddFriend";
import EditProfileModal from "../components/profile/EditProfileModal";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebase/config";
import {
  getUserTrips,
  getPendingInvites,
  acceptTripInvite,
  declineTripInvite,
} from "../services/firebase/trips";
import {
  getUserProfile,
  getFriends,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "../services/firebase/users";

const Dashboard = () => {
  // 🔐 Authentication & Navigation
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // 📊 State Management
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [tripInvites, setTripInvites] = useState([]);

  // 📦 Dashboard Effects
  useEffect(() => {
    if (!currentUser?.uid) return;

    // --- Fetch Profile ---
    const fetchUserProfile = async () => {
      const profile = await getUserProfile(currentUser.uid);
      setUserData(profile);
    };

    // --- Fetch Dashboard Data ---
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [userTrips, friendRequests, invites] = await Promise.all([
          getUserTrips(currentUser.uid),
          getPendingFriendRequests(currentUser.uid),
          getPendingInvites(currentUser.uid),
        ]);
        setTrips(userTrips);
        setPendingRequests(friendRequests);
        setPendingInvites(invites);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load your data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // --- Fetch Trip Invites ---
    const fetchTripInvites = async () => {
      try {
        const invitesSnapshot = await getDocs(
          query(
            collection(db, "tripInvites"),
            where("inviteeUid", "==", currentUser.uid),
            where("status", "==", "pending")
          )
        );

        const invitesData = await Promise.all(
          invitesSnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            let tripName = "Unknown Trip";
            try {
              const tripDoc = await getDoc(doc(db, "trips", data.tripId));
              if (tripDoc.exists()) {
                tripName = tripDoc.data().name || "Unnamed Trip";
              }
            } catch (err) {
              console.warn("⚠️ Error fetching trip:", data.tripId, err);
            }

            let inviterName = null;
            try {
              const inviterDoc = await getDoc(
                doc(db, "users", data.inviterUid)
              );
              if (inviterDoc.exists()) {
                const inviterData = inviterDoc.data();
                inviterName =
                  inviterData.displayName || inviterData.email || null;
              }
            } catch (err) {
              console.warn("⚠️ Error fetching inviter:", data.inviterUid, err);
            }

            return {
              id: docSnap.id,
              ...data,
              tripName,
              inviterName,
            };
          })
        );

        setTripInvites(invitesData);
      } catch (err) {
        console.error("❌ Error fetching trip invites:", err);
      }
    };

    // --- Live Friends Listener ---
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      console.log("🔁 Friends snapshot triggered");

      const data = docSnap.data();
      const friendIds = data.friends || [];
      const friendsData = [];

      for (const fid of friendIds) {
        if (!fid || typeof fid !== "string" || fid.trim() === "") {
          console.warn("⚠️ Skipping invalid friend ID:", fid);
          continue;
        }

        try {
          const friendRef = doc(db, "users", fid);
          const friendSnap = await getDoc(friendRef);

          if (friendSnap.exists()) {
            const fData = friendSnap.data();
            friendsData.push({
              uid: fid,
              displayName: fData.displayName || fData.email || fid,
              email: fData.email || "",
              photoURL: fData.photoURL || "",
            });
          }
        } catch (err) {
          console.error(`❌ Error fetching friend ${fid}:`, err);
        }
      }

      setFriends(friendsData);
    });

    // --- Live Pending Friend Requests Listener ---
    const pendingRequestsQuery = query(
      collection(db, "friendRequests"),
      where("to", "==", currentUser.uid),
      where("status", "==", "pending")
    );

    const unsubscribePendingRequests = onSnapshot(
      pendingRequestsQuery,
      async (snapshot) => {
        if (!currentUser?.uid) return;

        const requests = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();

          try {
            const senderRef = doc(db, "users", data.from);
            const senderSnap = await getDoc(senderRef);

            requests.push({
              id: docSnap.id,
              from: data.from,
              displayName: senderSnap.exists()
                ? senderSnap.data().displayName
                : "",
              email: senderSnap.exists() ? senderSnap.data().email : "",
              createdAt: data.createdAt,
            });
          } catch (err) {
            console.warn("⚠️ Error fetching sender:", data.from, err);
          }
        }

        setPendingRequests(requests);
      }
    );

    // Run initial fetches
    fetchUserProfile();
    fetchInitialData();
    fetchTripInvites();

    // Cleanup listeners
    return () => {
      unsubscribeFriends();
      unsubscribePendingRequests();
    };
  }, [currentUser]);


 //  **************************  Event Handlers  **************************


  // 🔧 Event Handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleTripCreated = (newTrip) => {
    setTrips((prevTrips) => [...prevTrips, newTrip]);
  };

  const handleAccept = async (fromUid) => {
    try {
      await acceptFriendRequest(currentUser.uid, fromUid);

      setPendingRequests((prev) => prev.filter((req) => req.from !== fromUid));

      const updatedFriends = await getFriends(currentUser.uid);
      setFriends(updatedFriends);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleReject = async (senderUid) => {
    await rejectFriendRequest(currentUser.uid, senderUid);
    const updatedPending = await getPendingFriendRequests(currentUser.uid);
    setPendingRequests(updatedPending);
  };

  const handleRemoveFriend = async (friendUid) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    try {
      await removeFriend(currentUser.uid, friendUid);
      const updatedFriends = await getFriends(currentUser.uid);
      setFriends(updatedFriends);
      console.log(`✅ Removed friend: ${friendUid}`);
    } catch (error) {
      console.error("❌ Error removing friend:", error);
    }
  };

  const handlePhotoUploaded = (uploadedPhotos) => {
    if (selectedTrip && uploadedPhotos.length > 0) {
      setTrips((prevTrips) =>
        prevTrips.map((trip) =>
          trip.id === selectedTrip
            ? {
                ...trip,
                photoCount: (trip.photoCount || 0) + uploadedPhotos.length,
              }
            : trip
        )
      );
    }
  };

  // Sort Friends Alphabetically
  const sortedFriends = [...friends].sort((a, b) =>
    (a.displayName || "").localeCompare(b.displayName || "")
  );

  // ****************** Navigation Bar ********************

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center relative">
            {/* 👈 Left section – Notification + Profile */}
            <div className="flex items-center space-x-3">
              {/* 👤 Profile Avatar + Welcome + Dropdown from avatar */}
              <div className="relative flex items-center space-x-3">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="relative focus:outline-none"
                >
                  <img
                    src={
                      userData?.photoURL ||
                      "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                    }
                    alt="Profile"
                    className="w-11 h-11 rounded-full object-cover border"
                  />
                  {/* 🔽 Arrow positioned on image edge with partial transparency */}
                  <span className="absolute bottom-0 right-[-6px] bg-white/80 rounded-full p-0.5 shadow">
                    <svg
                      className={`w-3 h-3 text-gray-700 transition-transform ${
                        showUserMenu ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute left-0 top-12 w-44 bg-white border rounded shadow z-50">
                    <button
                      onClick={() => setShowEditProfileModal(true)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-base font-medium"
                    >
                      Edit Profile
                    </button>

                    <hr className="border-t border-gray-200 mx-2" />

                    <button
                      onClick={() => alert("Settings clicked")}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-base font-medium"
                    >
                      Settings
                    </button>

                    <hr className="border-t border-gray-200 mx-2" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-base font-medium text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                )}

                <span className="text-gray-700 text-base font-medium">
                  Welcome,{" "}
                  {userData?.displayName ||
                    currentUser?.displayName ||
                    currentUser?.email}
                </span>
              </div>

              {/* 🔔 Notification Bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative focus:outline-none"
              >
                <svg
                  className="w-6 h-6 text-gray-600 hover:text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405C18.21 15.21 18 14.698 18 14.172V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.172c0 .526-.21 1.038-.595 1.423L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full"></span>
                )}
              </button>
            </div>

            {/* 🏷️ Center section – Dashboard Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-xl font-semibold">Groupify Dashboard</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* *************** Main - Trips & Invites trips ****************** */}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 🧭 Left Side (2/3 width) – My Trips */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-2xl font-bold text-gray-900">My Trips</h2>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create New Trip
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mx-2">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading your trips...</p>
              </div>
            ) : (
              <>
                {trips.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow mx-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No trips yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first trip to start organizing your photos
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Create New Trip
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-2">
                    {trips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        onClick={() => setSelectedTrip(trip.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Always show pending invites */}

                <div className="bg-white rounded-lg shadow p-4 mt-6 mx-2">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    Pending Trip Invites
                  </h2>

                  {tripInvites.length === 0 ? (
                    <p className="text-gray-500">
                      No trip invites at the moment.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {tripInvites.map((invite) => (
                        <li
                          key={invite.id}
                          className="py-3 flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0"
                        >
                          <div className="space-y-1">
                            <p className="text-lg font-semibold text-indigo-700">
                              {invite.tripName || "Unknown Trip"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Invited by:{" "}
                              <span className="font-medium text-gray-700">
                                {invite.inviterName || invite.inviterUid}
                              </span>
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                await acceptTripInvite(
                                  invite.id,
                                  currentUser.uid
                                );
                                setTripInvites(
                                  tripInvites.filter((i) => i.id !== invite.id)
                                );
                                const refreshedTrips = await getUserTrips(
                                  currentUser.uid
                                );
                                setTrips(refreshedTrips);
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium"
                            >
                              Accept
                            </button>
                            <button
                              onClick={async () => {
                                await declineTripInvite(invite.id);
                                setTripInvites(
                                  tripInvites.filter((i) => i.id !== invite.id)
                                );
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-medium"
                            >
                              Decline
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ************* Right Side (1/3 width) – Friends & Requests ************* */}

          <div className="space-y-6">
            {/* My Friends */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-gray-900">My Friends</h2>
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Add Friend
                </button>
              </div>
              {sortedFriends.length === 0 ? (
                <p className="text-gray-500">You have no friends yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                  {sortedFriends.map((friend) => (
                    <li
                      key={friend.uid || friend.id}
                      className="py-2 flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            friend.photoURL ||
                            "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                          }
                          alt="Friend"
                          className="w-9 h-9 rounded-full object-cover border"
                        />
                        <span className="text-gray-800 font-medium">
                          {friend.displayName || friend.email || friend.uid}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveFriend(friend.uid || friend.id)
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pending Friend Requests */}

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Pending Friend Requests
              </h2>
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500">No pending requests.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {pendingRequests.map((req) => (
                    <li
                      key={req.from}
                      className="py-2 flex justify-between items-center"
                    >
                      <span>{req.displayName || req.email || req.from}</span>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleAccept(req.from)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(req.from)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals & Upload Section */}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Find Friends</h2>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <AddFriend />
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTripCreated={handleTripCreated}
      />

      {/* 📤 Upload Photos Section */}
      {trips.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-0 mt-8">
          <button
            onClick={() => setShowUploadSection(!showUploadSection)}
            className="w-full flex items-center justify-center py-3 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
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
            {showUploadSection ? "Hide Upload Section" : "Upload Photos"}
          </button>
          {showUploadSection && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Upload Photos</h2>

              {/* Trip Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Trip for Photos
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedTrip || ""}
                  onChange={(e) => setSelectedTrip(e.target.value)}
                >
                  <option value="" disabled>
                    Select a trip
                  </option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Component */}
              {selectedTrip ? (
                <PhotoUpload
                  tripId={selectedTrip}
                  onPhotoUploaded={handlePhotoUploaded}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600">
                    Please select a trip to upload photos
                  </p>
                </div>
              )}
            </div>
          )}{" "}
          {/* End of Upload Box */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
