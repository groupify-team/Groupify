// services/tripsService.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@shared/services/firebase/config';

// Constants
export const MAX_TRIPS_PER_USER = 10;
export const MAX_PHOTOS_PER_TRIP = 200;

// 🔥 TRIP CRUD OPERATIONS

/**
 * Get all trips for a user
 */
export const getUserTrips = async (userId) => {
  try {
    const q = query(
      collection(db, 'trips'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching user trips:', error);
    throw new Error('Failed to fetch trips');
  }
};

/**
 * Get a single trip by ID
 */
export const getTrip = async (tripId) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      };
    } else {
      throw new Error('Trip not found');
    }
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw new Error('Failed to fetch trip');
  }
};

/**
 * Create a new trip
 */
export const createTrip = async (tripData) => {
  try {
    const docRef = await addDoc(collection(db, 'trips'), {
      ...tripData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      photoCount: 0,
      status: 'active',
    });
    
    return {
      id: docRef.id,
      ...tripData,
      createdAt: new Date(),
      updatedAt: new Date(),
      photoCount: 0,
      status: 'active',
    };
  } catch (error) {
    console.error('Error creating trip:', error);
    throw new Error('Failed to create trip');
  }
};

/**
 * Update a trip
 */
export const updateTrip = async (tripId, updateData) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    
    return { id: tripId, ...updateData, updatedAt: new Date() };
  } catch (error) {
    console.error('Error updating trip:', error);
    throw new Error('Failed to update trip');
  }
};

/**
 * Delete a trip
 */
export const deleteTrip = async (tripId) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    await deleteDoc(docRef);
    return tripId;
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw new Error('Failed to delete trip');
  }
};

//  TRIP MEMBER OPERATIONS

/**
 * Add member to trip
 */
export const addTripMember = async (tripId, userId) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    await updateDoc(docRef, {
      members: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding trip member:', error);
    throw new Error('Failed to add member to trip');
  }
};

/**
 * Remove member from trip
 */
export const removeTripMember = async (tripId, userId) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    await updateDoc(docRef, {
      members: arrayRemove(userId),
      admins: arrayRemove(userId), // Also remove from admins if they were one
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing trip member:', error);
    throw new Error('Failed to remove member from trip');
  }
};

/**
 * Promote member to admin
 */
export const promoteToAdmin = async (tripId, userId) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    await updateDoc(docRef, {
      admins: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error promoting to admin:', error);
    throw new Error('Failed to promote member to admin');
  }
};

/**
 * Demote admin to member
 */
export const demoteFromAdmin = async (tripId, userId) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    await updateDoc(docRef, {
      admins: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error demoting from admin:', error);
    throw new Error('Failed to demote admin');
  }
};

//  TRIP INVITATION OPERATIONS

/**
 * Send trip invitation
 */
export const sendTripInvite = async (tripId, fromUserId, toUserId) => {
  try {
    await addDoc(collection(db, 'tripInvites'), {
      tripId,
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending trip invite:', error);
    throw new Error('Failed to send trip invitation');
  }
};

/**
 * Get trip invitations for a user
 */
export const getTripInvitations = async (userId) => {
  try {
    const q = query(
      collection(db, 'tripInvites'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));
  } catch (error) {
    console.error('Error fetching trip invitations:', error);
    throw new Error('Failed to fetch trip invitations');
  }
};

/**
 * Accept trip invitation
 */
export const acceptTripInvite = async (inviteId, userId) => {
  try {
    // Update invitation status
    const inviteRef = doc(db, 'tripInvites', inviteId);
    await updateDoc(inviteRef, {
      status: 'accepted',
      respondedAt: serverTimestamp(),
    });
    
    // Get the invitation to find the trip
    const inviteDoc = await getDoc(inviteRef);
    const inviteData = inviteDoc.data();
    
    // Add user to trip members
    if (inviteData && inviteData.tripId) {
      await addTripMember(inviteData.tripId, userId);
    }
  } catch (error) {
    console.error('Error accepting trip invite:', error);
    throw new Error('Failed to accept trip invitation');
  }
};

/**
 * Decline trip invitation
 */
export const declineTripInvite = async (inviteId) => {
  try {
    const inviteRef = doc(db, 'tripInvites', inviteId);
    await updateDoc(inviteRef, {
      status: 'declined',
      respondedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error declining trip invite:', error);
    throw new Error('Failed to decline trip invitation');
  }
};

//  UTILITY FUNCTIONS

/**
 * Check if user can create more trips
 */
export const canUserCreateTrip = async (userId) => {
  try {
    const userTripCount = await getUserTripCount(userId);
    return userTripCount < MAX_TRIPS_PER_USER;
  } catch (error) {
    console.error('Error checking trip creation limit:', error);
    return false;
  }
};

/**
 * Get user's trip count
 */
export const getUserTripCount = async (userId) => {
  try {
    const q = query(
      collection(db, 'trips'),
      where('members', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.length;
  } catch (error) {
    console.error('Error getting user trip count:', error);
    return 0;
  }
};

/**
 * Filter trips by criteria
 */
export const filterTrips = (trips, filters) => {
  let filtered = [...trips];
  
  // Search by name, description, or location
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(trip => 
      trip.name?.toLowerCase().includes(searchTerm) ||
      trip.description?.toLowerCase().includes(searchTerm) ||
      trip.location?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Filter by date range
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    filtered = filtered.filter(trip => {
      if (!trip.startDate) return filters.dateRange === 'draft';
      
      const startDate = new Date(trip.startDate);
      const endDate = trip.endDate ? new Date(trip.endDate) : startDate;
      
      switch (filters.dateRange) {
        case 'upcoming':
          return startDate > now;
        case 'ongoing':
          return startDate <= now && endDate >= now;
        case 'completed':
          return endDate < now;
        default:
          return true;
      }
    });
  }
  
  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(trip => trip.status === filters.status);
  }
  
  return filtered;
};

/**
 * Sort trips by criteria
 */
export const sortTrips = (trips, sortBy = 'newest') => {
  const sorted = [...trips];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'name':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'date':
      return sorted.sort((a, b) => {
        const aDate = a.startDate ? new Date(a.startDate) : new Date(0);
        const bDate = b.startDate ? new Date(b.startDate) : new Date(0);
        return bDate - aDate;
      });
    default:
      return sorted;
  }
};
