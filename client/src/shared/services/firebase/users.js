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

export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      const createdAt = new Date().toISOString();
      await setDoc(userRef, {
        uid,
        gender: userData.gender || "male",
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

export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      return {
        uid: uid,
        id: uid,
        ...userData,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

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

export const acceptFriendRequest = async (uid, senderUid) => {
  try {
    const requestId = `${senderUid}_${uid}`;
    const requestRef = doc(db, "friendRequests", requestId);
    await deleteDoc(requestRef);
    const userRef = doc(db, "users", uid);
    const senderRef = doc(db, "users", senderUid);

    await updateDoc(userRef, {
      friends: arrayUnion(senderUid),
    });

    await updateDoc(senderRef, {
      friends: arrayUnion(uid),
    });
  } catch (error) {
    console.error("❌ Error accepting friend request:", error);
    throw error;
  }
};

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
        }
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

export const getFriends = async (uid) => {
  try {
    if (!uid) {
      console.error("getFriends called with no uid");
      return [];
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`⚠️ User document for ${uid} not found in getFriends`);
      return [];
    }

    const userData = userSnap.data();
    const friendIds = userData.friends || [];

    if (friendIds.length === 0) {
      return [];
    }

    const invalidFriendIds = [];
    const friendPromises = friendIds.map(async (fid) => {
      if (!fid || typeof fid !== "string" || fid.trim() === "") {
        invalidFriendIds.push(fid);
        return null;
      }

      try {
        const fRef = doc(db, "users", fid);
        const fSnap = await getDoc(fRef);

        if (fSnap.exists()) {
          const fData = fSnap.data();
          const friendsFriends = fData.friends || [];

          if (friendsFriends.includes(uid)) {
            return {
              uid: fid,
              id: fid,
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

    const friendResults = await Promise.all(friendPromises);
    const validFriends = friendResults.filter((friend) => friend !== null);

    if (invalidFriendIds.length > 0) {
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
      }
    }

    return validFriends;
  } catch (error) {
    console.error("❌ Error getting friends:", error);
    return [];
  }
};

export const removeFriend = async (uid, friendUid) => {
  try {
    const userRef = doc(db, "users", uid);
    const friendRef = doc(db, "users", friendUid);

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

    const valideventIds = [];

    for (const eventId of usereventIds) {
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);

      if (eventDoc.exists()) {
        valideventIds.push(eventId);
      }
    }

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

export const getUserEventsWithValidation = async (uid) => {
  try {
    const valideventIds = await cleanupUserevents(uid);

    if (!valideventIds || valideventIds.length === 0) {
      return [];
    }

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

export const removeEventFromAllUsers = async (eventId) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("events", "array-contains", eventId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return;
    }

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
