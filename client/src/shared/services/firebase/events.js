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
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import { db, storage } from "./config";

// Import user management functions
import {
  addUserToEvent,
  removeUserFromEvent,
  removeEventFromAllUsers,
  getUserEventsWithValidation,
} from "./users";

// Constants
const MAX_EVENTS_PER_USER = 5;
const MAX_PHOTOS_PER_EVENT = 30;

// Function to check user's event count
export const getUserEventCount = async (userId) => {
  try {
    const q = query(collection(db, "events"), where("createdBy", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting user event count:", error);
    throw error;
  }
};

// Function to check if user can Create More Events
export const canUserCreateEvent = async (userId) => {
  try {
    const eventCount = await getUserEventCount(userId);
    return eventCount < MAX_EVENTS_PER_USER;
  } catch (error) {
    console.error("Error checking event creation permission:", error);
    return false;
  }
};

// Function to get event photo count
export const getEventPhotoCount = async (eventId) => {
  try {
    const q = query(
      collection(db, "eventPhotos"),
      where("eventId", "==", eventId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting event photo count:", error);
    return 0;
  }
};

// Function to check if event can accept more photos
export const canEventAcceptMorePhotos = async (
  eventId,
  additionalPhotos = 1
) => {
  try {
    const currentPhotoCount = await getEventPhotoCount(eventId);
    return currentPhotoCount + additionalPhotos <= MAX_PHOTOS_PER_EVENT;
  } catch (error) {
    console.error("Error checking photo limit:", error);
    return false;
  }
};

// Create a new event
export const createEvent = async (eventData) => {
  try {
    // Create the event document
    const eventRef = doc(collection(db, "events"));
    const eventId = eventRef.id;

    const newEvent = {
      ...eventData,
      id: eventId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photoCount: 0,
      members: [eventData.createdBy],
      admins: [eventData.createdBy],
    };

    await setDoc(eventRef, newEvent);

    // Add event to user's events array
    await addUserToEvent(eventData.createdBy, eventId);

    return newEvent;
  } catch (error) {
    console.error("❌ Error creating event:", error);
    throw error;
  }
};

// Get a event by ID
export const getEvent = async (eventId) => {
  try {
    const eventDoc = await getDoc(doc(db, "events", eventId));

    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }

    return {
      id: eventDoc.id,
      ...eventDoc.data(),
    };
  } catch (error) {
    console.error("Error getting event:", error);
    throw error;
  }
};

// Update a event
export const updateEvent = async (eventId, updates) => {
  try {
    await updateDoc(doc(db, "events", eventId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return {
      id: eventId,
      ...updates,
    };
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

// Enhanced delete event function with Storage cleanup
export const deleteEvent = async (eventId) => {
  try {
    // 1. Remove event from all users' events arrays FIRST
    await removeEventFromAllUsers(eventId);

    // 2. Delete event photos from Firestore
    const eventPhotosQuery = query(
      collection(db, "eventPhotos"),
      where("eventId", "==", eventId)
    );
    const eventPhotosSnapshot = await getDocs(eventPhotosQuery);

    const deletePhotoPromises = eventPhotosSnapshot.docs.map((photoDoc) =>
      deleteDoc(photoDoc.ref)
    );

    await Promise.all(deletePhotoPromises);

    // 3. Delete photos from Firebase Storage (if any exist)
    try {
      const eventPhotosRef = ref(storage, `event_photos/${eventId}/`);
      const photosList = await listAll(eventPhotosRef);

      if (photosList.items.length > 0) {
        const deleteStoragePromises = photosList.items.map((photoRef) =>
          deleteObject(photoRef)
        );

        await Promise.all(deleteStoragePromises);
      }
    } catch (storageError) {
      console.warn(
        "⚠️ Error deleting event photos from Storage:",
        storageError
      );
      // Don't fail the entire deletion if storage cleanup fails
    }

    // 4. Delete event invitations
    const invitesQuery = query(
      collection(db, "eventInvites"),
      where("eventId", "==", eventId)
    );
    const invitesSnapshot = await getDocs(invitesQuery);

    const deleteInvitePromises = invitesSnapshot.docs.map((inviteDoc) =>
      deleteDoc(inviteDoc.ref)
    );

    await Promise.all(deleteInvitePromises);

    // 5. Delete the main event document
    const eventRef = doc(db, "events", eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    throw error;
  }
};

// Get all events for a user
export const getUserEvents = async (uid) => {
  try {
    // Use the new validation function instead of the old query
    const events = await getUserEventsWithValidation(uid);

    // Sort events by creation date (newest first)
    events.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    return events;
  } catch (error) {
    console.error("❌ Error getting user events:", error);
    throw error;
  }
};

// Add a member to a event
export const addEventMember = async (eventId, userId) => {
  try {
    const eventDoc = await getDoc(doc(db, "events", eventId));

    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }

    const eventData = eventDoc.data();
    const members = eventData.members || [];

    if (!members.includes(userId)) {
      members.push(userId);
      await updateDoc(doc(db, "events", eventId), {
        members,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      id: eventId,
      ...eventData,
      members,
    };
  } catch (error) {
    console.error("Error adding event member:", error);
    throw error;
  }
};

export const inviteUserToEventByUid = async (eventId, userId) => {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      members: arrayUnion(userId),
    });
  } catch (error) {
    console.error("❌ Error inviting user:", error);
    throw error;
  }
};

export const sendEventInvite = async (eventId, inviterUid, inviteeUid) => {
  const inviteData = {
    eventId,
    inviterUid,
    inviteeUid,
    status: "pending",
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, "eventInvites"), inviteData);
};

export const getPendingInvites = async (uid) => {
  const q = query(
    collection(db, "eventInvites"),
    where("inviteeUid", "==", uid),
    where("status", "==", "pending")
  );

  const snapshot = await getDocs(q);
  const invites = [];

  for (const docSnap of snapshot.docs) {
    const invite = docSnap.data();

    let eventName = invite.eventId;
    let inviterName = invite.inviterUid;

    try {
      const eventRef = doc(db, "events", invite.eventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        eventName = eventSnap.data().name?.trim() || eventName;
      }
    } catch (error) {
      console.warn("⚠️ Failed to fetch Event name:", invite.eventId, error);
    }

    try {
      const inviterRef = doc(db, "users", invite.inviterUid);
      const inviterSnap = await getDoc(inviterRef);
      if (inviterSnap.exists()) {
        inviterName = inviterSnap.data().displayName || inviterName;
      }
    } catch (error) {
      console.warn("⚠️ Failed to fetch inviter:", invite.inviterUid, error);
    }

    invites.push({
      id: docSnap.id,
      ...invite,
      eventName,
      inviterName,
    });
  }

  return invites;
};

export const acceptEventInvite = async (invitationId, userId) => {
  try {
    // Get the invitation document
    const inviteDoc = await getDoc(doc(db, "eventInvites", invitationId));

    if (!inviteDoc.exists()) {
      throw new Error("Invitation not found");
    }

    const inviteData = inviteDoc.data();
    const eventId = inviteData.eventId;

    // Update the invitation status
    await updateDoc(doc(db, "eventInvites", invitationId), {
      status: "accepted",
      acceptedAt: serverTimestamp(),
    });

    // Add user to event members
    await updateDoc(doc(db, "events", eventId), {
      members: arrayUnion(userId),
    });

    // Add event to user's events
    await addUserToEvent(userId, eventId);

    return { success: true };
  } catch (error) {
    console.error("Error accepting event invitation:", error);
    throw error;
  }
};

export const declineEventInvite = async (inviteId) => {
  await updateDoc(doc(db, "eventInvites", inviteId), {
    status: "declined",
    declinedAt: serverTimestamp(),
  });
};

// Remove a member from an event
export const removeMemberFromEvent = async (eventId, userId) => {
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      members: arrayRemove(userId),
      updatedAt: new Date().toISOString(),
    });

    // Also remove the event from the user's events list
    await removeUserFromEvent(userId, eventId);

    return true;
  } catch (error) {
    console.error("Error removing member from event:", error);
    throw error;
  }
};

// Get events by multiple IDs
export const getEventsByIds = async (eventIds) => {
  try {
    if (!eventIds || eventIds.length === 0) {
      return [];
    }

    const eventPromises = eventIds.map((eventId) => getEvent(eventId));
    const events = await Promise.all(eventPromises);

    return events.filter(Boolean); // Filter out any null/undefined results
  } catch (error) {
    console.error("Error getting events by IDs:", error);
    throw error;
  }
};

// Export constants for use in components
export { MAX_EVENTS_PER_USER, MAX_PHOTOS_PER_EVENT };
