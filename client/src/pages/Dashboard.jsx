import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserTrips } from '../services/firebase/trips';
import TripCard from '../components/trips/TripCard';
import CreateTripModal from '../components/trips/CreateTripModal';
import PhotoUpload from '../components/photos/PhotoUpload';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);


  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const userTrips = await getUserTrips(currentUser.uid);
        setTrips(userTrips);
      } catch (error) {
        console.error('Error fetching trips:', error);
        setError('Failed to load your trips. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
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

  const handlePhotoUploaded = (uploadedPhotos) => {
    // Update trip's photoCount (optional)
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
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {currentUser?.displayName || currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
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