// services/faceRecognitionService.js
import * as faceapi from 'face-api.js';

class ModernFaceRecognitionService {
  constructor() {
    this.isInitialized = false;
    this.userFaceProfiles = new Map();
    this.isProcessing = false;
    this.shouldCancel = false;
    
    // More lenient thresholds for better recall
    this.FACE_MATCHER_THRESHOLD = 0.5;   // Increased from 0.4 (more lenient)
    this.MIN_FACE_SIZE = 60;             // Reduced from 80 (catch smaller faces)
    this.MIN_DETECTION_CONFIDENCE = 0.5; // Reduced from 0.7 (more lenient)
    this.MAX_FACES_PER_IMAGE = 15;       // Increased from 10
    this.MIN_QUALITY_THRESHOLD = 0.4;    // New: minimum quality to accept faces
  }

  // Initialize face-api.js models
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🔄 Loading face-api.js models...');
      
      // Try local models first, then fallback to CDN
      const MODEL_URLS = [
        '/models', // Local models
        'https://justadudewhohacks.github.io/face-api.js/models', // CDN fallback
      ];
      
      let modelsLoaded = false;
      let lastError = null;
      
      for (const MODEL_URL of MODEL_URLS) {
        try {
          console.log(`🔍 Trying to load models from: ${MODEL_URL}`);
          
          await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),      // Face detection
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),   // Facial landmarks  
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),  // Face recognition (128D descriptors)
          ]);
          
          // Optional models - don't fail if these don't load
          try {
            await Promise.all([
              faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),        // Age/gender (optional)
              faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)    // Expressions (optional)
            ]);
            console.log('✅ All models (including optional) loaded successfully');
          } catch (optionalError) {
            console.warn('⚠️ Optional models failed to load:', optionalError.message);
          }
          
          modelsLoaded = true;
          console.log(`✅ Face-api.js models loaded successfully from: ${MODEL_URL}`);
          break;
          
        } catch (error) {
          lastError = error;
          console.warn(`❌ Failed to load from ${MODEL_URL}:`, error.message);
          continue;
        }
      }
      
      if (!modelsLoaded) {
        console.error('❌ All model sources failed. Last error:', lastError);
        throw new Error(`Failed to load face recognition models. Please check:\n1. Model files exist in public/models/\n2. Files are not corrupted\n3. Network connection\n\nLast error: ${lastError?.message}`);
      }
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize face-api.js:', error);
      throw new Error('Failed to load face recognition models. Please check model files.');
    }
  }

  // Enhanced face detection with quality assessment
  async detectFacesWithQuality(imageElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Detect faces with landmarks and descriptors
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options({ 
          minConfidence: this.MIN_DETECTION_CONFIDENCE 
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      const qualityFaces = [];

      for (let i = 0; i < detections.length && i < this.MAX_FACES_PER_IMAGE; i++) {
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
            id: `face_${i}_${Date.now()}`
          });
        }
      }

      console.log(`🔍 Detected ${detections.length} faces, ${qualityFaces.length} high-quality`);
      return qualityFaces;

    } catch (error) {
      console.error('❌ Face detection failed:', error);
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
      eyesOpen: this.assessEyesOpen(detection.landmarks)
    };

    // More lenient weights - prioritize having a valid descriptor
    const weights = {
      size: 0.10,        // Reduced importance
      confidence: 0.20,   // Reduced importance
      landmarks: 0.10,    // Reduced importance
      descriptor: 0.40,   // Much higher importance - this is key for recognition
      sharpness: 0.05,    // Less important
      frontality: 0.10,   // Less important  
      eyesOpen: 0.05      // Less important
    };

    const score = Object.entries(metrics).reduce((total, [key, value]) => {
      const numericValue = typeof value === 'boolean' ? (value ? 1 : 0) : Math.max(0, Math.min(1, value));
      return total + (numericValue * weights[key]);
    }, 0);

    // More lenient validation - focus on essentials
    const isValid = score >= this.MIN_QUALITY_THRESHOLD && 
                   metrics.descriptor && // Must have valid 128D descriptor
                   metrics.size &&       // Must meet minimum size
                   faceSize >= this.MIN_FACE_SIZE;

    if (!isValid) {
      console.log(`❌ Face rejected: score=${score.toFixed(3)}, size=${faceSize.toFixed(1)}px, hasDescriptor=${!!metrics.descriptor}, confidence=${detection.detection.score.toFixed(3)}`);
    } else {
      console.log(`✅ Face accepted: score=${score.toFixed(3)}, size=${faceSize.toFixed(1)}px, confidence=${detection.detection.score.toFixed(3)}`);
    }

    return { isValid, score, metrics };
  }

  // Calculate image sharpness (edge detection)
  calculateSharpness(detection) {
    // Simple sharpness estimation based on landmark consistency
    const landmarks = detection.landmarks.positions;
    let variation = 0;
    
    for (let i = 1; i < landmarks.length; i++) {
      const dx = landmarks[i].x - landmarks[i-1].x;
      const dy = landmarks[i].y - landmarks[i-1].y;
      variation += Math.sqrt(dx*dx + dy*dy);
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

    console.log(`🔍 Creating face profile for user ${userId} with ${imageFiles.length} images`);
    
    try {
      // Clear existing profile
      this.deleteFaceProfile(userId);
      
      const allFaces = [];
      const imageUrls = imageFiles.map(img => img.url || img);

      for (let i = 0; i < imageUrls.length; i++) {
        if (this.shouldCancel) throw new Error('CANCELLED');

        if (onProgress) {
          onProgress({
            type: 'processing_profile',
            current: i + 1,
            total: imageUrls.length,
            phase: `Processing image ${i + 1}/${imageUrls.length}...`
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
              imageIndex: i
            });
            
            console.log(`✅ Profile image ${i + 1}: quality=${(bestFace.quality * 100).toFixed(1)}%`);
          } else {
            console.warn(`⚠️ No valid face found in image ${i + 1}`);
          }
          
        } catch (error) {
          console.warn(`❌ Failed to process image ${i + 1}:`, error.message);
        }
      }

      if (allFaces.length < 2) {
        throw new Error(`Insufficient faces detected (${allFaces.length}/${imageUrls.length}). Please provide clearer photos.`);
      }

      // Create labeled face descriptors for face-api.js
      const labeledDescriptors = allFaces.map((face, index) => {
        return new faceapi.LabeledFaceDescriptors(
          `${userId}_face_${index}`, 
          [face.descriptor]
        );
      });

      // Create face matcher with optimized threshold
      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, this.FACE_MATCHER_THRESHOLD);

      const profile = {
        userId,
        allFaces,
        labeledDescriptors,
        faceMatcher,
        createdAt: Date.now(),
        metadata: {
          totalImages: imageUrls.length,
          facesDetected: allFaces.length,
          averageQuality: allFaces.reduce((sum, f) => sum + f.quality, 0) / allFaces.length,
          bestQuality: Math.max(...allFaces.map(f => f.quality)),
          threshold: this.FACE_MATCHER_THRESHOLD,
          engine: 'face-api.js'
        }
      };

      this.userFaceProfiles.set(userId, profile);

      if (onProgress) {
        onProgress({
          type: 'profile_completed',
          phase: 'Face profile created successfully!',
          facesDetected: allFaces.length,
          avgQuality: profile.metadata.averageQuality,
          engine: 'face-api.js'
        });
      }

      console.log(`🎯 Face profile created for ${userId}:`);
      console.log(`   Faces: ${allFaces.length} from ${imageUrls.length} images`);
      console.log(`   Avg quality: ${(profile.metadata.averageQuality * 100).toFixed(1)}%`);
      console.log(`   Threshold: ${this.FACE_MATCHER_THRESHOLD}`);

      return profile;

    } catch (error) {
      this.deleteFaceProfile(userId);
      console.error('❌ Failed to create face profile:', error);
      throw error;
    }
  }

  // Enhanced photo filtering with proper face matching
  async filterPhotosByFaceProfile(photos, userId, onProgress = null) {
    if (!photos.length) {
      console.log('❌ No photos to process');
      return [];
    }

    const userProfile = this.getFaceProfile(userId);
    if (!userProfile) {
      throw new Error('No face profile found. Please create a profile first.');
    }

    this.reset();
    this.isProcessing = true;
    const startTime = Date.now();

    try {
      console.log(`🔍 Starting face recognition with face-api.js...`);
      console.log(`👤 Profile: ${userProfile.allFaces.length} faces, threshold: ${this.FACE_MATCHER_THRESHOLD}`);
      
      if (onProgress) {
        onProgress({
          type: 'initializing',
          phase: `Using face-api.js with ${userProfile.allFaces.length} reference faces...`,
          current: 0,
          total: photos.length
        });
      }

      const matches = [];

      for (let i = 0; i < photos.length; i++) {
        if (this.shouldCancel) throw new Error('CANCELLED');

        const photo = photos[i];

        if (onProgress) {
          const estimatedTimeRemaining = this.calculateTimeRemaining(startTime, i, photos.length);
          onProgress({
            type: 'processing',
            current: i + 1,
            total: photos.length,
            currentPhoto: photo.fileName || photo.originalName || `Photo ${i + 1}`,
            estimatedTimeRemaining,
            phase: 'Face recognition analysis...'
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
              const bestMatch = userProfile.faceMatcher.findBestMatch(face.descriptor);
              
              // face-api.js returns distance (lower = more similar)
              // Convert distance to confidence score
              const confidence = Math.max(0, 1 - bestMatch.distance);
              const isMatch = bestMatch.label !== 'unknown';
              
              console.log(`🔍 Face check: distance=${bestMatch.distance.toFixed(3)}, confidence=${(confidence*100).toFixed(1)}%, label=${bestMatch.label}`);
              
              if (isMatch && bestMatch.distance <= this.FACE_MATCHER_THRESHOLD) {
                const matchData = {
                  confidence: confidence,
                  distance: bestMatch.distance,
                  matchedLabel: bestMatch.label,
                  threshold: this.FACE_MATCHER_THRESHOLD,
                  detectionMethod: 'face-api.js',
                  faceQuality: face.quality,
                  faceSize: face.faceSize,
                  detectionConfidence: face.confidence,
                  matchedFace: face
                };
                
                // Keep the best match for this photo (lowest distance)
                if (!bestMatchForPhoto || bestMatch.distance < bestMatchForPhoto.faceMatch.distance) {
                  bestMatchForPhoto = {
                    ...photo,
                    faceMatch: matchData
                  };
                }
              }
            }
            
            // Add the best match for this photo (if any)
            if (bestMatchForPhoto) {
              matches.push(bestMatchForPhoto);
              
              console.log(`✅ Match found in ${photo.fileName}: confidence=${(bestMatchForPhoto.faceMatch.confidence*100).toFixed(1)}%, distance=${bestMatchForPhoto.faceMatch.distance.toFixed(3)}`);
              
              if (onProgress) {
                onProgress({
                  type: 'match_found',
                  photo: photo.fileName || photo.originalName,
                  confidence: bestMatchForPhoto.faceMatch.confidence,
                  distance: bestMatchForPhoto.faceMatch.distance
                });
              }
            } else {
              console.log(`❌ No match in ${photo.fileName}: best distance was ${Math.min(...faces.map(f => userProfile.faceMatcher.findBestMatch(f.descriptor).distance)).toFixed(3)} (threshold: ${this.FACE_MATCHER_THRESHOLD})`);
            }
          } else {
            console.log(`❌ No faces detected in ${photo.fileName}`);
          }

        } catch (error) {
          if (error.message === 'CANCELLED') throw error;
          console.error(`❌ Failed to process ${photo.fileName}:`, error);
        }
      }

      // Sort by confidence (highest first)
      const sortedMatches = matches.sort((a, b) => b.faceMatch.confidence - a.faceMatch.confidence);
      
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      
      if (onProgress) {
        onProgress({
          type: 'completed',
          phase: 'Face recognition completed!',
          totalMatches: sortedMatches.length,
          averageConfidence: sortedMatches.length > 0 
            ? (sortedMatches.reduce((sum, p) => sum + p.faceMatch.confidence, 0) / sortedMatches.length * 100).toFixed(1)
            : 0,
          processingTime: processingTime
        });
      }

      console.log(`\n🎯 FACE-API.JS RECOGNITION RESULTS:`);
      console.log(`   Photos processed: ${photos.length} in ${processingTime}s`);
      console.log(`   Matches found: ${sortedMatches.length}`);
      console.log(`   Threshold: ${this.FACE_MATCHER_THRESHOLD} (distance)`);
      console.log(`   Average confidence: ${sortedMatches.length > 0 ? 
        (sortedMatches.reduce((sum, p) => sum + p.faceMatch.confidence, 0) / sortedMatches.length * 100).toFixed(1) : 0}%`);

      return sortedMatches;

    } catch (error) {
      this.isProcessing = false;
      
      if (error.message === 'CANCELLED') {
        console.log('🛑 Face recognition cancelled by user');
        if (onProgress) {
          onProgress({
            type: 'cancelled',
            phase: 'Face recognition cancelled'
          });
        }
        return [];
      }
      
      console.error('❌ Face recognition failed:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  // Load image from URL for processing
  async loadImageFromUrl(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(new Error(`Failed to load image: ${error}`));
      
      // Handle Firebase URL format
      let processedUrl = imageUrl;
      if (processedUrl.includes('appspot.com')) {
        processedUrl = processedUrl.replace('groupify-77202.appspot.com', 'groupify-77202.firebasestorage.app');
      }
      if (!processedUrl.includes('alt=media')) {
        processedUrl += (processedUrl.includes('?') ? '&' : '?') + 'alt=media';
      }
      
      img.src = processedUrl;
    });
  }

  // Utility methods
  calculateTimeRemaining(startTime, processed, total) {
    if (processed === 0) return null;
    const elapsed = Date.now() - startTime;
    const avgTimePerPhoto = elapsed / processed;
    const remaining = (total - processed) * avgTimePerPhoto;
    return Math.max(0, Math.round(remaining / 1000));
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
    console.log('🛑 Face recognition cancellation requested');
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
      engine: 'face-api.js',
      threshold: this.FACE_MATCHER_THRESHOLD,
      minFaceSize: this.MIN_FACE_SIZE,
      minDetectionConfidence: this.MIN_DETECTION_CONFIDENCE,
      minQualityThreshold: this.MIN_QUALITY_THRESHOLD
    };
  }

  // Diagnostic function to analyze why photos aren't matching
  async analyzePhoto(photoUrl, userId) {
    const userProfile = this.getFaceProfile(userId);
    if (!userProfile) {
      throw new Error('No face profile found');
    }

    const img = await this.loadImageFromUrl(photoUrl);
    const faces = await this.detectFacesWithQuality(img);
    
    console.log(`\n🔍 PHOTO ANALYSIS: ${photoUrl}`);
    console.log(`   Faces detected: ${faces.length}`);
    
    if (faces.length === 0) {
      console.log(`   ❌ No faces detected - check image quality, lighting, or face size`);
      return { faces: [], matches: [] };
    }

    const matches = [];
    faces.forEach((face, index) => {
      const bestMatch = userProfile.faceMatcher.findBestMatch(face.descriptor);
      const confidence = Math.max(0, 1 - bestMatch.distance);
      const wouldMatch = bestMatch.distance <= this.FACE_MATCHER_THRESHOLD && bestMatch.label !== 'unknown';
      
      console.log(`   Face ${index + 1}:`);
      console.log(`     Quality: ${(face.quality * 100).toFixed(1)}%`);
      console.log(`     Size: ${face.faceSize.toFixed(0)}px`);
      console.log(`     Detection confidence: ${(face.confidence * 100).toFixed(1)}%`);
      console.log(`     Best match distance: ${bestMatch.distance.toFixed(3)}`);
      console.log(`     Confidence: ${(confidence * 100).toFixed(1)}%`);
      console.log(`     Would match: ${wouldMatch ? '✅ YES' : '❌ NO'} (threshold: ${this.FACE_MATCHER_THRESHOLD})`);
      
      matches.push({
        face,
        bestMatch,
        confidence,
        wouldMatch,
        reasons: wouldMatch ? [] : this.getNoMatchReasons(face, bestMatch)
      });
    });

    return { faces, matches };
  }

  getNoMatchReasons(face, bestMatch) {
    const reasons = [];
    
    if (bestMatch.label === 'unknown') {
      reasons.push('Face not recognized as any profile face');
    }
    
    if (bestMatch.distance > this.FACE_MATCHER_THRESHOLD) {
      reasons.push(`Distance ${bestMatch.distance.toFixed(3)} > threshold ${this.FACE_MATCHER_THRESHOLD}`);
    }
    
    if (face.quality < this.MIN_QUALITY_THRESHOLD) {
      reasons.push(`Quality ${(face.quality * 100).toFixed(1)}% < minimum ${(this.MIN_QUALITY_THRESHOLD * 100).toFixed(1)}%`);
    }
    
    if (face.faceSize < this.MIN_FACE_SIZE) {
      reasons.push(`Face size ${face.faceSize.toFixed(0)}px < minimum ${this.MIN_FACE_SIZE}px`);
    }
    
    return reasons;
  }
}

// Create service instance
const faceRecognitionService = new ModernFaceRecognitionService();

// Export the same API for compatibility
export const createFaceProfile = async (userId, faceImages, onProgress = null) => {
  return await faceRecognitionService.createFaceProfile(userId, faceImages, onProgress);
};

export const filterPhotosByFaceProfile = async (photos, userId, onProgress = null) => {
  return await faceRecognitionService.filterPhotosByFaceProfile(photos, userId, onProgress);
};

export const hasFaceProfile = (userId) => {
  return faceRecognitionService.hasFaceProfile(userId);
};

export const getFaceProfile = (userId) => {
  return faceRecognitionService.getFaceProfile(userId);
};

export const deleteFaceProfile = (userId) => {
  return faceRecognitionService.deleteFaceProfile(userId);
};

export const cancelFaceRecognition = () => {
  faceRecognitionService.cancel();
};

export const resetFaceRecognition = () => {
  faceRecognitionService.reset();
};

export const getFaceRecognitionStatus = () => {
  return faceRecognitionService.getStatus();
};

// Diagnostic function for troubleshooting
export const analyzePhoto = async (photoUrl, userId) => {
  return await faceRecognitionService.analyzePhoto(photoUrl, userId);
};

// Threshold adjustment functions
export const setMatchingThreshold = (threshold) => {
  faceRecognitionService.FACE_MATCHER_THRESHOLD = threshold;
  console.log(`🔧 Matching threshold set to: ${threshold}`);
};

export const setQualityThreshold = (threshold) => {
  faceRecognitionService.MIN_QUALITY_THRESHOLD = threshold;
  console.log(`🔧 Quality threshold set to: ${threshold}`);
};

// Additional exports for backward compatibility
export const addPhotosToProfile = async (userId, newImages, onProgress = null) => {
  const existingProfile = faceRecognitionService.getFaceProfile(userId);
  if (!existingProfile) {
    throw new Error('No existing face profile found. Create a profile first.');
  }

  // Get original image URLs from existing profile
  const existingImageUrls = existingProfile.allFaces.map(f => f.sourceImage);
  const newImageUrls = newImages.map(img => img.url || img);
  
  // Combine all images
  const allImages = [...existingImageUrls, ...newImageUrls];

  // Recreate profile with all images
  return await faceRecognitionService.createFaceProfile(userId, allImages.map(url => ({ url })), onProgress);
};

export const removePhotosFromProfile = async (userId, imageUrlsToRemove) => {
  const existingProfile = faceRecognitionService.getFaceProfile(userId);
  if (!existingProfile) {
    throw new Error('No face profile found for user');
  }

  const remainingUrls = existingProfile.allFaces
    .map(f => f.sourceImage)
    .filter(url => !imageUrlsToRemove.includes(url));

  if (remainingUrls.length < 2) {
    throw new Error('Cannot remove - would leave less than 2 photos. Delete the profile instead.');
  }

  // Recreate profile with remaining images
  return await faceRecognitionService.createFaceProfile(userId, remainingUrls.map(url => ({ url })));
};

export const getProfilePhotos = (userId) => {
  const profile = faceRecognitionService.getFaceProfile(userId);
  if (!profile) return [];

  return profile.allFaces.map((face, index) => ({
    id: `profile_photo_${index}`,
    url: face.sourceImage,
    confidence: face.quality,
    method: 'face-api.js',
    addedAt: face.addedAt || profile.createdAt,
    qualityTier: face.quality > 0.8 ? 'high' : 
                 face.quality > 0.6 ? 'medium' : 'low',
    isInProfile: true, // All faces in face-api.js are used for matching
    faceSize: face.faceSize,
    detectionConfidence: face.confidence,
    qualityMetrics: face.qualityMetrics
  }));
};

export const optimizeProfile = (userId, minQuality = 0.75) => {
  const profile = faceRecognitionService.getFaceProfile(userId);
  if (!profile) {
    throw new Error('No face profile found for user');
  }

  // Filter faces by quality and recreate profile
  const highQualityImages = profile.allFaces
    .filter(face => face.quality >= minQuality)
    .map(face => face.sourceImage);

  if (highQualityImages.length < 2) {
    console.log('✅ Profile already optimized - insufficient high quality faces to filter');
    return profile;
  }

  console.log(`🔧 Optimizing profile: using ${highQualityImages.length}/${profile.allFaces.length} high quality faces`);
  return faceRecognitionService.createFaceProfile(userId, highQualityImages.map(url => ({ url })));
};

// Legacy compatibility for single-photo recognition
export const filterPhotosByFace = async (photos, userPhotoURL, onProgress = null) => {
  console.log('⚠️ Using legacy single-photo recognition with face-api.js.');
  
  // Initialize the service if needed
  if (!faceRecognitionService.isInitialized) {
    await faceRecognitionService.initialize();
  }

  try {
    // Load the user's reference image
    const img = await faceRecognitionService.loadImageFromUrl(userPhotoURL);
    const userFaces = await faceRecognitionService.detectFacesWithQuality(img);
    
    if (!userFaces || userFaces.length === 0) {
      throw new Error('Could not detect face in user photo');
    }

    const bestUserFace = userFaces.reduce((best, current) => 
      current.quality > best.quality ? current : best
    );

    // Create a temporary profile
    const tempProfile = {
      userId: 'temp_user',
      allFaces: [bestUserFace],
      faceMatcher: new (await import('face-api.js')).FaceMatcher(
        [new (await import('face-api.js')).LabeledFaceDescriptors('temp_user', [bestUserFace.descriptor])],
        faceRecognitionService.FACE_MATCHER_THRESHOLD
      ),
      createdAt: Date.now(),
      metadata: {
        totalImages: 1,
        facesDetected: 1,
        averageQuality: bestUserFace.quality,
        bestQuality: bestUserFace.quality,
        threshold: faceRecognitionService.FACE_MATCHER_THRESHOLD,
        engine: 'face-api.js'
      }
    };

    faceRecognitionService.userFaceProfiles.set('temp_user', tempProfile);
    
    try {
      const results = await faceRecognitionService.filterPhotosByFaceProfile(photos, 'temp_user', onProgress);
      return results;
    } finally {
      faceRecognitionService.userFaceProfiles.delete('temp_user');
    }
    
  } catch (error) {
    console.error('❌ Legacy face recognition failed:', error);
    throw error;
  }
};

export default faceRecognitionService;