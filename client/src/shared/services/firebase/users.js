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
        events: [],
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
      const userData = userSnapshot.data();
      return {
        uid: uid, // Ensure uid is always included
        id: uid, // Add id field for compatibility
        ...userData,
      };
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
}; // Clean up invalid friends (including non-mutual friendships)
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

          if (friendsFriends.includes(uid)) {
            validFriendIds.push(friendId);
          }
          // Non-mutual friendship, don't include in valid IDs
        }
        // Friend document doesn't exist, don't include in valid IDs
      } catch (error) {
        console.error(`Error checking friend ${friendId}:`, error);
      }
    }
    if (validFriendIds.length !== friendIds.length) {
      await updateDoc(userRef, {
        friends: validFriendIds,
        updatedAt: new Date().toISOString(),
      });
    }
    return validFriendIds;
  } catch (error) {
    console.error("Error cleaning up friends:", error);
    throw error;
  }
};

// Retrieve all friends with mutual friendship validation
export const getFriends = async (uid) => {
  console.log(`getFriends called for user: ${uid}`);

  try {
    if (!uid) {
      console.error("getFriends called with no uid");
      return [];
    }

    // Skip cleanup for now as it may cause performance issues
    // await cleanupInvalidFriends(uid);

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`⚠️ User document for ${uid} not found in getFriends`);
      return [];
    }

    const userData = userSnap.data();
    const friendIds = userData.friends || [];

    console.log(`Found ${friendIds.length} friend IDs for user ${uid}`);

    if (friendIds.length === 0) {
      return [];
    }

    const invalidFriendIds = []; // Track friends to remove

    // Use Promise.all for better performance when fetching friend profiles
    const friendPromises = friendIds.map(async (fid) => {
      if (!fid || typeof fid !== "string" || fid.trim() === "") {
        invalidFriendIds.push(fid);
        return null; // Skip invalid IDs
      }

      try {
        const fRef = doc(db, "users", fid);
        const fSnap = await getDoc(fRef);

        if (fSnap.exists()) {
          const fData = fSnap.data();
          const friendsFriends = fData.friends || [];

          // ✅ CHECK MUTUAL FRIENDSHIP: Verify that the friend also has current user in their friends list
          if (friendsFriends.includes(uid)) {
            return {
              uid: fid,
              id: fid, // Add id field for compatibility
              displayName: fData.displayName || fData.email || fid,
              email: fData.email || "",
              photoURL: fData.photoURL || "",
            };
          } else {
            console.warn(
              `⚠️ Non-mutual friendship: ${uid} -> ${fid}. Friend ${fid} doesn't have ${uid} in their list.`
            );
            invalidFriendIds.push(fid);
            return null;
          }
        } else {
          console.warn(`⚠️ Friend document doesn't exist: ${fid}`);
          invalidFriendIds.push(fid);
          return null;
        }
      } catch (error) {
        console.error(`Error fetching friend ${fid}:`, error);
        return null;
      }
    });

    // Wait for all friend profile fetches to complete
    const friendResults = await Promise.all(friendPromises);
    const validFriends = friendResults.filter((friend) => friend !== null);

    console.log(
      `Found ${validFriends.length} valid friends out of ${friendIds.length} total`
    );

    // Clean up invalid/non-mutual friendships only if we found problems
    if (invalidFriendIds.length > 0) {
      console.log(
        `Cleaning up ${invalidFriendIds.length} invalid friend references`
      );
      try {
        const validFriendIds = friendIds.filter(
          (id) => !invalidFriendIds.includes(id)
        );

        await updateDoc(userRef, {
          friends: validFriendIds,
          updatedAt: new Date().toISOString(),
        });
      } catch (updateError) {
        console.error("Error updating invalid friends:", updateError);
        // Continue anyway - we still want to return the valid friends
      }
    }

    return validFriends;
  } catch (error) {
    console.error("❌ Error getting friends:", error);
    // Return empty array instead of throwing - more resilient for UI
    return [];
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

// Add user to event members
export const addUserToEvent = async (uid, eventId) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      events: arrayUnion(eventId),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error adding user to event:", error);
    throw error;
  }
};

// Remove user from event members
export const removeUserFromEvent = async (uid, eventId) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      events: arrayRemove(eventId),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error removing user from event:", error);
    throw error;
  }
};

// Clean up user events array (remove non-existent events)
export const cleanupUserevents = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.warn("⚠️ User document not found:", uid);
      return;
    }

    const userData = userDoc.data();
    const usereventIds = userData.events || [];

    if (usereventIds.length === 0) {
      return;
    }

    // Check which events actually exist
    const valideventIds = [];

    for (const eventId of usereventIds) {
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);

      if (eventDoc.exists()) {
        valideventIds.push(eventId);
      }
    }

    // Update user's events array with only valid events
    if (valideventIds.length !== usereventIds.length) {
      await updateDoc(userRef, {
        events: valideventIds,
        updatedAt: new Date().toISOString(),
      });
    }

    return valideventIds;
  } catch (error) {
    console.error("❌ Error cleaning up user events:", error);
    throw error;
  }
};

// Get user's actual events (with validation)
export const getUserEventsWithValidation = async (uid) => {
  try {
    // First clean up any stale event references
    const valideventIds = await cleanupUserevents(uid);

    if (!valideventIds || valideventIds.length === 0) {
      return [];
    }

    // Fetch the actual event documents
    const events = [];

    for (const eventId of valideventIds) {
      try {
        const eventRef = doc(db, "events", eventId);
        const eventDoc = await getDoc(eventRef);

        if (eventDoc.exists()) {
          events.push({
            id: eventDoc.id,
            ...eventDoc.data(),
          });
        } else {
          console.warn(
            `⚠️ event document ${eventId} not found, but was in user's array`
          );
        }
      } catch (error) {
        console.error(`Error fetching event ${eventId}:`, error);
      }
    }

    return events;
  } catch (error) {
    console.error("❌ Error getting user events with validation:", error);

    // Fallback: try to get events without validation
    try {
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const eventIds = userData.events || [];

        const events = [];
        for (const eventId of eventIds) {
          try {
            const eventRef = doc(db, "events", eventId);
            const eventDoc = await getDoc(eventRef);

            if (eventDoc.exists()) {
              events.push({
                id: eventDoc.id,
                ...eventDoc.data(),
              });
            }
          } catch (eventError) {
            console.warn(`⚠️ Could not fetch event ${eventId}:`, eventError);
          }
        }

        return events;
      }
    } catch (fallbackError) {
      console.error("❌ Fallback event retrieval also failed:", fallbackError);
    }

    return [];
  }
};

// Remove event from ALL users who have it
export const removeEventFromAllUsers = async (eventId) => {
  try {
    // Query all users who have this event in their events array
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("events", "array-contains", eventId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return;
    }

    // Remove the event from each user's events array
    const updatePromises = [];

    querySnapshot.forEach((userDoc) => {
      const userRef = doc(db, "users", userDoc.id);
      updatePromises.push(
        updateDoc(userRef, {
          events: arrayRemove(eventId),
          updatedAt: new Date().toISOString(),
        })
      );
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("❌ Error removing event from users:", error);
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
