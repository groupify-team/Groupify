import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";
import { db, storage } from "./config";
import {
  addUserToTrip,
  removeUserFromTrip,
  removeTripFromAllUsers,
  getUserTripsWithValidation,
} from "./users";

// Constants
const MAX_TRIPS_PER_USER = 5;
const MAX_PHOTOS_PER_TRIP = 30;

// Function to check user's trip count
export const getUserTripCount = async (userId) => {
  try {
    const q = query(collection(db, "trips"), where("createdBy", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting user trip count:", error);
    throw error;
  }
};

// Function to check if user can create more trips
export const canUserCreateTrip = async (userId) => {
  try {
    const tripCount = await getUserTripCount(userId);
    return tripCount < MAX_TRIPS_PER_USER;
  } catch (error) {
    console.error("Error checking trip creation permission:", error);
    return false;
  }
};

// Function to get trip photo count
export const getTripPhotoCount = async (tripId) => {
  try {
    const q = query(
      collection(db, "tripPhotos"),
      where("tripId", "==", tripId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting trip photo count:", error);
    return 0;
  }
};

// Function to check if trip can accept more photos
export const canTripAcceptMorePhotos = async (tripId, additionalPhotos = 1) => {
  try {
    const currentPhotoCount = await getTripPhotoCount(tripId);
    return currentPhotoCount + additionalPhotos <= MAX_PHOTOS_PER_TRIP;
  } catch (error) {
    console.error("Error checking photo limit:", error);
    return false;
  }
};

// Create a new trip
export const createTrip = async (tripData) => {
  try {
    // Create the trip document
    const tripRef = doc(collection(db, "trips"));
    const tripId = tripRef.id;

    const newTrip = {
      ...tripData,
      id: tripId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photoCount: 0,
      members: [tripData.createdBy],
      admins: [tripData.createdBy],
    };

    await setDoc(tripRef, newTrip);

    // Add trip to user's trips array
    await addUserToTrip(tripData.createdBy, tripId);

    return newTrip;
  } catch (error) {
    console.error("❌ Error creating trip:", error);
    throw error;
  }
};

// Get a trip by ID
export const getTrip = async (tripId) => {
  try {
    const tripDoc = await getDoc(doc(db, "trips", tripId));

    if (!tripDoc.exists()) {
      throw new Error("Trip not found");
    }

    return {
      id: tripDoc.id,
      ...tripDoc.data(),
    };
  } catch (error) {
    console.error("Error getting trip:", error);
    throw error;
  }
};

// Update a trip
export const updateTrip = async (tripId, updates) => {
  try {
    await updateDoc(doc(db, "trips", tripId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return {
      id: tripId,
      ...updates,
    };
  } catch (error) {
    console.error("Error updating trip:", error);
    throw error;
  }
};

// Enhanced delete trip function with Storage cleanup
export const deleteTrip = async (tripId) => {
  try {
    // 1. Remove trip from all users' trips arrays FIRST
    await removeTripFromAllUsers(tripId);

    // 2. Delete trip photos from Firestore
    const tripPhotosQuery = query(
      collection(db, "tripPhotos"),
      where("tripId", "==", tripId)
    );
    const tripPhotosSnapshot = await getDocs(tripPhotosQuery);

    const deletePhotoPromises = tripPhotosSnapshot.docs.map((photoDoc) =>
      deleteDoc(photoDoc.ref)
    );

    await Promise.all(deletePhotoPromises);

    // 3. Delete photos from Firebase Storage (if any exist)
    try {
      const tripPhotosRef = ref(storage, `trip_photos/${tripId}/`);
      const photosList = await listAll(tripPhotosRef);

      if (photosList.items.length > 0) {
        const deleteStoragePromises = photosList.items.map((photoRef) =>
          deleteObject(photoRef)
        );

        await Promise.all(deleteStoragePromises);
      }
    } catch (storageError) {
      console.warn("⚠️ Error deleting trip photos from Storage:", storageError);
      // Don't fail the entire deletion if storage cleanup fails
    }

    // 4. Delete trip invitations
    const invitesQuery = query(
      collection(db, "tripInvites"),
      where("tripId", "==", tripId)
    );
    const invitesSnapshot = await getDocs(invitesQuery);

    const deleteInvitePromises = invitesSnapshot.docs.map((inviteDoc) =>
      deleteDoc(inviteDoc.ref)
    );

    await Promise.all(deleteInvitePromises);

    // 5. Delete the main trip document
    const tripRef = doc(db, "trips", tripId);
    await deleteDoc(tripRef);
  } catch (error) {
    console.error("❌ Error deleting trip:", error);
    throw error;
  }
};

// Get all trips for a user
export const getUserTrips = async (uid) => {
  try {
    // Use the new validation function instead of the old query
    const trips = await getUserTripsWithValidation(uid);

    // Sort trips by creation date (newest first)
    trips.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    return trips;
  } catch (error) {
    console.error("❌ Error getting user trips:", error);
    throw error;
  }
};

// Add a member to a trip
export const addTripMember = async (tripId, userId) => {
  try {
    const tripDoc = await getDoc(doc(db, "trips", tripId));

    if (!tripDoc.exists()) {
      throw new Error("Trip not found");
    }

    const tripData = tripDoc.data();
    const members = tripData.members || [];

    if (!members.includes(userId)) {
      members.push(userId);
      await updateDoc(doc(db, "trips", tripId), {
        members,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      id: tripId,
      ...tripData,
      members,
    };
  } catch (error) {
    console.error("Error adding trip member:", error);
    throw error;
  }
};

export const inviteUserToTripByUid = async (tripId, userId) => {
  try {
    const tripRef = doc(db, "trips", tripId);
    await updateDoc(tripRef, {
      members: arrayUnion(userId),
    });
  } catch (error) {
    console.error("❌ Error inviting user:", error);
    throw error;
  }
};

export const sendTripInvite = async (tripId, inviterUid, inviteeUid) => {
  const inviteData = {
    tripId,
    inviterUid,
    inviteeUid,
    status: "pending",
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, "tripInvites"), inviteData);
};

export const getPendingInvites = async (uid) => {
  const q = query(
    collection(db, "tripInvites"),
    where("inviteeUid", "==", uid),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);
  const invites = [];

  for (const docSnap of snapshot.docs) {
    const invite = docSnap.data();

    let tripName = invite.tripId;
    let inviterName = invite.inviterUid;

    try {
      const tripRef = doc(db, "trips", invite.tripId);
      const tripSnap = await getDoc(tripRef);
      if (tripSnap.exists()) {
        tripName = tripSnap.data().name?.trim() || tripName;
      }
    } catch (e) {
      console.warn("⚠️ Failed to fetch trip name:", invite.tripId);
    }

    try {
      const inviterRef = doc(db, "users", invite.inviterUid);
      const inviterSnap = await getDoc(inviterRef);
      if (inviterSnap.exists()) {
        inviterName = inviterSnap.data().displayName || inviterName;
      }
    } catch (e) {
      console.warn("⚠️ Failed to fetch inviter:", invite.inviterUid);
    }

    invites.push({
      id: docSnap.id,
      ...invite,
      tripName,
      inviterName,
    });
  }

  return invites;
};

export const acceptTripInvite = async (inviteId, userId) => {
  const inviteRef = doc(db, "tripInvites", inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("Invite not found");

  const { tripId } = inviteSnap.data();
  const tripRef = doc(db, "trips", tripId);

  await updateDoc(tripRef, {
    members: arrayUnion(userId),
  });

  await deleteDoc(inviteRef);
};

export const declineTripInvite = async (inviteId) => {
  await updateDoc(doc(db, "tripInvites", inviteId), {
    status: "declined",
  });
};

// Export constants for use in components
export { MAX_TRIPS_PER_USER, MAX_PHOTOS_PER_TRIP };
