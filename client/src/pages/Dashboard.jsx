import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TripCard from "../components/trips/TripCard";
import CreateTripModal from "../components/trips/CreateTripModal";
import AddFriend from "../components/friends/AddFriend";
import EditProfileModal from "../components/profile/EditProfileModal";
import SettingsModal from "../components/settings/SettingsModal";
import ModernNavbar from "../components/layout/Navbar";
import UserProfileModal from "../components/profile/UserProfileModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  sendFriendRequest,
  removeFriend,
  cancelFriendRequest,
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
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [tripInvites, setTripInvites] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const checkFriendStatus = async () => {
    if (user.uid === currentUserId) {
      setFriendStatus("self");
    } else if (friends.some((f) => f.uid === user.uid)) {
      setFriendStatus("friend");
    } else {
      const sent = await didISendRequest(currentUserId, user.uid);
      if (sent) {
        setFriendStatus("pending");
      } else {
        setFriendStatus("none");
      }
    }
  };

  useEffect(() => {
    const fetchPendingRequests = async () => {
      const requests = await getPendingFriendRequests(currentUser?.uid);
      setPendingFriendRequests(requests || []);
    };

    if (currentUser) {
      fetchPendingRequests();
    }
  }, [currentUser]);

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
    let unsubscribeFriends = () => {};

    if (currentUser?.uid) {
      const userDocRef = doc(db, "users", currentUser.uid);

      getDoc(userDocRef).then((snap) => {
        if (!snap.exists()) {
          console.warn("⚠️ userDoc does not exist yet:", currentUser.uid);
          return;
        }

        unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
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
      });
    }

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

          if (data.from === currentUser.uid) continue;

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

  // Open User Profile Modal
  const handleOpenUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUserProfile({ uid, ...userData });
        setIsUserProfileOpen(true);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  // 🔧 Event Handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleRemoveFriend = async (uid) => {
    try {
      await removeFriend(currentUser.uid, uid);
      setFriends((prev) => prev.filter((f) => f.uid !== uid));
      if (selectedUser && selectedUser.uid === uid) {
        setSelectedUser(null);
        setShowUserProfileModal(false);
      }
    } catch (error) {
      console.error("Error removing friend:", error);
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

  // Sort Friends Alphabetically
  const sortedFriends = [...friends].sort((a, b) =>
    (a.displayName || "").localeCompare(b.displayName || "")
  );

  // ****************** Navigation Bar ********************

  return (
    <div className="min-h-screen bg-gray-100">
      <ModernNavbar
        userData={userData}
        currentUser={currentUser}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        pendingRequests={pendingFriendRequests}
        handleLogout={handleLogout}
        setShowEditProfileModal={setShowEditProfileModal}
        setShowSettingsModal={setShowSettingsModal}
      />

      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar
      />

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
            <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  My Friends
                </h2>
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-full transition shadow"
                >
                  + Add Friend
                </button>
              </div>
              {sortedFriends.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  You have no friends yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {sortedFriends.map((friend) => (
                    <div
                      key={friend.uid || friend.id}
                      className="flex items-center bg-gray-50 hover:bg-gray-100 p-3 rounded-xl shadow-sm transition cursor-pointer"
                      onClick={() => handleOpenUserProfile(friend.uid)}
                    >
                      <img
                        src={
                          friend.photoURL ||
                          "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                        }
                        alt="Friend"
                        className="w-10 h-10 rounded-full object-cover border mr-3"
                      />
                      <div className="text-sm font-medium text-gray-800">
                        {friend.displayName || friend.email || friend.uid}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Friend Requests */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Pending Friend Requests
              </h2>
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.from}
                      className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-3 rounded-xl shadow-sm transition"
                    >
                      <div
                        onClick={() => handleOpenUserProfile(req.from)}
                        className="cursor-pointer font-medium text-sm text-gray-800"
                      >
                        {req.displayName || req.email || req.from}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAccept(req.from)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-sm shadow"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(req.from)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-sm shadow"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
            <AddFriend onUserSelect={handleOpenUserProfile} />
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* User Profile Modal */}
      {isUserProfileOpen && selectedUserProfile && (
        <UserProfileModal
          user={selectedUserProfile}
          isFriend={friends.some((f) => f.uid === selectedUserProfile.uid)}
          isPending={pendingRequests.some(
            (r) => r.from === selectedUserProfile.uid
          )}
          currentUserId={currentUser.uid}
          onAddFriend={async (uid) => {
            await sendFriendRequest(currentUser.uid, uid);
            toast.success("Friend request sent");
          }}
          onCancelRequest={async (uid) => {
            await cancelFriendRequest(currentUser.uid, uid);
            setPendingRequests((prev) => prev.filter((r) => r.from !== uid));
            toast.info("Friend request cancelled");
          }}
          onRemoveFriend={async (uid) => {
            await removeFriend(currentUser.uid, uid);
            setFriends((prev) => prev.filter((f) => f.uid !== uid));
          }}
          onClose={() => setIsUserProfileOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
