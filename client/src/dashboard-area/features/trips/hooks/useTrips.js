// hooks/useTrips.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@auth/contexts/AuthContext';
import {
  getUserTrips,
  getTrip,
  getTripInvitations,
  getTripStats,
  filterTrips,
  sortTrips,
} from '../services/tripsService';

/**
 * Main hook for managing trip data and state
 */
export const useTrips = () => {
  const { currentUser } = useAuth();
  
  // Core state
  const [trips, setTrips] = useState([]);
  const [tripInvitations, setTripInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering and sorting state
  const [filters, setFilters] = useState({
    search: '',
    dateRange: 'all',
    status: 'all',
  });
  const [sortBy, setSortBy] = useState('newest');
  
  // Derived state
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [tripStats, setTripStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
  });

  /**
   * Fetch all trips for the current user
   */
  const fetchTrips = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userTrips = await getUserTrips(currentUser.uid);
      setTrips(userTrips);
      
      // Calculate stats
      const stats = calculateTripStats(userTrips);
      setTripStats(stats);
      
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  /**
   * Fetch trip invitations
   */
  const fetchTripInvitations = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      const invitations = await getTripInvitations(currentUser.uid);
      setTripInvitations(invitations);
    } catch (err) {
      console.error('Error fetching trip invitations:', err);
    }
  }, [currentUser?.uid]);

  /**
   * Calculate trip statistics
   */
  const calculateTripStats = useCallback((tripsData) => {
    const now = new Date();
    
    const stats = tripsData.reduce((acc, trip) => {
      acc.total++;
      
      if (!trip.startDate) {
        acc.draft = (acc.draft || 0) + 1;
        return acc;
      }
      
      const startDate = new Date(trip.startDate);
      const endDate = trip.endDate ? new Date(trip.endDate) : startDate;
      
      if (endDate < now) {
        acc.completed++;
      } else if (startDate > now) {
        acc.upcoming++;
      } else {
        acc.ongoing++;
      }
      
      return acc;
    }, {
      total: 0,
      upcoming: 0,
      ongoing: 0,
      completed: 0,
      draft: 0,
    });
    
    return stats;
  }, []);

  /**
   * Apply filters and sorting to trips
   */
  const applyFiltersAndSort = useCallback(() => {
    let result = filterTrips(trips, filters);
    result = sortTrips(result, sortBy);
    setFilteredTrips(result);
  }, [trips, filters, sortBy]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      dateRange: 'all',
      status: 'all',
    });
  }, []);

  /**
   * Refresh all trip data
   */
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchTrips(),
      fetchTripInvitations(),
    ]);
  }, [fetchTrips, fetchTripInvitations]);

  /**
   * Add a trip to the local state (for optimistic updates)
   */
  const addTripToState = useCallback((newTrip) => {
    setTrips(prev => [newTrip, ...prev]);
  }, []);

  /**
   * Update a trip in the local state
   */
  const updateTripInState = useCallback((tripId, updateData) => {
    setTrips(prev => prev.map(trip => 
      trip.id === tripId 
        ? { ...trip, ...updateData }
        : trip
    ));
  }, []);

  /**
   * Remove a trip from the local state
   */
  const removeTripFromState = useCallback((tripId) => {
    setTrips(prev => prev.filter(trip => trip.id !== tripId));
  }, []);

  /**
   * Remove a trip invitation from state
   */
  const removeInvitationFromState = useCallback((invitationId) => {
    setTripInvitations(prev => prev.filter(inv => inv.id !== invitationId));
  }, []);

  /**
   * Get a specific trip by ID
   */
  const getTripById = useCallback((tripId) => {
    return trips.find(trip => trip.id === tripId) || null;
  }, [trips]);

  /**
   * Check if user has any trips
   */
  const hasTrips = trips.length > 0;

  /**
   * Check if user has pending invitations
   */
  const hasPendingInvitations = tripInvitations.length > 0;

  // Effects
  useEffect(() => {
    if (currentUser?.uid) {
      refreshData();
    }
  }, [currentUser?.uid, refreshData]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // Return all the state and functions
  return {
    // Core data
    trips,
    tripInvitations,
    filteredTrips,
    tripStats,
    
    // State
    loading,
    error,
    filters,
    sortBy,
    
    // Computed values
    hasTrips,
    hasPendingInvitations,
    
    // Actions
    fetchTrips,
    fetchTripInvitations,
    refreshData,
    updateFilters,
    clearFilters,
    setSortBy,
    
    // State mutations (for optimistic updates)
    addTripToState,
    updateTripInState,
    removeTripFromState,
    removeInvitationFromState,
    
    // Utilities
    getTripById,
  };
};
