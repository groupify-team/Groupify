import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { storage, db } from "./config";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload a photo to Firebase Storage and save metadata to Firestore
 * @param {File} file - The file to upload
 * @param {string} tripId - The ID of the trip
 * @param {string} userId - The ID of the user uploading
 * @param {object} metadata - Additional metadata to store
 * @param {function} onProgress - Callback for upload progress (percent)
 * @returns {Promise<object>} - The uploaded photo data
 */
export const uploadPhoto = (
  file,
  tripId,
  userId,
  metadata = {},
  onProgress
) => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `photos/${tripId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(percent);
        }
      },
      (error) => {
        console.error("Upload failed:", error);
        reject(error);
      },
      async () => {
        try {
          const rawURL = await getDownloadURL(uploadTask.snapshot.ref);
          const downloadURL = rawURL.replace(
            "groupify-77202.appspot.com",
            "groupify-77202.firebasestorage.app"
          );

          const photoData = {
            fileName,
            filePath: storagePath,
            downloadURL,
            uploadedBy: userId,
            tripId,
            uploadedAt: new Date().toISOString(),
            ...metadata,
          };

          // Add to both collections for proper trip organization
          const [photoDocRef, tripPhotoDocRef] = await Promise.all([
            addDoc(collection(db, "photos"), photoData),
            addDoc(collection(db, "tripPhotos"), photoData),
          ]);

          resolve({
            id: photoDocRef.id,
            tripPhotoId: tripPhotoDocRef.id,
            ...photoData,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Get all photos for a specific trip
 */
export const getTripPhotos = async (tripId) => {
  try {
    const photosQuery = query(
      collection(db, "photos"),
      where("tripId", "==", tripId)
    );

    const querySnapshot = await getDocs(photosQuery);
    const photos = [];

    querySnapshot.forEach((doc) => {
      photos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return photos.sort(
      (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );
  } catch (error) {
    console.error("Error getting trip photos:", error);
    throw error;
  }
};

/**
 * Get all photos uploaded by a specific user
 */
export const getUserPhotos = async (userId) => {
  try {
    const photosQuery = query(
      collection(db, "photos"),
      where("uploadedBy", "==", userId)
    );

    const querySnapshot = await getDocs(photosQuery);
    const photos = [];

    querySnapshot.forEach((doc) => {
      photos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return photos.sort(
      (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );
  } catch (error) {
    console.error("Error getting user photos:", error);
    throw error;
  }
};
