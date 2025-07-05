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
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    throw error;
  }
};

// Clean up invalid friends (including non-mutual friendships)
export const cleanupInvalidFriends = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.warn("⚠️ User document not found:", uid);
      return;
    }

    const userData = userDoc.data();
    const friendIds = userData.friends || [];

    if (friendIds.length === 0) {
      return;
    }

    const validFriendIds = [];

    for (const friendId of friendIds) {
      // Skip empty, null, or invalid friend IDs
      if (!friendId || typeof friendId !== "string" || friendId.trim() === "") {
        continue;
      }

      try {
        const friendRef = doc(db, "users", friendId);
        const friendDoc = await getDoc(friendRef);

        if (friendDoc.exists()) {
          const friendData = friendDoc.data();
          const friendsFriends = friendData.friends || [];

          // ✅ CHECK MUTUAL FRIENDSHIP
          if (friendsFriends.includes(uid)) {
            validFriendIds.push(friendId);
          } else {
          }
        } else {
        }
      } catch (error) {
        console.error(`❌ Error checking friend ${friendId}:`, error);
        // Don't include this friend if there's an error
      }
    }

    // Update user document with only valid, mutual friend IDs
    if (validFriendIds.length !== friendIds.length) {
      await updateDoc(userRef, {
        friends: validFriendIds,
        updatedAt: new Date().toISOString(),
      });
    }
    return validFriendIds;
  } catch (error) {
    console.error("❌ Error cleaning up friends:", error);
    throw error;
  }
};

// Retrieve all friends with mutual friendship validation
export const getFriends = async (uid) => {
  try {
    // First, cleanup any invalid friend references
    await cleanupInvalidFriends(uid);

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn("⚠️ No user document found");
      return [];
    }

    const friendIds = userSnap.data().friends || [];
    const friends = [];
    const invalidFriendIds = []; // Track friends to remove

    for (const fid of friendIds) {
      if (!fid || typeof fid !== "string" || fid.trim() === "") {
        invalidFriendIds.push(fid);
        continue; // Skip invalid IDs
      }

      const fRef = doc(db, "users", fid);
      const fSnap = await getDoc(fRef);

      if (fSnap.exists()) {
        const fData = fSnap.data();
        const friendsFriends = fData.friends || [];

        // ✅ CHECK MUTUAL FRIENDSHIP: Verify that the friend also has current user in their friends list
        if (friendsFriends.includes(uid)) {
          friends.push({
            uid: fid,
            displayName: fData.displayName || fData.email || fid,
            email: fData.email || "",
            photoURL: fData.photoURL || "",
          });
        } else {
          // ❌ FRIENDSHIP IS NOT MUTUAL: Friend removed current user but current user still has them
          console.warn(
            `⚠️ Non-mutual friendship detected: ${uid} -> ${fid}. Friend ${fid} doesn't have ${uid} in their friends list.`
          );
          invalidFriendIds.push(fid);
        }
      } else {
        // Friend document doesn't exist
        console.warn(`⚠️ Friend document doesn't exist: ${fid}`);
        invalidFriendIds.push(fid);
      }
    }

    // Clean up invalid/non-mutual friendships from current user's friends array
    if (invalidFriendIds.length > 0) {
      const validFriendIds = friendIds.filter(
        (id) => !invalidFriendIds.includes(id)
      );

      await updateDoc(userRef, {
        friends: validFriendIds,
        updatedAt: new Date().toISOString(),
      });
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

    // Remove friend from both users' friends arrays
    await updateDoc(userRef, {
      friends: arrayRemove(friendUid),
      updatedAt: new Date().toISOString(),
    });

    await updateDoc(friendRef, {
      friends: arrayRemove(uid),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error removing friend:", error);
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
      return;
    }

    // Check which trips actually exist
    const validTripIds = [];

    for (const tripId of userTripIds) {
      const tripRef = doc(db, "trips", tripId);
      const tripDoc = await getDoc(tripRef);

      if (tripDoc.exists()) {
        validTripIds.push(tripId);
      }
    }

    // Update user's trips array with only valid trips
    if (validTripIds.length !== userTripIds.length) {
      await updateDoc(userRef, {
        trips: validTripIds,
        updatedAt: new Date().toISOString(),
      });
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
    // First clean up any stale trip references
    const validTripIds = await cleanupUserTrips(uid);

    if (!validTripIds || validTripIds.length === 0) {
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
            ...tripDoc.data(),
          });
        } else {
          console.warn(
            `⚠️ Trip document ${tripId} not found, but was in user's array`
          );
        }
      } catch (error) {
        console.error(`❌ Error fetching trip ${tripId}:`, error);
      }
    }

    return trips;
  } catch (error) {
    console.error("❌ Error getting user trips with validation:", error);

    // Fallback: try to get trips without validation
    try {
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
                ...tripDoc.data(),
              });
            }
          } catch (tripError) {
            console.warn(`⚠️ Could not fetch trip ${tripId}:`, tripError);
          }
        }

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
    // Query all users who have this trip in their trips array
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("trips", "array-contains", tripId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
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
    });

    await Promise.all(updatePromises);
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
