import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, 
  query, where, getDocs, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// Create a new trip
export const createTrip = async (tripData) => {
  try {
    const tripRef = await addDoc(collection(db, 'trips'), {
      ...tripData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return {
      id: tripRef.id,
      ...tripData
    };
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

// Get a trip by ID
export const getTrip = async (tripId) => {
  try {
    const tripDoc = await getDoc(doc(db, 'trips', tripId));
    
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }
    
    return {
      id: tripDoc.id,
      ...tripDoc.data()
    };
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
};

// Update a trip
export const updateTrip = async (tripId, updates) => {
  try {
    await updateDoc(doc(db, 'trips', tripId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return {
      id: tripId,
      ...updates
    };
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

// Delete a trip
export const deleteTrip = async (tripId) => {
  try {
    await deleteDoc(doc(db, 'trips', tripId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

// Get all trips for a user
export const getUserTrips = async (userId) => {
  try {
    const tripsQuery = query(
      collection(db, 'trips'),
      where('members', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(tripsQuery);
    const trips = [];
    
    querySnapshot.forEach((doc) => {
      trips.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return trips;
  } catch (error) {
    console.error('Error getting user trips:', error);
    throw error;
  }
};

// Add a member to a trip
export const addTripMember = async (tripId, userId) => {
  try {
    const tripDoc = await getDoc(doc(db, 'trips', tripId));
    
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }
    
    const tripData = tripDoc.data();
    const members = tripData.members || [];
    
    if (!members.includes(userId)) {
      members.push(userId);
      await updateDoc(doc(db, 'trips', tripId), {
        members,
        updatedAt: new Date().toISOString()
      });
    }
    
    return {
      id: tripId,
      ...tripData,
      members
    };
  } catch (error) {
    console.error('Error adding trip member:', error);
    throw error;
  }
};


export const inviteUserToTripByUid = async (tripId, userId) => {
  try {
    const tripRef = doc(db, "trips", tripId);
    await updateDoc(tripRef, {
      members: arrayUnion(userId),
    });
    console.log("✅ User invited to trip");
  } catch (error) {
    console.error("❌ Error inviting user:", error);
    throw error;
  }
};


export const sendTripInvite = async (tripId, inviterUid, inviteeUid) => {
  await addDoc(collection(db, "tripInvites"), {
    tripId,
    inviterUid,
    inviteeUid,
    status: "pending",
    createdAt: serverTimestamp()
  });
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

    console.log("✅ invite loaded:", {
      tripName,
      inviterName,
      tripId: invite.tripId,
    });
  }

  return invites;
};





export const acceptTripInvite = async (inviteId, userId) => {
  console.log("🔁 Accepting invite:", { inviteId, userId });

  const inviteRef = doc(db, "tripInvites", inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("Invite not found");

  const { tripId } = inviteSnap.data();
  const tripRef = doc(db, "trips", tripId);

  await updateDoc(tripRef, {
    members: arrayUnion(userId),
  });

  await deleteDoc(inviteRef);
  console.log("✅ Invite accepted and user added to trip");
};



export const declineTripInvite = async (inviteId) => {
  await updateDoc(doc(db, "tripInvites", inviteId), {
    status: "declined"
  });
};
