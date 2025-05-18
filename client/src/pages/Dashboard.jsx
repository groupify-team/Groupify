import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserTrips } from '../services/firebase/trips';
import TripCard from '../components/trips/TripCard';
import CreateTripModal from '../components/trips/CreateTripModal';
import PhotoUpload from '../components/photos/PhotoUpload';
import AddFriend from '../components/friends/AddFriend';
import { getFriends, getPendingFriendRequests, acceptFriendRequest,
  rejectFriendRequest, removeFriend } from '../services/firebase/users';
import { getPendingInvites, acceptTripInvite, declineTripInvite } from "../services/firebase/trips";


const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);


useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      const userTrips = await getUserTrips(currentUser.uid);
      setTrips(userTrips);

      const userFriends = await getFriends(currentUser.uid);
      setFriends(userFriends);

      const friendRequests = await getPendingFriendRequests(currentUser.uid);
      setPendingRequests(friendRequests);

      const invites = await getPendingInvites(currentUser.uid);
      setPendingInvites(invites);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load your data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (currentUser?.uid) {
    fetchData();
  }
}, [currentUser]);



const handleLogout = async () => {
  try {
    await logout();
    navigate('/');
  } catch (error) {
    console.error('Failed to log out:', error);
  }
};

const handleTripCreated = (newTrip) => {
  setTrips((prevTrips) => [...prevTrips, newTrip]);
};

const handleAccept = async (fromUid) => {
  try {
    await acceptFriendRequest(currentUser.uid, fromUid);
    const updatedRequests = pendingRequests.filter((r) => r.from !== fromUid);
    setPendingRequests(updatedRequests);
    const updatedFriends = await getFriends(currentUser.uid);
    setFriends(updatedFriends);
  } catch (error) {
    console.error('Error accepting friend request:', error);
  }
};



const handleReject = async (senderUid) => {
  await rejectFriendRequest(currentUser.uid, senderUid);
  const updatedPending = await getPendingFriendRequests(currentUser.uid);
  setPendingRequests(updatedPending);
};

const handleRemoveFriend = async (friendUid) => {
  if (!window.confirm('Are you sure you want to remove this friend?')) return;

  try {
    await removeFriend(currentUser.uid, friendUid);
    const updatedFriends = await getFriends(currentUser.uid);
    setFriends(updatedFriends);
    console.log(`✅ Removed friend: ${friendUid}`);
  } catch (error) {
    console.error('❌ Error removing friend:', error);
  }
};


const handlePhotoUploaded = (uploadedPhotos) => {
  if (selectedTrip && uploadedPhotos.length > 0) {
    setTrips((prevTrips) =>
      prevTrips.map((trip) =>
        trip.id === selectedTrip
          ? { ...trip, photoCount: (trip.photoCount || 0) + uploadedPhotos.length }
          : trip
      )
    );
  }
};



  return (
  <div className="min-h-screen bg-gray-100">
    {/* Navigation */}
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">Groupify Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4 relative">
            <span className="text-gray-700">
              Welcome, {currentUser?.displayName || currentUser?.email}
            </span>

            {/* Notification Bell */}
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


            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-10 right-0 w-64 bg-white shadow-lg rounded-md border z-50">
                <div className="p-4 border-b font-semibold text-gray-700">
                  Notifications
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  <li className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer">
                    Friend request from Alice
                  </li>
                  <li className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer">
                    Trip update from "Rome Trip"
                  </li>
                  <li className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer">
                    New comment on your photo
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Trips Section */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">My Trips</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create New Trip
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="text-center py-8">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-600">Loading your trips...</p>
            </div>
          ) : (
            <div>
              {trips.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
                  <p className="text-gray-600 mb-4">Create your first trip to start organizing your photos</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Create New Trip
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trips.map((trip) => (
                    <div key={trip.id} onClick={() => setSelectedTrip(trip.id)} className="cursor-pointer">
                      <TripCard trip={trip} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>


        {/* Notifications Section */}
        {pendingInvites.length > 0 && (
  <div className="bg-white p-4 rounded shadow mb-6">
    <h2 className="text-lg font-bold mb-3">Trip Invitations</h2>
    <ul className="space-y-2">
      {pendingInvites.map((invite) => (
        <li key={invite.id} className="flex justify-between items-center">
          <span>
             {invite.inviterName} invited you to join trip <strong>{invite.tripName}</strong>
          </span>
          <div className="space-x-2">
<button
  onClick={async () => {
    await acceptTripInvite(invite.id, currentUser.uid);
    setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
  }}
  className="bg-green-500 text-white px-3 py-1 rounded text-sm"
>
  Accept
</button>

            <button
              onClick={async () => {
                await declineTripInvite(invite.id);
                setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
              }}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              Decline
            </button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}


        {/* Add Friend Button + Modal */}
<div className="px-4 sm:px-0 mb-8">
  <button
    onClick={() => setShowAddFriendModal(true)}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
  >
    Add Friend
  </button>

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
</div>


{/* My Friends Section */}
<div className="px-4 sm:px-0 mb-8">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">My Friends</h2>
  {friends.length === 0 ? (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-gray-500">You have no friends yet.</p>
    </div>
  ) : (
    <div className="bg-white rounded-lg shadow p-4">
      <ul className="divide-y divide-gray-200">
        {friends.map((friend) => (
          <li key={friend.uid || friend.id} className="py-2 flex justify-between items-center">
            <span>{friend.displayName || friend.email || friend.uid || friend.id}</span>
            <button
              onClick={() => handleRemoveFriend(friend.uid || friend.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>


{/* Pending Requests Section */}
<div className="px-4 sm:px-0 mb-8">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Friend Requests</h2>
  {pendingRequests.length === 0 ? (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-gray-500">No pending requests.</p>
    </div>
  ) : (
    <div className="bg-white rounded-lg shadow p-4">
      <ul className="divide-y divide-gray-200">
        {pendingRequests.map((req) => (
          <li key={req.from} className="py-2 flex justify-between items-center">
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
    </div>
  )}
</div>


        {/* Photo Upload Section */}
        {trips.length > 0 && (
          <div className="px-4 sm:px-0">
            <button
              onClick={() => setShowUploadSection(!showUploadSection)}
              className="w-full flex items-center justify-center py-3 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {showUploadSection ? 'Hide Upload Section' : 'Upload Photos'}
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
                    value={selectedTrip || ''}
                    onChange={(e) => setSelectedTrip(e.target.value)}
                  >
                    <option value="" disabled>Select a trip</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>{trip.name}</option>
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
                    <p className="text-gray-600">Please select a trip to upload photos</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTripCreated={handleTripCreated}
      />
    </div>
  );
};



export default Dashboard;



