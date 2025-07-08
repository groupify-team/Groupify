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
    events: 5,
    photosPerEvent: 30,
    membersPerEvent: 5,
    storageGB: 2,
    storageBytes: 2 * 1024 * 1024 * 1024,
  },
  premium: {
    events: 50,
    photosPerEvent: 200,
    membersPerEvent: 20,
    storageGB: 50,
    storageBytes: 50 * 1024 * 1024 * 1024,
  },
  pro: {
    events: "unlimited",
    photosPerEvent: "unlimited",
    membersPerEvent: "unlimited",
    storageGB: 500,
    storageBytes: 500 * 1024 * 1024 * 1024,
  },
  enterprise: {
    events: "unlimited",
    photosPerEvent: "unlimited",
    membersPerEvent: "unlimited",
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
    // Get event count
    const eventsQuery = await admin
      .firestore()
      .collection("events")
      .where("members", "array-contains", userId)
      .get();

    const eventCount = eventsQuery.size;

    // Get total photos and storage usage
    let totalPhotos = 0;
    let totalStorage = 0;

    const batch = admin.firestore().batch();

    for (const eventDoc of eventsQuery.docs) {
      const photosQuery = await admin
        .firestore()
        .collection("events")
        .doc(eventDoc.id)
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
      events: eventCount,
      photos: totalPhotos,
      storage: totalStorage,
    };
  } catch (error) {
    console.error("Error getting user usage:", error);
    return { events: 0, photos: 0, storage: 0 };
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
        eventId,
        photoCount = 1,
        totalFileSize = 0,
      } = req.body.data || req.body;

      if (!userId || !eventId) {
        res.status(400).json({
          success: false,
          message: "User ID and Event ID are required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get event data to check current photo count
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const eventData = eventDoc.data();
        const currentEventPhotos = eventData.photoCount || 0;

        // Check per-event photo limit
        if (planLimits.photosPerEvent !== "unlimited") {
          if (currentEventPhotos + photoCount > planLimits.photosPerEvent) {
            res.status(403).json({
              success: false,
              message: `Event photo limit exceeded! Your ${userPlan} plan allows ${planLimits.photosPerEvent} photos per event. This event currently has ${currentEventPhotos} photos.`,
              errorCode: "EVENT_PHOTO_LIMIT_EXCEEDED",
              currentUsage: currentEventPhotos,
              limit: planLimits.photosPerEvent,
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
            planLimits.photosPerEvent === "unlimited"
              ? "unlimited"
              : planLimits.photosPerEvent - currentEventPhotos,
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

      const { userId, eventId, inviteeCount = 1 } = req.body.data || req.body;

      if (!userId || !eventId) {
        res.status(400).json({
          success: false,
          message: "User ID and Event ID are required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get event data to check current member count
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const eventData = eventDoc.data();
        const currentMembers = eventData.members || [];
        const currentMemberCount = currentMembers.length;

        // Check member limit
        if (planLimits.membersPerEvent !== "unlimited") {
          if (currentMemberCount + inviteeCount > planLimits.membersPerEvent) {
            res.status(403).json({
              success: false,
              message: `Member limit exceeded! Your ${userPlan} plan allows ${planLimits.membersPerEvent} members per event. This event currently has ${currentMemberCount} members.`,
              errorCode: "MEMBER_LIMIT_EXCEEDED",
              currentUsage: currentMemberCount,
              limit: planLimits.membersPerEvent,
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
            planLimits.membersPerEvent === "unlimited"
              ? "unlimited"
              : planLimits.membersPerEvent - currentMemberCount,
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

// Enhanced event creation validation function
exports.validateEventCreation = onRequest(
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

        // Get user's current event count
        const userUsage = await getUserUsage(userId);
        const currentEventCount = userUsage.events;

        // Check event limit
        if (planLimits.events !== "unlimited") {
          if (currentEventCount >= planLimits.events) {
            res.status(403).json({
              success: false,
              message: `Event limit reached! Your ${userPlan} plan allows ${planLimits.events} events. You currently have ${currentEventCount} events.`,
              errorCode: "EVENT_LIMIT_EXCEEDED",
              currentUsage: currentEventCount,
              limit: planLimits.events,
              plan: userPlan,
            });
            return;
          }
        }

        // Validation passed
        res.status(200).json({
          success: true,
          message: "Event creation validation passed",
          remainingEvents:
            planLimits.events === "unlimited"
              ? "unlimited"
              : planLimits.events - currentEventCount,
        });
      } catch (error) {
        console.error("Error validating event creation:", error);
        res.status(500).json({
          success: false,
          message: `Validation failed: ${error.message}`,
        });
      }
    });
  }
);

// Enhanced event invitation acceptance with plan validation
exports.acceptEventInvitation = onRequest(
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
          .collection("eventInvitations")
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

        // Check if user has reached their event limit
        if (
          planLimits.events !== "unlimited" &&
          userUsage.events >= planLimits.events
        ) {
          res.status(403).json({
            success: false,
            message: `Event limit reached! Your ${userPlan} plan allows ${planLimits.events} events. You currently have ${userUsage.events} events. Upgrade your plan to accept more invitations.`,
            errorCode: "EVENT_LIMIT_EXCEEDED",
            currentEventCount: userUsage.events,
            eventLimit: planLimits.events,
            userPlan: userPlan,
          });
          return;
        }

        // Get the event to check member limits
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(invitation.eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const event = eventDoc.data();
        const currentMembers = event.members || [];

        // Check if user is already a member
        if (currentMembers.includes(userId)) {
          res.status(400).json({
            success: false,
            message: "User is already a member of this event",
          });
          return;
        }

        // Get event creator's plan to check member limits
        const eventCreatorPlan = await getUserPlan(event.createdBy);
        const eventPlanLimits =
          PLAN_LIMITS[eventCreatorPlan] || PLAN_LIMITS.free;

        // Check if adding this member would exceed the event's member limit
        if (
          eventPlanLimits.membersPerEvent !== "unlimited" &&
          currentMembers.length >= eventPlanLimits.membersPerEvent
        ) {
          res.status(403).json({
            success: false,
            message: `Cannot join event. The event creator's ${eventCreatorPlan} plan allows only ${eventPlanLimits.membersPerEvent} members per event.`,
            errorCode: "EVENT_MEMBER_LIMIT_EXCEEDED",
            currentMembers: currentMembers.length,
            memberLimit: eventPlanLimits.membersPerEvent,
            eventCreatorPlan: eventCreatorPlan,
          });
          return;
        }

        // Use a transaction to ensure data consistency
        await admin.firestore().runTransaction(async (transaction) => {
          // Add user to event members
          transaction.update(
            admin.firestore().collection("events").doc(invitation.eventId),
            {
              members: admin.firestore.FieldValue.arrayUnion(userId),
              memberCount: currentMembers.length + 1,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          );

          // Update invitation status
          transaction.update(
            admin.firestore().collection("eventInvitations").doc(invitationId),
            {
              status: "accepted",
              acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          );

          // Update user's event count in their profile
          transaction.update(
            admin.firestore().collection("users").doc(userId),
            {
              eventCount: userUsage.events + 1,
              lastEventJoined: admin.firestore.FieldValue.serverTimestamp(),
            }
          );
        });

        res.status(200).json({
          success: true,
          message: "Invitation accepted successfully",
          eventId: invitation.eventId,
          newEventCount: userUsage.events + 1,
        });
      } catch (error) {
        console.error("Error accepting event invitation:", error);
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

      const { userId, eventId, photoData, fileName, fileSize } =
        req.body.data || req.body;

      if (!userId || !eventId || !photoData || !fileName) {
        res.status(400).json({
          success: false,
          message: "User ID, Event ID, photo data, and file name are required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get event data
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const eventData = eventDoc.data();

        // Check if user is a member of the event
        if (!eventData.members || !eventData.members.includes(userId)) {
          res.status(403).json({
            success: false,
            message: "User is not a member of this event",
          });
          return;
        }

        const currentEventPhotos = eventData.photoCount || 0;

        // Validate against per-event photo limit
        if (planLimits.photosPerEvent !== "unlimited") {
          if (currentEventPhotos >= planLimits.photosPerEvent) {
            res.status(403).json({
              success: false,
              message: `Event photo limit exceeded! Your ${userPlan} plan allows ${planLimits.photosPerEvent} photos per event.`,
              errorCode: "EVENT_PHOTO_LIMIT_EXCEEDED",
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
          .collection("events")
          .doc(eventId)
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

          // Update event photo count
          transaction.update(
            admin.firestore().collection("events").doc(eventId),
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
          newPhotoCount: currentEventPhotos + 1,
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
            events: calculateUsageInfo(userUsage.events, planLimits.events),
            photos: calculateUsageInfo(
              userUsage.photos,
              planLimits.photosPerEvent
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
        if (result.usage.events.percentage > 80) {
          result.recommendations.push({
            type: "events",
            urgency: result.usage.events.percentage > 95 ? "high" : "medium",
            message: `You've used ${result.usage.events.percentage}% of your event limit`,
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

// Enhanced event invitation with member limit validation
exports.sendEventInvitationWithValidation = onRequest(
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

      const { eventId, inviterUserId, inviteeUserId, inviteeEmail } =
        req.body.data || req.body;

      if (!eventId || !inviterUserId || (!inviteeUserId && !inviteeEmail)) {
        res.status(400).json({
          success: false,
          message:
            "Event ID, inviter user ID, and invitee identifier are required",
        });
        return;
      }

      try {
        // Get event data
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const eventData = eventDoc.data();

        // Check if inviter is a member or admin
        if (!eventData.members || !eventData.members.includes(inviterUserId)) {
          res.status(403).json({
            success: false,
            message: "You must be a member to send invitations",
          });
          return;
        }

        // Get event creator's plan to check member limits
        const creatorPlan = await getUserPlan(eventData.createdBy);
        const planLimits = PLAN_LIMITS[creatorPlan] || PLAN_LIMITS.free;
        const currentMemberCount = eventData.members
          ? eventData.members.length
          : 0;

        // Check member limit
        if (planLimits.membersPerEvent !== "unlimited") {
          if (currentMemberCount >= planLimits.membersPerEvent) {
            res.status(403).json({
              success: false,
              message: `Member limit reached! The event creator's ${creatorPlan} plan allows ${planLimits.membersPerEvent} members per event.`,
              errorCode: "MEMBER_LIMIT_EXCEEDED",
              currentMembers: currentMemberCount,
              limit: planLimits.membersPerEvent,
              creatorPlan: creatorPlan,
            });
            return;
          }
        }

        // Create invitation
        const invitationRef = admin
          .firestore()
          .collection("eventInvitations")
          .doc();
        const invitationId = invitationRef.id;

        await invitationRef.set({
          id: invitationId,
          eventId: eventId,
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
            planLimits.membersPerEvent === "unlimited"
              ? "unlimited"
              : planLimits.membersPerEvent - currentMemberCount - 1,
        });
      } catch (error) {
        console.error("Error sending event invitation:", error);
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
