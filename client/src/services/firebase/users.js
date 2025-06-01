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

// Membership request approval

export const acceptFriendRequest = async (uid, senderUid) => {
  try {
    const requestId = `${senderUid}_${uid}`;
    const requestRef = doc(db, "friendRequests", requestId);

    await deleteDoc(requestRef);

    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      friends: arrayUnion(senderUid),
    });

    console.log(`✅ Friend request accepted: ${senderUid} added to ${uid}`);
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
