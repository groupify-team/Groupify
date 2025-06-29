import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./config";

// Create or update user profile in Firestore
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      // Create new user profile with empty friends array
      const createdAt = new Date().toISOString();
      await setDoc(userRef, {
        uid,
        gender: userData.gender || "male", // default fallback
        ...userData,
        createdAt,
        trips: [],
        photoCount: 0,
        friends: [],
      });
    }

    return userRef;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      return userSnapshot.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Find users by email
export const findUsersByEmail = async (email) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    return users;
  } catch (error) {
    console.error("Error finding users:", error);
    throw error;
  }
};

// Sending a friend request
export const sendFriendRequest = async (fromUid, toUid) => {
  try {
    const requestRef = doc(db, "friendRequests", `${fromUid}_${toUid}`);
    await setDoc(requestRef, {
      from: fromUid,
      to: toUid,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
};

// Receive all requests waiting for the user
export const getPendingFriendRequests = async (uid) => {
  try {
    const q = query(
      collection(db, "friendRequests"),
      where("to", "==", uid),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);

    const requests = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      const senderRef = doc(db, "users", data.from);
      const senderSnap = await getDoc(senderRef);

      requests.push({
        id: docSnap.id,
        from: data.from,
        displayName: senderSnap.exists() ? senderSnap.data().displayName : "",
        email: senderSnap.exists() ? senderSnap.data().email : "",
        createdAt: data.createdAt,
      });
    }

    return requests;
  } catch (error) {
    console.error("Error getting friend requests:", error);
    return [];
  }
};

export async function cancelFriendRequest(fromUid, toUid) {
  const requestRef = doc(db, "friendRequests", `${fromUid}_${toUid}`);
  await deleteDoc(requestRef);
}

export const didISendRequest = async (fromUid, toUid) => {
  const requestRef = doc(db, "friendRequests", `${fromUid}_${toUid}`);
  const snapshot = await getDoc(requestRef);
  return snapshot.exists();
};


// Membership request approval

// Replace the acceptFriendRequest function in client/src/services/firebase/users.js

export const acceptFriendRequest = async (uid, senderUid) => {
  try {
    const requestId = `${senderUid}_${uid}`;
    const requestRef = doc(db, "friendRequests", requestId);

    // Delete the friend request first
    await deleteDoc(requestRef);

    // Add each user to the other's friends list (MUTUAL FRIENDSHIP)
    const userRef = doc(db, "users", uid); // Person accepting the request
    const senderRef = doc(db, "users", senderUid); // Person who sent the request

    // Add sender to receiver's friends list
    await updateDoc(userRef, {
      friends: arrayUnion(senderUid),
    });

    // Add receiver to sender's friends list (THIS WAS MISSING!)
    await updateDoc(senderRef, {
      friends: arrayUnion(uid),
    });

    console.log(`✅ Mutual friendship created between ${uid} and ${senderUid}`);
  } catch (error) {
    console.error("❌ Error accepting friend request:", error);
    throw error;
  }
};

// Declining membership request
export const rejectFriendRequest = async (uid, senderUid) => {
  try {
    const requestId = `${senderUid}_${uid}`;
    const requestRef = doc(db, "friendRequests", requestId);
    await deleteDoc(requestRef);

    console.log(`❌ Friend request rejected: ${senderUid} -> ${uid}`);
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    throw error;
  }
};

// Retrieve all members
export const getFriends = async (uid) => {
  console.log("🔍 getFriends called with UID:", uid);
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn("⚠️ No user document found");
      return [];
    }

    const friendIds = userSnap.data().friends || [];

    const friends = [];

    for (const fid of friendIds) {
      if (!fid) {
        console.warn("⚠️ Skipping invalid friend ID:", fid);
        continue;
      }

      const fRef = doc(db, "users", fid);
      const fSnap = await getDoc(fRef);

      if (fSnap.exists()) {
        const fData = fSnap.data();
        friends.push({
          uid: fid,
          displayName: fData.displayName || fData.email || fid,
          email: fData.email || "",
          photoURL: fData.photoURL || "",
        });
      } else {
        console.warn("⚠️ Friend doc not found for ID:", fid);
      }
    }

    return friends;
  } catch (error) {
    console.error("❌ Error getting friends:", error);
    throw error;
  }
};

export const removeFriend = async (uid, friendUid) => {
  try {
    const userRef = doc(db, "users", uid);
    const friendRef = doc(db, "users", friendUid);

    await updateDoc(userRef, {
      friends: arrayRemove(friendUid),
    });

    await updateDoc(friendRef, {
      friends: arrayRemove(uid),
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
};

// Add user to trip members
export const addUserToTrip = async (uid, tripId) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      trips: arrayUnion(tripId),
      updatedAt: new Date().toISOString(),
    });
    console.log(`✅ Added user ${uid} to trip ${tripId}`);
  } catch (error) {
    console.error("❌ Error adding user to trip:", error);
    throw error;
  }
};

// Remove user from trip members
export const removeUserFromTrip = async (uid, tripId) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      trips: arrayRemove(tripId),
      updatedAt: new Date().toISOString(),
    });
    console.log(`✅ Removed user ${uid} from trip ${tripId}`);
  } catch (error) {
    console.error("❌ Error removing user from trip:", error);
    throw error;
  }
};

// Clean up user trips array (remove non-existent trips)
export const cleanupUserTrips = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn("⚠️ User document not found:", uid);
      return;
    }
    
    const userData = userDoc.data();
    const userTripIds = userData.trips || [];
    
    if (userTripIds.length === 0) {
      console.log("ℹ️ No trips to clean up for user:", uid);
      return;
    }
    
    // Check which trips actually exist
    const validTripIds = [];
    
    for (const tripId of userTripIds) {
      const tripRef = doc(db, "trips", tripId);
      const tripDoc = await getDoc(tripRef);
      
      if (tripDoc.exists()) {
        validTripIds.push(tripId);
      } else {
        console.log(`🗑️ Removing non-existent trip ${tripId} from user ${uid}`);
      }
    }
    
    // Update user's trips array with only valid trips
    if (validTripIds.length !== userTripIds.length) {
      await updateDoc(userRef, {
        trips: validTripIds,
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`✅ Cleaned up trips for user ${uid}: ${userTripIds.length} -> ${validTripIds.length}`);
    }
    
    return validTripIds;
  } catch (error) {
    console.error("❌ Error cleaning up user trips:", error);
    throw error;
  }
};

// Get user's actual trips (with validation)
export const getUserTripsWithValidation = async (uid) => {
  try {
    console.log(`🔍 Getting trips with validation for user: ${uid}`);
    
    // First clean up any stale trip references
    const validTripIds = await cleanupUserTrips(uid);
    
    if (!validTripIds || validTripIds.length === 0) {
      console.log(`ℹ️ No valid trips found for user: ${uid}`);
      return [];
    }
    
    // Fetch the actual trip documents
    const trips = [];
    
    for (const tripId of validTripIds) {
      try {
        const tripRef = doc(db, "trips", tripId);
        const tripDoc = await getDoc(tripRef);
        
        if (tripDoc.exists()) {
          trips.push({
            id: tripDoc.id,
            ...tripDoc.data()
          });
        } else {
          console.warn(`⚠️ Trip document ${tripId} not found, but was in user's array`);
        }
      } catch (error) {
        console.error(`❌ Error fetching trip ${tripId}:`, error);
      }
    }
    
    console.log(`✅ Retrieved ${trips.length} valid trips for user ${uid}`);
    return trips;
  } catch (error) {
    console.error("❌ Error getting user trips with validation:", error);
    
    // Fallback: try to get trips without validation
    try {
      console.log("🔄 Attempting fallback trip retrieval...");
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const tripIds = userData.trips || [];
        
        const trips = [];
        for (const tripId of tripIds) {
          try {
            const tripRef = doc(db, "trips", tripId);
            const tripDoc = await getDoc(tripRef);
            
            if (tripDoc.exists()) {
              trips.push({
                id: tripDoc.id,
                ...tripDoc.data()
              });
            }
          } catch (tripError) {
            console.warn(`⚠️ Could not fetch trip ${tripId}:`, tripError);
          }
        }
        
        console.log(`✅ Fallback retrieval got ${trips.length} trips`);
        return trips;
      }
    } catch (fallbackError) {
      console.error("❌ Fallback trip retrieval also failed:", fallbackError);
    }
    
    return [];
  }
};

// Remove trip from ALL users who have it
export const removeTripFromAllUsers = async (tripId) => {
  try {
    console.log(`🔍 Finding users with trip ${tripId}...`);
    
    // Query all users who have this trip in their trips array
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("trips", "array-contains", tripId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`ℹ️ No users found with trip ${tripId}`);
      return;
    }
    
    // Remove the trip from each user's trips array
    const updatePromises = [];
    
    querySnapshot.forEach((userDoc) => {
      const userRef = doc(db, "users", userDoc.id);
      updatePromises.push(
        updateDoc(userRef, {
          trips: arrayRemove(tripId),
          updatedAt: new Date().toISOString(),
        })
      );
      console.log(`🗑️ Removing trip ${tripId} from user ${userDoc.id}`);
    });
    
    await Promise.all(updatePromises);
    
    console.log(`✅ Removed trip ${tripId} from ${querySnapshot.size} users`);
  } catch (error) {
    console.error("❌ Error removing trip from users:", error);
    throw error;
  }
};

// Update photoCount for user
export const updateUserPhotoCount = async (uid, increment = 1) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentCount = userDoc.data().photoCount || 0;
      await updateDoc(userRef, {
        photoCount: Math.max(0, currentCount + increment),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("❌ Error updating user photo count:", error);
    throw error;
  }
};