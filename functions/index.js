const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cors = require("cors")({
  origin: [
    "http://localhost:5173",
    "https://groupify-77202.web.app",
    "https://groupify-77202.firebaseapp.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});

// Enhanced plan limits validation
const PLAN_LIMITS = {
  free: {
    trips: 5,
    photosPerTrip: 30,
    membersPerTrip: 5,
    storageGB: 2,
    storageBytes: 2 * 1024 * 1024 * 1024,
  },
  premium: {
    trips: 50,
    photosPerTrip: 200,
    membersPerTrip: 20,
    storageGB: 50,
    storageBytes: 50 * 1024 * 1024 * 1024,
  },
  pro: {
    trips: "unlimited",
    photosPerTrip: "unlimited",
    membersPerTrip: "unlimited",
    storageGB: 500,
    storageBytes: 500 * 1024 * 1024 * 1024,
  },
  enterprise: {
    trips: "unlimited",
    photosPerTrip: "unlimited",
    membersPerTrip: "unlimited",
    storageGB: "unlimited",
    storageBytes: Number.MAX_SAFE_INTEGER,
  },
};

// Utility function to get user's plan
async function getUserPlan(userId) {
  try {
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    if (!userDoc.exists) {
      return "free"; // Default plan
    }

    const userData = userDoc.data();
    return userData.subscription?.plan || "free";
  } catch (error) {
    console.error("Error getting user plan:", error);
    return "free"; // Default to free on error
  }
}

// Utility function to get user's current usage
async function getUserUsage(userId) {
  try {
    // Get trip count
    const tripsQuery = await admin
      .firestore()
      .collection("trips")
      .where("members", "array-contains", userId)
      .get();

    const tripCount = tripsQuery.size;

    // Get total photos and storage usage
    let totalPhotos = 0;
    let totalStorage = 0;

    const batch = admin.firestore().batch();

    for (const tripDoc of tripsQuery.docs) {
      const photosQuery = await admin
        .firestore()
        .collection("trips")
        .doc(tripDoc.id)
        .collection("photos")
        .get();

      totalPhotos += photosQuery.size;

      // Calculate storage from photos
      photosQuery.docs.forEach((photoDoc) => {
        const photoData = photoDoc.data();
        totalStorage += photoData.size || 0;
      });
    }

    return {
      trips: tripCount,
      photos: totalPhotos,
      storage: totalStorage,
    };
  } catch (error) {
    console.error("Error getting user usage:", error);
    return { trips: 0, photos: 0, storage: 0 };
  }
}

// Enhanced photo upload validation function
exports.validatePhotoUpload = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const {
        userId,
        tripId,
        photoCount = 1,
        totalFileSize = 0,
      } = req.body.data || req.body;

      if (!userId || !tripId) {
        res.status(400).json({
          success: false,
          message: "User ID and Trip ID are required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get trip data to check current photo count
        const tripDoc = await admin
          .firestore()
          .collection("trips")
          .doc(tripId)
          .get();

        if (!tripDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Trip not found",
          });
          return;
        }

        const tripData = tripDoc.data();
        const currentTripPhotos = tripData.photoCount || 0;

        // Check per-trip photo limit
        if (planLimits.photosPerTrip !== "unlimited") {
          if (currentTripPhotos + photoCount > planLimits.photosPerTrip) {
            res.status(403).json({
              success: false,
              message: `Trip photo limit exceeded! Your ${userPlan} plan allows ${planLimits.photosPerTrip} photos per trip. This trip currently has ${currentTripPhotos} photos.`,
              errorCode: "TRIP_PHOTO_LIMIT_EXCEEDED",
              currentUsage: currentTripPhotos,
              limit: planLimits.photosPerTrip,
              plan: userPlan,
            });
            return;
          }
        }

        // Check storage limit
        if (planLimits.storageBytes !== Number.MAX_SAFE_INTEGER) {
          const userUsage = await getUserUsage(userId);
          const newStorageUsed = userUsage.storage + totalFileSize;

          if (newStorageUsed > planLimits.storageBytes) {
            res.status(403).json({
              success: false,
              message: `Storage limit exceeded! Your ${userPlan} plan allows ${
                planLimits.storageGB
              }GB of storage. You've used ${(
                userUsage.storage /
                (1024 * 1024 * 1024)
              ).toFixed(2)}GB.`,
              errorCode: "STORAGE_LIMIT_EXCEEDED",
              currentUsage: userUsage.storage,
              limit: planLimits.storageBytes,
              plan: userPlan,
            });
            return;
          }
        }

        // Validation passed
        res.status(200).json({
          success: true,
          message: "Photo upload validation passed",
          remainingPhotos:
            planLimits.photosPerTrip === "unlimited"
              ? "unlimited"
              : planLimits.photosPerTrip - currentTripPhotos,
          remainingStorage:
            planLimits.storageBytes === Number.MAX_SAFE_INTEGER
              ? "unlimited"
              : planLimits.storageBytes - (await getUserUsage(userId)).storage,
        });
      } catch (error) {
        console.error("Error validating photo upload:", error);
        res.status(500).json({
          success: false,
          message: `Validation failed: ${error.message}`,
        });
      }
    });
  }
);

// Enhanced member invitation validation function
exports.validateMemberInvitation = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { userId, tripId, inviteeCount = 1 } = req.body.data || req.body;

      if (!userId || !tripId) {
        res.status(400).json({
          success: false,
          message: "User ID and Trip ID are required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get trip data to check current member count
        const tripDoc = await admin
          .firestore()
          .collection("trips")
          .doc(tripId)
          .get();

        if (!tripDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Trip not found",
          });
          return;
        }

        const tripData = tripDoc.data();
        const currentMembers = tripData.members || [];
        const currentMemberCount = currentMembers.length;

        // Check member limit
        if (planLimits.membersPerTrip !== "unlimited") {
          if (currentMemberCount + inviteeCount > planLimits.membersPerTrip) {
            res.status(403).json({
              success: false,
              message: `Member limit exceeded! Your ${userPlan} plan allows ${planLimits.membersPerTrip} members per trip. This trip currently has ${currentMemberCount} members.`,
              errorCode: "MEMBER_LIMIT_EXCEEDED",
              currentUsage: currentMemberCount,
              limit: planLimits.membersPerTrip,
              plan: userPlan,
            });
            return;
          }
        }

        // Validation passed
        res.status(200).json({
          success: true,
          message: "Member invitation validation passed",
          remainingSlots:
            planLimits.membersPerTrip === "unlimited"
              ? "unlimited"
              : planLimits.membersPerTrip - currentMemberCount,
        });
      } catch (error) {
        console.error("Error validating member invitation:", error);
        res.status(500).json({
          success: false,
          message: `Validation failed: ${error.message}`,
        });
      }
    });
  }
);

// Enhanced trip creation validation function
exports.validateTripCreation = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { userId } = req.body.data || req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "User ID is required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get user's current trip count
        const userUsage = await getUserUsage(userId);
        const currentTripCount = userUsage.trips;

        // Check trip limit
        if (planLimits.trips !== "unlimited") {
          if (currentTripCount >= planLimits.trips) {
            res.status(403).json({
              success: false,
              message: `Trip limit reached! Your ${userPlan} plan allows ${planLimits.trips} trips. You currently have ${currentTripCount} trips.`,
              errorCode: "TRIP_LIMIT_EXCEEDED",
              currentUsage: currentTripCount,
              limit: planLimits.trips,
              plan: userPlan,
            });
            return;
          }
        }

        // Validation passed
        res.status(200).json({
          success: true,
          message: "Trip creation validation passed",
          remainingTrips:
            planLimits.trips === "unlimited"
              ? "unlimited"
              : planLimits.trips - currentTripCount,
        });
      } catch (error) {
        console.error("Error validating trip creation:", error);
        res.status(500).json({
          success: false,
          message: `Validation failed: ${error.message}`,
        });
      }
    });
  }
);

// Enhanced trip invitation acceptance with plan validation
exports.acceptTripInvitation = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { invitationId, userId } = req.body.data || req.body;

      if (!invitationId || !userId) {
        res.status(400).json({
          success: false,
          message: "Invitation ID and user ID are required",
        });
        return;
      }

      try {
        // Get the invitation details
        const invitationDoc = await admin
          .firestore()
          .collection("tripInvitations")
          .doc(invitationId)
          .get();

        if (!invitationDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Invitation not found",
          });
          return;
        }

        const invitation = invitationDoc.data();

        // Check if invitation is still pending
        if (invitation.status !== "pending") {
          res.status(400).json({
            success: false,
            message: "Invitation is no longer pending",
          });
          return;
        }

        // Get user's plan and current usage
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
        const userUsage = await getUserUsage(userId);

        // Check if user has reached their trip limit
        if (
          planLimits.trips !== "unlimited" &&
          userUsage.trips >= planLimits.trips
        ) {
          res.status(403).json({
            success: false,
            message: `Trip limit reached! Your ${userPlan} plan allows ${planLimits.trips} trips. You currently have ${userUsage.trips} trips. Upgrade your plan to accept more invitations.`,
            errorCode: "TRIP_LIMIT_EXCEEDED",
            currentTripCount: userUsage.trips,
            tripLimit: planLimits.trips,
            userPlan: userPlan,
          });
          return;
        }

        // Get the trip to check member limits
        const tripDoc = await admin
          .firestore()
          .collection("trips")
          .doc(invitation.tripId)
          .get();

        if (!tripDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Trip not found",
          });
          return;
        }

        const trip = tripDoc.data();
        const currentMembers = trip.members || [];

        // Check if user is already a member
        if (currentMembers.includes(userId)) {
          res.status(400).json({
            success: false,
            message: "User is already a member of this trip",
          });
          return;
        }

        // Get trip creator's plan to check member limits
        const tripCreatorPlan = await getUserPlan(trip.createdBy);
        const tripPlanLimits = PLAN_LIMITS[tripCreatorPlan] || PLAN_LIMITS.free;

        // Check if adding this member would exceed the trip's member limit
        if (
          tripPlanLimits.membersPerTrip !== "unlimited" &&
          currentMembers.length >= tripPlanLimits.membersPerTrip
        ) {
          res.status(403).json({
            success: false,
            message: `Cannot join trip. The trip creator's ${tripCreatorPlan} plan allows only ${tripPlanLimits.membersPerTrip} members per trip.`,
            errorCode: "TRIP_MEMBER_LIMIT_EXCEEDED",
            currentMembers: currentMembers.length,
            memberLimit: tripPlanLimits.membersPerTrip,
            tripCreatorPlan: tripCreatorPlan,
          });
          return;
        }

        // Use a transaction to ensure data consistency
        await admin.firestore().runTransaction(async (transaction) => {
          // Add user to trip members
          transaction.update(
            admin.firestore().collection("trips").doc(invitation.tripId),
            {
              members: admin.firestore.FieldValue.arrayUnion(userId),
              memberCount: currentMembers.length + 1,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          );

          // Update invitation status
          transaction.update(
            admin.firestore().collection("tripInvitations").doc(invitationId),
            {
              status: "accepted",
              acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          );

          // Update user's trip count in their profile
          transaction.update(
            admin.firestore().collection("users").doc(userId),
            {
              tripCount: userUsage.trips + 1,
              lastTripJoined: admin.firestore.FieldValue.serverTimestamp(),
            }
          );
        });

        res.status(200).json({
          success: true,
          message: "Invitation accepted successfully",
          tripId: invitation.tripId,
          newTripCount: userUsage.trips + 1,
        });
      } catch (error) {
        console.error("Error accepting trip invitation:", error);
        res.status(500).json({
          success: false,
          message: `Failed to accept invitation: ${error.message}`,
        });
      }
    });
  }
);

// Enhanced photo upload with server-side validation
exports.uploadPhotoWithValidation = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 300,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { userId, tripId, photoData, fileName, fileSize } =
        req.body.data || req.body;

      if (!userId || !tripId || !photoData || !fileName) {
        res.status(400).json({
          success: false,
          message: "User ID, Trip ID, photo data, and file name are required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get trip data
        const tripDoc = await admin
          .firestore()
          .collection("trips")
          .doc(tripId)
          .get();

        if (!tripDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Trip not found",
          });
          return;
        }

        const tripData = tripDoc.data();

        // Check if user is a member of the trip
        if (!tripData.members || !tripData.members.includes(userId)) {
          res.status(403).json({
            success: false,
            message: "User is not a member of this trip",
          });
          return;
        }

        const currentTripPhotos = tripData.photoCount || 0;

        // Validate against per-trip photo limit
        if (planLimits.photosPerTrip !== "unlimited") {
          if (currentTripPhotos >= planLimits.photosPerTrip) {
            res.status(403).json({
              success: false,
              message: `Trip photo limit exceeded! Your ${userPlan} plan allows ${planLimits.photosPerTrip} photos per trip.`,
              errorCode: "TRIP_PHOTO_LIMIT_EXCEEDED",
            });
            return;
          }
        }

        // Validate against storage limit
        if (planLimits.storageBytes !== Number.MAX_SAFE_INTEGER) {
          const userUsage = await getUserUsage(userId);
          const newStorageUsed = userUsage.storage + (fileSize || 0);

          if (newStorageUsed > planLimits.storageBytes) {
            res.status(403).json({
              success: false,
              message: `Storage limit exceeded! Your ${userPlan} plan allows ${planLimits.storageGB}GB of storage.`,
              errorCode: "STORAGE_LIMIT_EXCEEDED",
            });
            return;
          }
        }

        // Create photo document
        const photoRef = admin
          .firestore()
          .collection("trips")
          .doc(tripId)
          .collection("photos")
          .doc();
        const photoId = photoRef.id;

        // In a real implementation, you would upload the photo to Firebase Storage here
        // For now, we'll just store metadata
        await admin.firestore().runTransaction(async (transaction) => {
          // Add photo document
          transaction.set(photoRef, {
            id: photoId,
            fileName: fileName,
            uploadedBy: userId,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            size: fileSize || 0,
            // In real implementation, add: storageUrl, thumbnailUrl, etc.
          });

          // Update trip photo count
          transaction.update(
            admin.firestore().collection("trips").doc(tripId),
            {
              photoCount: admin.firestore.FieldValue.increment(1),
              lastPhotoUpload: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          );
        });

        res.status(200).json({
          success: true,
          message: "Photo uploaded successfully",
          photoId: photoId,
          newPhotoCount: currentTripPhotos + 1,
        });
      } catch (error) {
        console.error("Error uploading photo:", error);
        res.status(500).json({
          success: false,
          message: `Photo upload failed: ${error.message}`,
        });
      }
    });
  }
);

// Get user's plan limits and usage
exports.getUserPlanInfo = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { userId } = req.body.data || req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "User ID is required",
        });
        return;
      }

      try {
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
        const userUsage = await getUserUsage(userId);

        // Calculate percentages and remaining amounts
        const calculateUsageInfo = (used, limit) => {
          if (limit === "unlimited" || limit === Number.MAX_SAFE_INTEGER) {
            return {
              used,
              limit: "unlimited",
              remaining: "unlimited",
              percentage: 0,
            };
          }

          const percentage = Math.min(100, Math.round((used / limit) * 100));
          const remaining = Math.max(0, limit - used);

          return {
            used,
            limit,
            remaining,
            percentage,
          };
        };

        const result = {
          plan: userPlan,
          limits: planLimits,
          usage: {
            trips: calculateUsageInfo(userUsage.trips, planLimits.trips),
            photos: calculateUsageInfo(
              userUsage.photos,
              planLimits.photosPerTrip
            ),
            storage: {
              ...calculateUsageInfo(userUsage.storage, planLimits.storageBytes),
              usedFormatted: formatBytes(userUsage.storage),
              limitFormatted:
                planLimits.storageGB === "unlimited"
                  ? "unlimited"
                  : `${planLimits.storageGB}GB`,
            },
          },
          recommendations: [],
        };

        // Add upgrade recommendations
        if (result.usage.trips.percentage > 80) {
          result.recommendations.push({
            type: "trips",
            urgency: result.usage.trips.percentage > 95 ? "high" : "medium",
            message: `You've used ${result.usage.trips.percentage}% of your trip limit`,
          });
        }

        if (result.usage.storage.percentage > 80) {
          result.recommendations.push({
            type: "storage",
            urgency: result.usage.storage.percentage > 95 ? "high" : "medium",
            message: `You've used ${result.usage.storage.percentage}% of your storage`,
          });
        }

        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error("Error getting user plan info:", error);
        res.status(500).json({
          success: false,
          message: `Failed to get plan info: ${error.message}`,
        });
      }
    });
  }
);

// Utility function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Enhanced trip invitation with member limit validation
exports.sendTripInvitationWithValidation = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { tripId, inviterUserId, inviteeUserId, inviteeEmail } =
        req.body.data || req.body;

      if (!tripId || !inviterUserId || (!inviteeUserId && !inviteeEmail)) {
        res.status(400).json({
          success: false,
          message:
            "Trip ID, inviter user ID, and invitee identifier are required",
        });
        return;
      }

      try {
        // Get trip data
        const tripDoc = await admin
          .firestore()
          .collection("trips")
          .doc(tripId)
          .get();

        if (!tripDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Trip not found",
          });
          return;
        }

        const tripData = tripDoc.data();

        // Check if inviter is a member or admin
        if (!tripData.members || !tripData.members.includes(inviterUserId)) {
          res.status(403).json({
            success: false,
            message: "You must be a member to send invitations",
          });
          return;
        }

        // Get trip creator's plan to check member limits
        const creatorPlan = await getUserPlan(tripData.createdBy);
        const planLimits = PLAN_LIMITS[creatorPlan] || PLAN_LIMITS.free;
        const currentMemberCount = tripData.members
          ? tripData.members.length
          : 0;

        // Check member limit
        if (planLimits.membersPerTrip !== "unlimited") {
          if (currentMemberCount >= planLimits.membersPerTrip) {
            res.status(403).json({
              success: false,
              message: `Member limit reached! The trip creator's ${creatorPlan} plan allows ${planLimits.membersPerTrip} members per trip.`,
              errorCode: "MEMBER_LIMIT_EXCEEDED",
              currentMembers: currentMemberCount,
              limit: planLimits.membersPerTrip,
              creatorPlan: creatorPlan,
            });
            return;
          }
        }

        // Create invitation
        const invitationRef = admin
          .firestore()
          .collection("tripInvitations")
          .doc();
        const invitationId = invitationRef.id;

        await invitationRef.set({
          id: invitationId,
          tripId: tripId,
          inviterUserId: inviterUserId,
          inviteeUserId: inviteeUserId || null,
          inviteeEmail: inviteeEmail || null,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        res.status(200).json({
          success: true,
          message: "Invitation sent successfully",
          invitationId: invitationId,
          remainingSlots:
            planLimits.membersPerTrip === "unlimited"
              ? "unlimited"
              : planLimits.membersPerTrip - currentMemberCount - 1,
        });
      } catch (error) {
        console.error("Error sending trip invitation:", error);
        res.status(500).json({
          success: false,
          message: `Failed to send invitation: ${error.message}`,
        });
      }
    });
  }
);

// Set global options for all functions
setGlobalOptions({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 300,
});
