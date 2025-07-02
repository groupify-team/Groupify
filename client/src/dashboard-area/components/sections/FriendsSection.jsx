import React, { useEffect, useState } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";
import {
  UserPlusIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
  removeFriend,
  getFriends,
} from "@shared/services/firebase/users";
import toast from "react-hot-toast";

// Direct imports - like it was working before
import AddFriend from "@dashboard/features/friends/components/AddFriend";
import UserProfileModal from "@dashboard/features/friends/components/UserProfileModal";

const FriendsSection = () => {
  const { currentUser } = useAuth();

  // Local state for real-time data
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [showFriendRequests, setShowFriendRequests] = useState(true);
  
  // Simple modal state - like before
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);

  // Set up real-time listeners - EXACTLY like in your working Dashboard
  useEffect(() => {
    if (!currentUser?.uid) return;

    let isMounted = true;

    const setupListeners = async () => {
      try {
        setLoading(true);

        // Check if user document exists first
        const userDocRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userDocRef);
        
        if (!snap.exists() || !isMounted) {
          console.warn("⚠️ userDoc does not exist yet:", currentUser.uid);
          setLoading(false);
          return;
        }

        // Friends listener - EXACTLY like in Dashboard
        const unsubscribeFriends = onSnapshot(userDocRef, async (docSnap) => {
          if (!docSnap.exists() || !isMounted) return;
          console.log("🔁 Friends snapshot triggered");

          const data = docSnap.data();
          const friendIds = [...new Set(data.friends || [])]; // Remove duplicates
          
          const friendsData = [];

          for (const fid of friendIds) {
            if (!fid || typeof fid !== "string" || fid.trim() === "") {
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

          // Remove duplicates in final data
          const uniqueFriendsData = friendsData.filter((friend, index, self) => 
            index === self.findIndex((f) => f.uid === friend.uid)
          );

          if (isMounted) {
            setFriends(uniqueFriendsData);
            console.log(`🔄 Friends updated: ${uniqueFriendsData.length}`);
          }
        });

        // Pending requests listener - EXACTLY like in Dashboard
        const { collection, query, where } = await import("firebase/firestore");
        const pendingRequestsQuery = query(
          collection(db, "friendRequests"),
          where("to", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        const unsubscribePendingRequests = onSnapshot(
          pendingRequestsQuery,
          async (snapshot) => {
            if (!isMounted) return;
            
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
                  displayName: senderSnap.exists() ? senderSnap.data().displayName : "",
                  email: senderSnap.exists() ? senderSnap.data().email : "",
                  photoURL: senderSnap.exists() ? senderSnap.data().photoURL : null,
                  createdAt: data.createdAt,
                });
              } catch (err) {
                console.warn("⚠️ Error fetching sender:", data.from, err);
              }
            }

            if (isMounted) {
              setPendingRequests(requests);
              console.log(`🔄 Pending requests updated: ${requests.length}`);
            }
          }
        );

        setLoading(false);

        // Cleanup function
        return () => {
          unsubscribeFriends();
          unsubscribePendingRequests();
        };

      } catch (error) {
        console.error("❌ Error setting up listeners:", error);
        setLoading(false);
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid]);

  // Watch for new friend requests and show notifications
  useEffect(() => {
    if (pendingRequests.length > 0) {
      // Check if this is a new request (not initial load)
      const latestRequest = pendingRequests[0];
      if (latestRequest && latestRequest.createdAt) {
        const requestTime = new Date(latestRequest.createdAt);
        const now = new Date();
        const timeDiff = now - requestTime;
        
        // If request is less than 30 seconds old, show notification
        if (timeDiff < 30000) {
          toast(`🔔 New friend request from ${latestRequest.displayName || latestRequest.email}!`, {
            duration: 5000,
            icon: '👋',
          });
        }
      }
    }
  }, [pendingRequests]);

  // Filter friends based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(
        (friend) =>
          friend.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          friend.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [friends, searchTerm]);

  // Handler functions - ALL DEFINED BEFORE USE
  const handleAcceptRequest = async (senderUid) => {
    try {
      await acceptFriendRequest(currentUser.uid, senderUid);
      toast.success("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (senderUid) => {
    try {
      await rejectFriendRequest(currentUser.uid, senderUid);
      toast.success("Friend request declined");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleRemoveFriend = async (friendUid) => {
    try {
      console.log(`🗑️ Removing friend: ${friendUid}`);
      
      // Call the removeFriend function
      await removeFriend(currentUser.uid, friendUid);
      
      // The real-time listener will automatically update the friends list
      // No need to manually refresh since we have onSnapshot listeners
      
      // Show success message
      toast.success("Friend removed!");
      
      // Close the user profile modal
      setShowUserProfileModal(false);
      setSelectedUser(null);
      
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  const handleAddFriendDirect = async (targetUid) => {
    try {
      await sendFriendRequest(currentUser.uid, targetUid);
      toast.success("Friend request sent!");
      setShowAddFriendModal(false);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleCancelRequest = async (targetUid) => {
    try {
      const { cancelFriendRequest } = await import("@shared/services/firebase/users");
      await cancelFriendRequest(currentUser.uid, targetUid);
      setShowUserProfileModal(false);
      setSelectedUser(null);
      toast.success("Friend request cancelled!");
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      toast.error("Failed to cancel friend request");
    }
  };

  const handleViewProfile = (friend) => {
    console.log("👀 Opening profile for:", friend);
    setSelectedUser(friend);
    setShowUserProfileModal(true);
  };

  const handleUserSelect = (uid) => {
    // Find user data
    const userData = friends.find(f => f.uid === uid);
    if (userData) {
      handleViewProfile(userData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-800 dark:text-white font-medium">
            Loading friends...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  My Friends ({friends.length})
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Connect and share memories with friends
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddFriendModal(true)}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <UserPlusIcon className="w-5 h-5" />
              Add Friend
            </button>
          </div>
        </div>

        {/* Friend Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 mb-6 overflow-hidden">
            <button
              onClick={() => setShowFriendRequests(!showFriendRequests)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Friend Requests
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {pendingRequests.length} pending
                  </p>
                </div>
              </div>
              {showFriendRequests ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showFriendRequests && (
              <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                          alt="User avatar"
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-600"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {request.displayName || "Unknown User"}
                          </h4>
                          <p className="text-blue-600 dark:text-blue-400 text-xs">
                            {request.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.from)}
                          className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.from)}
                          className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends List */}
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg text-gray-600 dark:text-gray-400">
              No friends yet. Start building your network!
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.uid}
                className="bg-gradient-to-r from-gray-700/80 to-gray-800/80 dark:from-gray-700/60 dark:to-gray-800/60 backdrop-blur-lg border border-gray-600/30 dark:border-gray-600/30 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => handleViewProfile(friend)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        friend.photoURL ||
                        "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                      }
                      alt={`${friend.displayName}'s avatar`}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-base truncate">
                      {friend.displayName || "Unknown User"}
                    </h4>
                    <p className="text-gray-300 text-sm truncate">
                      {friend.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Friend Modal - Simple modal like before */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Add Friend
              </h3>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <AddFriend
                onUserSelect={handleUserSelect}
                onAddFriendDirect={handleAddFriendDirect}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfileModal && selectedUser && (
        <UserProfileModal
          isOpen={showUserProfileModal}
          onClose={() => {
            setShowUserProfileModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          currentUserId={currentUser?.uid}
          friends={friends.map(f => f.uid)}
          pendingRequests={pendingRequests}
          onAddFriend={handleAddFriendDirect}
          onRemoveFriend={handleRemoveFriend}
          onCancelRequest={handleCancelRequest}
        />
      )}
    </div>
  );
};

export default FriendsSection;