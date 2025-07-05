class ModernFaceRecognitionService {
  constructor() {
    this.isInitialized = false;
    this.userFaceProfiles = new Map();
    this.isProcessing = false;
    this.shouldCancel = false;
    this.faceapi = null; // Store dynamically loaded faceapi
    this.setupCleanup();

    // More lenient thresholds for better recall
    this.FACE_MATCHER_THRESHOLD = 0.5; // Increased from 0.4 (more lenient)
    this.MIN_FACE_SIZE = 60; // Reduced from 80 (catch smaller faces)
    this.MIN_DETECTION_CONFIDENCE = 0.5; // Reduced from 0.7 (more lenient)
    this.MAX_FACES_PER_IMAGE = 15; // Increased from 10
    this.MIN_QUALITY_THRESHOLD = 0.4; // New: minimum quality to accept faces
  }

  // ✅ Load face-api.js ONLY when needed
  async loadFaceAPI() {
    if (this.faceapi) return this.faceapi;

    console.log("🔄 Loading face-api.js library...");

    try {
      // Dynamic import - only loads when called
      const faceapiModule = await import("@vladmandic/face-api");
      this.faceapi = faceapiModule;

      console.log("✅ Face-api.js loaded successfully");
      return this.faceapi;
    } catch (error) {
      console.error("❌ Failed to load face-api.js:", error);
      throw new Error(
        "Failed to load face recognition library. Please check your internet connection."
      );
    }
  }

  // REPLACE the existing initialize() method with this:
  async initialize() {
    if (this.isInitialized) return;

    // Load the library first
    const faceapi = await this.loadFaceAPI();

    try {
      console.log("🔄 Loading AI models...");

      // 🔥 ADD PROGRESS CALLBACK FOR INITIALIZATION
      if (this.initProgressCallback) {
        this.initProgressCallback({
          type: "initializing_models",
          phase: "Loading AI models...",
          current: 0,
          total: 3,
        });
      }

      const MODEL_URLS = [
        "/models", // local backup
        "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model", // Working CDN
      ];

      let modelsLoaded = false;
      let lastError = null;

      for (const MODEL_URL of MODEL_URLS) {
        try {
          // 🔥 UPDATE PROGRESS FOR EACH MODEL
          if (this.initProgressCallback) {
            this.initProgressCallback({
              type: "loading_model",
              phase: "Loading face detection model...",
              current: 1,
              total: 3,
            });
          }

          await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

          if (this.initProgressCallback) {
            this.initProgressCallback({
              type: "loading_model",
              phase: "Loading facial landmarks model...",
              current: 2,
              total: 3,
            });
          }

          await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

          if (this.initProgressCallback) {
            this.initProgressCallback({
              type: "loading_model",
              phase: "Loading face recognition model...",
              current: 3,
              total: 3,
            });
          }

          await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

          console.log("✅ Essential models loaded from:", MODEL_URL);
          this.loadOptionalModels(MODEL_URL, faceapi);
          modelsLoaded = true;
          break;
        } catch (error) {
          lastError = error;
          console.warn(`❌ Failed to load from ${MODEL_URL}:`, error.message);
          continue;
        }
      }

      if (!modelsLoaded) {
        throw new Error(
          `Failed to load face recognition models: ${lastError?.message}`
        );
      }

      // 🔥 NOTIFY COMPLETION
      if (this.initProgressCallback) {
        this.initProgressCallback({
          type: "models_ready",
          phase: "AI models ready!",
          current: 3,
          total: 3,
        });
      }

      this.isInitialized = true;
      console.log("✅ Face recognition initialized");
    } catch (error) {
      console.error("❌ Failed to initialize face-api.js:", error);
      throw new Error(
        "Failed to load face recognition models. Please check model files."
      );
    }
  }

  // ✅ Load optional models in background
  async loadOptionalModels(MODEL_URL, faceapi) {
    try {
      await Promise.all([
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL), // Age/gender (optional)
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL), // Expressions (optional)
      ]);
      console.log("✅ Optional models loaded");
    } catch (error) {
      console.warn("⚠️ Optional models failed to load:", error.message);
    }
  }

  // Enhanced face detection with quality assessment
  async detectFacesWithQuality(imageElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Detect faces with landmarks and descriptors
      const detections = await this.faceapi
        .detectAllFaces(
          imageElement,
          new this.faceapi.SsdMobilenetv1Options({
            minConfidence: this.MIN_DETECTION_CONFIDENCE,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      const qualityFaces = [];

      for (
        let i = 0;
        i < detections.length && i < this.MAX_FACES_PER_IMAGE;
        i++
      ) {
        const detection = detections[i];
        const { width, height } = detection.detection.box;
        const faceSize = Math.sqrt(width * height);

        // Quality assessment
        const quality = this.assessFaceQuality(detection, faceSize);

        if (quality.isValid) {
          qualityFaces.push({
            detection,
            descriptor: detection.descriptor,
            landmarks: detection.landmarks,
            quality: quality.score,
            faceSize,
            boundingBox: detection.detection.box,
            confidence: detection.detection.score,
            qualityMetrics: quality.metrics,
            id: `face_${i}_${Date.now()}`,
          });
        }
      }

      return qualityFaces;
    } catch (error) {
      console.error("❌ Face detection failed:", error);
      return [];
    }
  }

  // Comprehensive face quality assessment
  assessFaceQuality(detection, faceSize) {
    const metrics = {
      size: faceSize >= this.MIN_FACE_SIZE,
      confidence: detection.detection.score >= this.MIN_DETECTION_CONFIDENCE,
      landmarks: detection.landmarks.positions.length >= 60, // Reduced from 65
      descriptor: detection.descriptor && detection.descriptor.length === 128,
      sharpness: this.calculateSharpness(detection),
      frontality: this.calculateFrontality(detection.landmarks),
      eyesOpen: this.assessEyesOpen(detection.landmarks),
    };

    // More lenient weights - prioritize having a valid descriptor
    const weights = {
      size: 0.1, // Reduced importance
      confidence: 0.2, // Reduced importance
      landmarks: 0.1, // Reduced importance
      descriptor: 0.4, // Much higher importance - this is key for recognition
      sharpness: 0.05, // Less important
      frontality: 0.1, // Less important
      eyesOpen: 0.05, // Less important
    };

    const score = Object.entries(metrics).reduce((total, [key, value]) => {
      const numericValue =
        typeof value === "boolean"
          ? value
            ? 1
            : 0
          : Math.max(0, Math.min(1, value));
      return total + numericValue * weights[key];
    }, 0);

    // More lenient validation - focus on essentials
    const isValid =
      score >= this.MIN_QUALITY_THRESHOLD &&
      metrics.descriptor && // Must have valid 128D descriptor
      metrics.size && // Must meet minimum size
      faceSize >= this.MIN_FACE_SIZE;

    if (!isValid) {
      console.log(
        `❌ Face rejected: score=${score.toFixed(3)}, size=${faceSize.toFixed(
          1
        )}px, hasDescriptor=${!!metrics.descriptor}, confidence=${detection.detection.score.toFixed(
          3
        )}`
      );
    }

    return { isValid, score, metrics };
  }

  // Calculate image sharpness (edge detection)
  calculateSharpness(detection) {
    // Simple sharpness estimation based on landmark consistency
    const landmarks = detection.landmarks.positions;
    let variation = 0;

    for (let i = 1; i < landmarks.length; i++) {
      const dx = landmarks[i].x - landmarks[i - 1].x;
      const dy = landmarks[i].y - landmarks[i - 1].y;
      variation += Math.sqrt(dx * dx + dy * dy);
    }

    // Normalize variation (higher = sharper)
    return Math.min(1, variation / 1000);
  }

  // Calculate face frontality (how front-facing the face is)
  calculateFrontality(landmarks) {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    if (nose.length === 0 || leftEye.length === 0 || rightEye.length === 0) {
      return 0;
    }

    // Calculate eye distance ratio
    const noseTip = nose[3]; // Nose tip
    const leftEyeCenter = this.getCenterPoint(leftEye);
    const rightEyeCenter = this.getCenterPoint(rightEye);

    const leftDist = this.getDistance(noseTip, leftEyeCenter);
    const rightDist = this.getDistance(noseTip, rightEyeCenter);

    // Perfect frontality would have ratio close to 1
    const ratio = Math.min(leftDist, rightDist) / Math.max(leftDist, rightDist);
    return ratio;
  }

  // Assess if eyes are open
  assessEyesOpen(landmarks) {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const leftEyeHeight = this.getEyeHeight(leftEye);
    const rightEyeHeight = this.getEyeHeight(rightEye);

    // Eyes are considered open if height ratio is reasonable
    return leftEyeHeight > 0.02 && rightEyeHeight > 0.02;
  }

  // Helper functions
  getCenterPoint(points) {
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x, y };
  }

  getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  getEyeHeight(eyePoints) {
    if (eyePoints.length < 6) return 0;
    const top = Math.min(eyePoints[1].y, eyePoints[2].y);
    const bottom = Math.max(eyePoints[4].y, eyePoints[5].y);
    return Math.abs(bottom - top);
  }

  // Create face profile with proper 128D descriptors
  async createFaceProfile(userId, imageFiles, onProgress = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Clear existing profile
      this.deleteFaceProfile(userId);

      const allFaces = [];
      const imageUrls = imageFiles.map((img) => img.url || img);

      for (let i = 0; i < imageUrls.length; i++) {
        if (this.shouldCancel) throw new Error("CANCELLED");

        if (onProgress) {
          onProgress({
            type: "processing_profile",
            current: i + 1,
            total: imageUrls.length,
            phase: `Processing image ${i + 1}/${imageUrls.length}...`,
          });
        }

        try {
          // Load image
          const img = await this.loadImageFromUrl(imageUrls[i]);
          const faces = await this.detectFacesWithQuality(img);

          if (faces.length > 0) {
            // Take the best face from each image
            const bestFace = faces.reduce((best, current) =>
              current.quality > best.quality ? current : best
            );

            allFaces.push({
              ...bestFace,
              sourceImage: imageUrls[i],
              imageIndex: i,
            });
          } else {
            console.warn(`⚠️ No valid face found in image ${i + 1}`);
          }
        } catch (error) {
          console.warn(`❌ Failed to process image ${i + 1}:`, error.message);
        }
      }

      if (allFaces.length < 2) {
        throw new Error(
          `Insufficient faces detected (${allFaces.length}/${imageUrls.length}). Please provide clearer photos.`
        );
      }

      // Create labeled face descriptors for face-api.js
      const labeledDescriptors = allFaces.map((face, index) => {
        return new this.faceapi.LabeledFaceDescriptors(
          `${userId}_face_${index}`,
          [face.descriptor]
        );
      });

      // Create face matcher with optimized threshold
      const faceMatcher = new this.faceapi.FaceMatcher(
        labeledDescriptors,
        this.FACE_MATCHER_THRESHOLD
      );

      const profile = {
        userId,
        allFaces,
        labeledDescriptors,
        faceMatcher,
        createdAt: Date.now(),
        metadata: {
          totalImages: imageUrls.length,
          facesDetected: allFaces.length,
          averageQuality:
            allFaces.reduce((sum, f) => sum + f.quality, 0) / allFaces.length,
          bestQuality: Math.max(...allFaces.map((f) => f.quality)),
          threshold: this.FACE_MATCHER_THRESHOLD,
          engine: "face-api.js",
        },
      };

      this.userFaceProfiles.set(userId, profile);

      if (onProgress) {
        onProgress({
          type: "profile_completed",
          phase: "Face profile created successfully!",
          facesDetected: allFaces.length,
          avgQuality: profile.metadata.averageQuality,
          engine: "face-api.js",
        });
      }

      return profile;
    } catch (error) {
      this.deleteFaceProfile(userId);
      console.error("❌ Failed to create face profile:", error);
      throw error;
    }
  }

  // Enhanced photo filtering with proper face matching
  async filterPhotosByFaceProfile(photos, userId, onProgress = null) {
    if (!photos.length) {
      return [];
    }

    const userProfile = this.getFaceProfile(userId);
    if (!userProfile) {
      throw new Error("No face profile found. Please create a profile first.");
    }

    this.reset();
    this.isProcessing = true;
    const startTime = Date.now();

    try {
      if (onProgress) {
        onProgress({
          type: "initializing",
          phase: `Using face-api.js with ${userProfile.allFaces.length} reference faces...`,
          current: 0,
          total: photos.length,
        });
      }

      const matches = [];

      for (let i = 0; i < photos.length; i++) {
        if (this.shouldCancel) throw new Error("CANCELLED");

        const photo = photos[i];

        if (onProgress) {
          const estimatedTimeRemaining = this.calculateTimeRemaining(
            startTime,
            i,
            photos.length
          );
          onProgress({
            type: "processing",
            current: i + 1, // 🔥 THIS IS CORRECT - keeps incrementing
            total: photos.length,
            currentPhoto:
              photo.fileName || photo.originalName || `Photo ${i + 1}`,
            estimatedTimeRemaining,
            phase: "Face recognition analysis...",
            percentage: Math.round(((i + 1) / photos.length) * 100), // 🔥 ADD THIS
          });
        }

        try {
          // Load and process image
          const img = await this.loadImageFromUrl(photo.downloadURL);
          const faces = await this.detectFacesWithQuality(img);

          if (faces.length > 0) {
            // Check each detected face against the user's profile
            let bestMatchForPhoto = null;

            for (const face of faces) {
              const bestMatch = userProfile.faceMatcher.findBestMatch(
                face.descriptor
              );

              // face-api.js returns distance (lower = more similar)
              // Convert distance to confidence score
              const confidence = Math.max(0, 1 - bestMatch.distance);
              const isMatch = bestMatch.label !== "unknown";

              console.log(
                `🔍 Face check: distance=${bestMatch.distance.toFixed(
                  3
                )}, confidence=${(confidence * 100).toFixed(1)}%, label=${
                  bestMatch.label
                }`
              );

              if (
                isMatch &&
                bestMatch.distance <= this.FACE_MATCHER_THRESHOLD
              ) {
                const matchData = {
                  confidence: confidence,
                  distance: bestMatch.distance,
                  matchedLabel: bestMatch.label,
                  threshold: this.FACE_MATCHER_THRESHOLD,
                  detectionMethod: "face-api.js",
                  faceQuality: face.quality,
                  faceSize: face.faceSize,
                  detectionConfidence: face.confidence,
                  matchedFace: face,
                };

                // Keep the best match for this photo (lowest distance)
                if (
                  !bestMatchForPhoto ||
                  bestMatch.distance < bestMatchForPhoto.faceMatch.distance
                ) {
                  bestMatchForPhoto = {
                    ...photo,
                    faceMatch: matchData,
                  };
                }
              }
            }

            // Add the best match for this photo (if any)
            if (bestMatchForPhoto) {
              matches.push(bestMatchForPhoto);

              console.log(
                `✅ Match found in ${photo.fileName}: confidence=${(
                  bestMatchForPhoto.faceMatch.confidence * 100
                ).toFixed(
                  1
                )}%, distance=${bestMatchForPhoto.faceMatch.distance.toFixed(
                  3
                )}`
              );

              if (onProgress) {
                onProgress({
                  type: "match_found",
                  photo: photo.fileName || photo.originalName,
                  confidence: bestMatchForPhoto.faceMatch.confidence,
                  distance: bestMatchForPhoto.faceMatch.distance,
                });
              }
            }
          }
        } catch (error) {
          if (error.message === "CANCELLED") throw error;
          console.error(`❌ Failed to process ${photo.fileName}:`, error);
        }
      }

      // Sort by confidence (highest first)
      const sortedMatches = matches.sort(
        (a, b) => b.faceMatch.confidence - a.faceMatch.confidence
      );

      const processingTime = Math.round((Date.now() - startTime) / 1000);

      if (onProgress) {
        onProgress({
          type: "completed",
          phase: "Face recognition completed!",
          totalMatches: sortedMatches.length,
          averageConfidence:
            sortedMatches.length > 0
              ? (
                  (sortedMatches.reduce(
                    (sum, p) => sum + p.faceMatch.confidence,
                    0
                  ) /
                    sortedMatches.length) *
                  100
                ).toFixed(1)
              : 0,
          processingTime: processingTime,
        });
      }

      return sortedMatches;
    } catch (error) {
      this.isProcessing = false;

      if (error.message === "CANCELLED") {
        if (onProgress) {
          onProgress({
            type: "cancelled",
            phase: "Face recognition cancelled",
          });
        }
        return [];
      }

      console.error("❌ Face recognition failed:", error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  // Load image from URL for processing
  async loadImageFromUrl(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = (error) =>
        reject(new Error(`Failed to load image: ${error}`));

      // Handle Firebase URL format
      let processedUrl = imageUrl;
      if (processedUrl.includes("appspot.com")) {
        processedUrl = processedUrl.replace(
          "groupify-77202.appspot.com",
          "groupify-77202.firebasestorage.app"
        );
      }
      if (!processedUrl.includes("alt=media")) {
        processedUrl += (processedUrl.includes("?") ? "&" : "?") + "alt=media";
      }

      img.src = processedUrl;
    });
  }

  // Memory cleanup method
  cleanup() {
    this.userFaceProfiles.clear();
    this.isProcessing = false;
    this.shouldCancel = false;
  }

  // Add to window beforeunload for cleanup
  setupCleanup() {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.cleanup();
      });
    }
  }

  // Utility methods
  calculateTimeRemaining(startTime, processed, total) {
    if (processed === 0) return null;
    const elapsed = Date.now() - startTime;
    const avgTimePerPhoto = elapsed / processed;
    const remaining = (total - processed) * avgTimePerPhoto;
    return Math.max(0, Math.round(remaining / 1000));
  }

  setInitializationProgressCallback(callback) {
    this.initProgressCallback = callback;
  }

  getFaceProfile(userId) {
    return this.userFaceProfiles.get(userId);
  }

  hasFaceProfile(userId) {
    return this.userFaceProfiles.has(userId);
  }

  deleteFaceProfile(userId) {
    return this.userFaceProfiles.delete(userId);
  }

  cancel() {
    this.shouldCancel = true;
  }

  reset() {
    this.shouldCancel = false;
    this.isProcessing = false;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isProcessing: this.isProcessing,
      shouldCancel: this.shouldCancel,
      profilesLoaded: this.userFaceProfiles.size,
      engine: "face-api.js",
      threshold: this.FACE_MATCHER_THRESHOLD,
      minFaceSize: this.MIN_FACE_SIZE,
      minDetectionConfidence: this.MIN_DETECTION_CONFIDENCE,
      minQualityThreshold: this.MIN_QUALITY_THRESHOLD,
    };
  }

  // Diagnostic function to analyze why photos aren't matching
  async analyzePhoto(photoUrl, userId) {
    const userProfile = this.getFaceProfile(userId);
    if (!userProfile) {
      throw new Error("No face profile found");
    }

    const img = await this.loadImageFromUrl(photoUrl);
    const faces = await this.detectFacesWithQuality(img);

    if (faces.length === 0) {
      console.log(
        `   ❌ No faces detected - check image quality, lighting, or face size`
      );
      return { faces: [], matches: [] };
    }

    const matches = [];
    faces.forEach((face, index) => {
      const bestMatch = userProfile.faceMatcher.findBestMatch(face.descriptor);
      const confidence = Math.max(0, 1 - bestMatch.distance);
      const wouldMatch =
        bestMatch.distance <= this.FACE_MATCHER_THRESHOLD &&
        bestMatch.label !== "unknown";

      matches.push({
        face,
        bestMatch,
        confidence,
        wouldMatch,
        reasons: wouldMatch ? [] : this.getNoMatchReasons(face, bestMatch),
      });
    });

    return { faces, matches };
  }

  getNoMatchReasons(face, bestMatch) {
    const reasons = [];

    if (bestMatch.label === "unknown") {
      reasons.push("Face not recognized as any profile face");
    }

    if (bestMatch.distance > this.FACE_MATCHER_THRESHOLD) {
      reasons.push(
        `Distance ${bestMatch.distance.toFixed(3)} > threshold ${
          this.FACE_MATCHER_THRESHOLD
        }`
      );
    }

    if (face.quality < this.MIN_QUALITY_THRESHOLD) {
      reasons.push(
        `Quality ${(face.quality * 100).toFixed(1)}% < minimum ${(
          this.MIN_QUALITY_THRESHOLD * 100
        ).toFixed(1)}%`
      );
    }

    if (face.faceSize < this.MIN_FACE_SIZE) {
      reasons.push(
        `Face size ${face.faceSize.toFixed(0)}px < minimum ${
          this.MIN_FACE_SIZE
        }px`
      );
    }

    return reasons;
  }
}

// DON'T create instance immediately - export a factory function instead
let serviceInstance = null;

const getFaceRecognitionService = () => {
  // Only create when actually needed
  if (!serviceInstance) {
    serviceInstance = new ModernFaceRecognitionService();
  }
  return serviceInstance;
};

// Update all exports to use lazy service
export const createFaceProfile = async (
  userId,
  faceImages,
  onProgress = null
) => {
  const service = getFaceRecognitionService();
  return await service.createFaceProfile(userId, faceImages, onProgress);
};

export const filterPhotosByFaceProfile = async (
  photos,
  userId,
  onProgress = null
) => {
  const service = getFaceRecognitionService();
  return await service.filterPhotosByFaceProfile(photos, userId, onProgress);
};

export const hasFaceProfile = (userId) => {
  if (!serviceInstance) return false; // Don't create service just to check
  return serviceInstance.hasFaceProfile(userId);
};

export const getFaceProfile = (userId) => {
  if (!serviceInstance) return null;
  return serviceInstance.getFaceProfile(userId);
};

export const deleteFaceProfile = (userId) => {
  if (!serviceInstance) return false;
  return serviceInstance.deleteFaceProfile(userId);
};

export const cancelFaceRecognition = () => {
  if (!serviceInstance) return;
  serviceInstance.cancel();
};

export const resetFaceRecognition = () => {
  if (!serviceInstance) return;
  serviceInstance.reset();
};

export const getFaceRecognitionStatus = () => {
  if (!serviceInstance) return { isInitialized: false, isProcessing: false };
  return serviceInstance.getStatus();
};

// Diagnostic function for troubleshooting
export const analyzePhoto = async (photoUrl, userId) => {
  const service = getFaceRecognitionService();
  return await service.analyzePhoto(photoUrl, userId);
};

// Threshold adjustment functions
export const setMatchingThreshold = (threshold) => {
  const service = getFaceRecognitionService();
  service.FACE_MATCHER_THRESHOLD = threshold;
};

export const setQualityThreshold = (threshold) => {
  const service = getFaceRecognitionService();
  service.MIN_QUALITY_THRESHOLD = threshold;
};

// Additional exports for backward compatibility
export const addPhotosToProfile = async (
  userId,
  newImages,
  onProgress = null
) => {
  const service = getFaceRecognitionService();
  const existingProfile = service.getFaceProfile(userId);
  if (!existingProfile) {
    throw new Error("No existing face profile found. Create a profile first.");
  }

  // Get original image URLs from existing profile
  const existingImageUrls = existingProfile.allFaces.map((f) => f.sourceImage);
  const newImageUrls = newImages.map((img) => img.url || img);

  // Combine all images
  const allImages = [...existingImageUrls, ...newImageUrls];

  // Recreate profile with all images
  return await service.createFaceProfile(
    userId,
    allImages.map((url) => ({ url })),
    onProgress
  );
};

export const removePhotosFromProfile = async (userId, imageUrlsToRemove) => {
  const service = getFaceRecognitionService();
  const existingProfile = service.getFaceProfile(userId);
  if (!existingProfile) {
    throw new Error("No face profile found for user");
  }

  const remainingUrls = existingProfile.allFaces
    .map((f) => f.sourceImage)
    .filter((url) => !imageUrlsToRemove.includes(url));

  if (remainingUrls.length < 2) {
    throw new Error(
      "Cannot remove - would leave less than 2 photos. Delete the profile instead."
    );
  }

  // Recreate profile with remaining images
  return await service.createFaceProfile(
    userId,
    remainingUrls.map((url) => ({ url }))
  );
};

export const getProfilePhotos = (userId) => {
  if (!serviceInstance) return [];
  const profile = serviceInstance.getFaceProfile(userId);
  if (!profile) return [];

  return profile.allFaces.map((face, index) => ({
    id: `profile_photo_${index}`,
    url: face.sourceImage,
    confidence: face.quality,
    method: "face-api.js",
    addedAt: face.addedAt || profile.createdAt,
    qualityTier:
      face.quality > 0.8 ? "high" : face.quality > 0.6 ? "medium" : "low",
    isInProfile: true, // All faces in face-api.js are used for matching
    faceSize: face.faceSize,
    detectionConfidence: face.confidence,
    qualityMetrics: face.qualityMetrics,
  }));
};

export const optimizeProfile = (userId, minQuality = 0.75) => {
  const service = getFaceRecognitionService();
  const profile = service.getFaceProfile(userId);
  if (!profile) {
    throw new Error("No face profile found for user");
  }

  // Filter faces by quality and recreate profile
  const highQualityImages = profile.allFaces
    .filter((face) => face.quality >= minQuality)
    .map((face) => face.sourceImage);

  if (highQualityImages.length < 2) {
    console.log(
      "✅ Profile already optimized - insufficient high quality faces to filter"
    );
    return profile;
  }
  return service.createFaceProfile(
    userId,
    highQualityImages.map((url) => ({ url }))
  );
};

// Legacy compatibility for single-photo recognition
export const filterPhotosByFace = async (
  photos,
  userPhotoURL,
  onProgress = null
) => {
  const service = getFaceRecognitionService();

  // Initialize the service if needed
  if (!service.isInitialized) {
    await service.initialize();
  }

  try {
    // Load the user's reference image
    const img = await service.loadImageFromUrl(userPhotoURL);
    const userFaces = await service.detectFacesWithQuality(img);

    if (!userFaces || userFaces.length === 0) {
      throw new Error("Could not detect face in user photo");
    }

    const bestUserFace = userFaces.reduce((best, current) =>
      current.quality > best.quality ? current : best
    );

    // Create a temporary profile
    const tempProfile = {
      userId: "temp_user",
      allFaces: [bestUserFace],
      faceMatcher: new service.faceapi.FaceMatcher(
        [
          new service.faceapi.LabeledFaceDescriptors("temp_user", [
            bestUserFace.descriptor,
          ]),
        ],
        service.FACE_MATCHER_THRESHOLD
      ),
      createdAt: Date.now(),
      metadata: {
        totalImages: 1,
        facesDetected: 1,
        averageQuality: bestUserFace.quality,
        bestQuality: bestUserFace.quality,
        threshold: service.FACE_MATCHER_THRESHOLD,
        engine: "face-api.js",
      },
    };

    service.userFaceProfiles.set("temp_user", tempProfile);

    try {
      const results = await service.filterPhotosByFaceProfile(
        photos,
        "temp_user",
        onProgress
      );
      return results;
    } finally {
      service.userFaceProfiles.delete("temp_user");
    }
  } catch (error) {
    console.error("❌ Legacy face recognition failed:", error);
    throw error;
  }
};

export default getFaceRecognitionService;
