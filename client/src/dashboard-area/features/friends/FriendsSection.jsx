// Improved Friends Section with better mobile responsiveness and matching colors
import React, { useState, useEffect } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import {
  UserPlusIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  UserIcon,
  HeartIcon,
  ClockIcon,
  SparklesIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { useFriendsContext } from "@shared/contexts/FriendsContext";
import { useUserPresence } from "@shared/hooks/useUserPresence";
import toast from "react-hot-toast";

import AddFriend from "@dashboard/features/friends/components/AddFriend";
import UserProfileModal from "@shared/components/user/UserProfileModal";

const FriendsSection = () => {
  const { currentUser } = useAuth();

  // Use global friends context
  const {
    friends,
    friendIds,
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getUserRelationshipData,
  } = useFriendsContext();

  // Local state
  const [showFriendRequests, setShowFriendRequests] = useState(true);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("friends"); // for mobile tabs
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Filter friends based on search and status
  const filteredFriends = friends.filter((friend) => {
    const matchesSearch =
      friend.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter would go here when implemented
    return matchesSearch;
  });

  // Enhanced Filter Dropdown Component
  const FilterDropdown = ({
    value,
    onChange,
    options,
    placeholder,
    icon: Icon,
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-700"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-400" />
            <span className="text-sm">
              {options.find((opt) => opt.value === value)?.label || placeholder}
            </span>
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    value === option.value
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // Filter options
  const statusOptions = [
    { value: "all", label: "All Friends" },
    { value: "online", label: "Online" },
    { value: "offline", label: "Offline" },
    { value: "recent", label: "Recently Active" },
  ];

  // Helper function to find the correct document ID
  const findCorrectDocumentId = async (fromUserId, toUserId) => {
    try {
      const { collection, query, where, getDocs } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@shared/services/firebase/config");

      const q = query(
        collection(db, "friendRequests"),
        where("from", "==", fromUserId),
        where("to", "==", toUserId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return doc.id;
      }
      return null;
    } catch (error) {
      console.error("Error finding document ID:", error);
      return null;
    }
  };

  // Handler functions
  const handleAcceptRequest = async (request) => {
    try {
      const actualDocId = await findCorrectDocumentId(
        request.from,
        currentUser.uid
      );
      if (!actualDocId) {
        throw new Error("Could not find the friend request document");
      }
      await acceptFriendRequest(actualDocId, request.from);
      toast.success("Friend request accepted! 🎉");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      const actualDocId = await findCorrectDocumentId(
        request.from,
        currentUser.uid
      );
      if (!actualDocId) {
        throw new Error("Could not find the friend request document");
      }
      await rejectFriendRequest(actualDocId, request.from);
      toast.success("Friend request declined");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleRemoveFriendLocal = async (friendUid) => {
    try {
      await removeFriend(friendUid);
      toast.success("Friend removed!");
      setShowUserProfileModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  const handleAddFriendDirect = async (targetUid) => {
    try {
      await sendFriendRequest(targetUid);
      toast.success("Friend request sent!");
      setShowAddFriendModal(false);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleCancelRequestLocal = async (targetUid) => {
    try {
      await cancelFriendRequest(targetUid);
      setShowUserProfileModal(false);
      setSelectedUser(null);
      toast.success("Friend request cancelled!");
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      toast.error("Failed to cancel friend request");
    }
  };

  const handleViewProfile = (friend) => {
    const relationshipData = getUserRelationshipData(friend.uid || friend.id);
    const enhancedFriend = {
      ...friend,
      __isFriend: relationshipData.isFriend,
      __isPending: relationshipData.isPending,
    };
    setSelectedUser(enhancedFriend);
    setShowUserProfileModal(true);
  };

  const handleUserSelect = (userOrUid) => {
    setShowAddFriendModal(false);
    setTimeout(() => {
      if (typeof userOrUid === "object" && userOrUid.uid) {
        handleViewProfile(userOrUid);
      } else {
        const userData = friends.find((f) => f.uid === userOrUid);
        if (userData) {
          handleViewProfile(userData);
        }
      }
    }, 100);
  };

  // Friend Card Component with Real Presence
  const FriendCard = ({ friend }) => {
    const friendPresence = useUserPresence(friend.uid || friend.id);

    // Get status indicator config
    const getStatusConfig = () => {
      if (friendPresence.loading) {
        return {
          color: "bg-gray-400",
          ring: "ring-gray-200 dark:ring-gray-700",
          pulse: "animate-pulse",
          title: "Loading status...",
        };
      }

      if (friendPresence.isOnline) {
        switch (friendPresence.status) {
          case "online":
            return {
              color: "bg-emerald-500",
              ring: "ring-emerald-200 dark:ring-emerald-800",
              pulse: "animate-pulse",
              title: "Online now",
            };
          case "away":
            return {
              color: "bg-amber-500",
              ring: "ring-amber-200 dark:ring-amber-800",
              pulse: "",
              title: "Away",
            };
          case "busy":
            return {
              color: "bg-red-500",
              ring: "ring-red-200 dark:ring-red-800",
              pulse: "",
              title: "Busy",
            };
          default:
            return {
              color: "bg-emerald-500",
              ring: "ring-emerald-200 dark:ring-emerald-800",
              pulse: "animate-pulse",
              title: "Online",
            };
        }
      }

      return {
        color: "bg-gray-400",
        ring: "ring-gray-200 dark:ring-gray-700",
        pulse: "",
        title: friendPresence.lastSeen
          ? `Last seen ${formatLastSeen(friendPresence.lastSeen)}`
          : "Offline",
      };
    };

    const statusConfig = getStatusConfig();

    return (
      <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
        {/* Friend Header */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={
                  friend.photoURL ||
                  "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                }
                alt={`${friend.displayName}'s avatar`}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-3 border-white dark:border-gray-600 shadow-lg"
              />
              {/* Real-time Status Indicator */}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 ${statusConfig.color} border-2 border-white dark:border-gray-800 rounded-full ${statusConfig.ring} ring-2 ${statusConfig.pulse} shadow-lg`}
                title={statusConfig.title}
              ></div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {friend.displayName || "Unknown User"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm truncate">
                {friend.email}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                {friendPresence.loading
                  ? "Loading..."
                  : friendPresence.isOnline
                  ? friendPresence.status.charAt(0).toUpperCase() +
                    friendPresence.status.slice(1)
                  : "Offline"}
              </p>
            </div>

            {/* Friends Since Badge */}
            <div className="hidden sm:flex items-center gap-1 bg-white/80 dark:bg-gray-700/80 px-2 sm:px-3 py-1 rounded-full">
              <HeartIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                Friends
              </span>
            </div>
          </div>
        </div>

        {/* Friend Content */}
        <div className="p-4 sm:p-6 pt-3 sm:pt-4">
          {/* Quick Stats - Only on larger screens */}
          <div className="hidden sm:grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                24
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Shared Events
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                156
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                Photos Together
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleViewProfile(friend)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 sm:py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm"
          >
            <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>View Profile</span>
          </button>
        </div>
      </div>
    );
  };

  // Helper function to format last seen
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "";
    const now = new Date();
    const lastSeenDate = lastSeen.toDate
      ? lastSeen.toDate()
      : new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastSeenDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">
            Loading friends...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 dark:text-red-400 font-medium">
            Error loading friends: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            {/* Title Section */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  My Friends
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
                  <span className="inline sm:hidden">
                    {friends.length} friends • {pendingRequests.length} requests
                  </span>
                  <span className="hidden sm:inline">
                    {friends.length} friends • {pendingRequests.length} pending
                    requests
                  </span>
                </p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowAddFriendModal(true)}
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl text-sm sm:text-base"
            >
              <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Friend</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        {isMobile && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-1 mb-6">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setActiveTab("friends")}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === "friends"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Friends ({friends.length})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === "requests"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Requests ({pendingRequests.length})
              </button>
            </div>
          </div>
        )}

        {/* Friend Requests Section */}
        {(!isMobile || activeTab === "requests") &&
          pendingRequests.length > 0 && (
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
              <button
                onClick={() => setShowFriendRequests(!showFriendRequests)}
                className="w-full flex items-center justify-between mb-4 sm:mb-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors rounded-xl p-3 -m-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                    <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      Friend Requests
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {pendingRequests.length} pending request
                      {pendingRequests.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {!isMobile &&
                  (showFriendRequests ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  ))}
              </button>

              {(isMobile || showFriendRequests) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white/90 dark:bg-gray-700/90 rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-3 sm:p-4 shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-3 sm:mb-4">
                        <img
                          src={
                            request.photoURL ||
                            "https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
                          }
                          alt="User avatar"
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {request.displayName || "Unknown User"}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-xs truncate">
                            {request.email}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <ClockIcon className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            <span className="text-xs text-blue-600 dark:text-blue-400 truncate">
                              Wants to be friends
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request)}
                          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all"
                        >
                          <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Accept</span>
                          <span className="sm:hidden">✓</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request)}
                          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all"
                        >
                          <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Decline</span>
                          <span className="sm:hidden">✗</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Search and Filter Section */}
        {(!isMobile || activeTab === "friends") && (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-700/80 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FilterDropdown
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={statusOptions}
                  placeholder="Filter by status"
                  icon={FunnelIcon}
                />
                {/* Add more filters here if needed */}
              </div>
            </div>
          </div>
        )}

        {/* Friends Grid */}
        {(!isMobile || activeTab === "friends") && (
          <>
            {filteredFriends.length === 0 ? (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-8 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <UsersIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2 sm:mb-3">
                  {searchTerm ? "No friends found" : "No friends yet"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Start connecting with people to share your memories and experiences together"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddFriendModal(true)}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105 text-sm sm:text-base"
                  >
                    <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">
                      Add Your First Friend
                    </span>
                    <span className="sm:hidden">Add Friend</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredFriends.map((friend) => (
                  <FriendCard key={friend.uid || friend.id} friend={friend} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl max-w-md w-full shadow-2xl border border-gray-200/80 dark:border-gray-700/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Add Friend
              </h3>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <UserProfileModal
            isOpen={showUserProfileModal}
            user={selectedUser}
            currentUserId={currentUser?.uid}
            friends={friendIds}
            pendingRequests={pendingRequests}
            onAddFriend={handleAddFriendDirect}
            onRemoveFriend={handleRemoveFriendLocal}
            onCancelRequest={handleCancelRequestLocal}
            onClose={() => {
              setSelectedUser(null);
              setShowUserProfileModal(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FriendsSection;
