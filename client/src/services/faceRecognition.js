import * as faceapi from 'face-api.js';

class FaceProfileRecognition {
  constructor() {
    this.modelsLoaded = false;
    this.modelUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    this.canvas = null;
    this.ctx = null;
    this.isProcessing = false;
    this.shouldCancel = false;
    this.currentBatch = 0;
    this.totalBatches = 0;
    this.totalPhotos = 0;
    
    // Enhanced caching system
    this.faceDescriptorCache = new Map();
    this.comparisonCache = new Map();
    this.cacheStats = { hits: 0, misses: 0, size: 0 };
    
    // Face Profile System
    this.userFaceProfiles = new Map(); // userId -> { descriptors: [], metadata: {} }
  }
  // 🚀 NEW: Add more photos to existing profile
async addPhotosToProfile(userId, newImages, onProgress = null) {
  console.log(`🔄 Adding ${newImages.length} photos to profile for user ${userId}`);
  
  const existingProfile = this.getFaceProfile(userId);
  if (!existingProfile) {
    throw new Error('No existing face profile found. Create a profile first.');
  }

  try {
    await this.loadModels();
    
    const newDescriptors = [];
    const newQualityScores = [];
    const newMethods = [];

    for (let i = 0; i < newImages.length; i++) {
      if (this.shouldCancel) throw new Error('CANCELLED');

      if (onProgress) {
        onProgress({
          type: 'adding_photos',
          current: i + 1,
          total: newImages.length,
          phase: `Processing new photo ${i + 1}/${newImages.length}...`
        });
      }

      const imageUrl = newImages[i].url || newImages[i];
      const descriptor = await this.getFaceDescriptor(imageUrl);
      
      if (descriptor && descriptor.descriptor) {
        // Store original image URL for management
        const descriptorWithUrl = {
          ...descriptor,
          originalImageUrl: imageUrl,
          addedAt: Date.now()
        };
        
        newDescriptors.push(descriptorWithUrl);
        newQualityScores.push(descriptor.confidence);
        newMethods.push(descriptor.method);
        console.log(`✅ New photo ${i + 1}: ${descriptor.method} (${(descriptor.confidence * 100).toFixed(1)}%)`);
      } else {
        console.warn(`⚠️ Could not detect face in new image ${i + 1}`);
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (newDescriptors.length === 0) {
      throw new Error('No faces detected in any of the new images');
    }

    // Merge with existing profile
    const updatedDescriptors = [...existingProfile.descriptors, ...newDescriptors];
    const updatedQualityScores = [...existingProfile.metadata.qualityScores, ...newQualityScores];
    const updatedMethods = [...existingProfile.metadata.methods, ...newMethods];

    // Recalculate average descriptor
    const avgDescriptor = this.calculateAverageDescriptor(updatedDescriptors);
    
    const updatedProfile = {
      ...existingProfile,
      descriptors: updatedDescriptors,
      averageDescriptor: avgDescriptor,
      metadata: {
        ...existingProfile.metadata,
        imageCount: updatedDescriptors.length,
        qualityScores: updatedQualityScores,
        methods: updatedMethods,
        avgQuality: updatedQualityScores.reduce((a, b) => a + b, 0) / updatedQualityScores.length,
        successRate: ((updatedDescriptors.length / (existingProfile.metadata.imageCount + newImages.length)) * 100).toFixed(1),
        lastUpdated: Date.now()
      }
    };

    this.userFaceProfiles.set(userId, updatedProfile);
    
    if (onProgress) {
      onProgress({
        type: 'photos_added',
        phase: 'Photos added successfully!',
        addedCount: newDescriptors.length,
        totalCount: updatedDescriptors.length,
        avgQuality: updatedProfile.metadata.avgQuality
      });
    }

    console.log(`🎯 Added photos to profile for ${userId}:`);
    console.log(`   New descriptors: ${newDescriptors.length}/${newImages.length}`);
    console.log(`   Total descriptors: ${updatedDescriptors.length}`);
    console.log(`   Updated avg quality: ${(updatedProfile.metadata.avgQuality * 100).toFixed(1)}%`);

    return updatedProfile;
    
  } catch (error) {
    console.error('❌ Failed to add photos to profile:', error);
    throw error;
  }
}

// 🚀 NEW: Remove specific photos from profile
removePhotosFromProfile(userId, imageUrlsToRemove) {
  console.log(`🗑️ Removing ${imageUrlsToRemove.length} photos from profile for user ${userId}`);
  
  const existingProfile = this.getFaceProfile(userId);
  if (!existingProfile) {
    throw new Error('No face profile found for user');
  }

  // Filter out descriptors for the specified image URLs
  const remainingDescriptors = existingProfile.descriptors.filter(descriptor => 
    !imageUrlsToRemove.includes(descriptor.originalImageUrl)
  );

  if (remainingDescriptors.length === 0) {
    throw new Error('Cannot remove all photos from profile. Delete the profile instead.');
  }

  // Recalculate metadata
  const remainingQualityScores = remainingDescriptors.map(d => d.confidence);
  const remainingMethods = remainingDescriptors.map(d => d.method);

  // Recalculate average descriptor
  const avgDescriptor = this.calculateAverageDescriptor(remainingDescriptors);
  
  const updatedProfile = {
    ...existingProfile,
    descriptors: remainingDescriptors,
    averageDescriptor: avgDescriptor,
    metadata: {
      ...existingProfile.metadata,
      imageCount: remainingDescriptors.length,
      qualityScores: remainingQualityScores,
      methods: remainingMethods,
      avgQuality: remainingQualityScores.reduce((a, b) => a + b, 0) / remainingQualityScores.length,
      successRate: ((remainingDescriptors.length / existingProfile.metadata.imageCount) * 100).toFixed(1),
      lastUpdated: Date.now()
    }
  };

  this.userFaceProfiles.set(userId, updatedProfile);
  
  console.log(`🎯 Removed photos from profile for ${userId}:`);
  console.log(`   Removed: ${imageUrlsToRemove.length} photos`);
  console.log(`   Remaining: ${remainingDescriptors.length} descriptors`);

  return updatedProfile;
}

// 🚀 NEW: Get profile photos with metadata
getProfilePhotos(userId) {
  const profile = this.getFaceProfile(userId);
  if (!profile) return [];

  return profile.descriptors.map((descriptor, index) => ({
    id: `profile_photo_${index}`,
    url: descriptor.originalImageUrl,
    confidence: descriptor.confidence,
    method: descriptor.method,
    addedAt: descriptor.addedAt || profile.metadata.createdAt,
    qualityTier: descriptor.confidence > 0.8 ? 'high' : 
                 descriptor.confidence > 0.6 ? 'medium' : 'low'
  }));
}

// 🚀 NEW: Replace entire profile with new photos
async replaceProfile(userId, newImages, onProgress = null) {
  console.log(`🔄 Replacing entire profile for user ${userId} with ${newImages.length} new images`);
  
  // Delete existing profile
  this.deleteFaceProfile(userId);
  
  // Create new profile
  return await this.createFaceProfile(userId, newImages, onProgress);
}

// 🚀 NEW: Optimize profile by removing low-quality photos
optimizeProfile(userId, minQuality = 0.5) {
  console.log(`🔧 Optimizing profile for user ${userId} (min quality: ${minQuality})`);
  
  const profile = this.getFaceProfile(userId);
  if (!profile) {
    throw new Error('No face profile found for user');
  }

  const lowQualityUrls = profile.descriptors
    .filter(descriptor => descriptor.confidence < minQuality)
    .map(descriptor => descriptor.originalImageUrl)
    .filter(url => url); // Only include URLs that exist

  if (lowQualityUrls.length === 0) {
    console.log('✅ Profile already optimized - no low quality photos found');
    return profile;
  }

  if (profile.descriptors.length - lowQualityUrls.length < 1) {
    throw new Error('Cannot optimize - would remove all photos. Lower the quality threshold.');
  }

  return this.removePhotosFromProfile(userId, lowQualityUrls);
}

// Replace your existing createFaceProfile method with this updated version:

async createFaceProfile(userId, faceImages, onProgress = null) {
  console.log(`🔍 Creating face profile for user ${userId} with ${faceImages.length} images`);
  
  try {
    await this.loadModels();
    
    const faceDescriptors = [];
    const metadata = {
      createdAt: Date.now(),
      imageCount: faceImages.length,
      qualityScores: [],
      methods: []
    };

    for (let i = 0; i < faceImages.length; i++) {
      if (this.shouldCancel) throw new Error('CANCELLED');

      if (onProgress) {
        onProgress({
          type: 'processing_profile',
          current: i + 1,
          total: faceImages.length,
          phase: `Analyzing face image ${i + 1}/${faceImages.length}...`
        });
      }

      const imageUrl = faceImages[i].url || faceImages[i];
      const descriptor = await this.getFaceDescriptor(imageUrl);
      
      if (descriptor && descriptor.descriptor) {
        // Store original image URL for management
        const descriptorWithUrl = {
          ...descriptor,
          originalImageUrl: imageUrl,
          addedAt: Date.now()
        };
        
        faceDescriptors.push(descriptorWithUrl);
        metadata.qualityScores.push(descriptor.confidence);
        metadata.methods.push(descriptor.method);
        console.log(`✅ Face ${i + 1}: ${descriptor.method} (${(descriptor.confidence * 100).toFixed(1)}%)`);
      } else {
        console.warn(`⚠️ Could not detect face in image ${i + 1}`);
      }

      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
    }

    if (faceDescriptors.length === 0) {
      throw new Error('No faces detected in any of the provided images');
    }

    // Calculate average descriptor for better matching
    const avgDescriptor = this.calculateAverageDescriptor(faceDescriptors);
    
    const profile = {
      descriptors: faceDescriptors,
      averageDescriptor: avgDescriptor,
      metadata: {
        ...metadata,
        avgQuality: metadata.qualityScores.reduce((a, b) => a + b, 0) / metadata.qualityScores.length,
        successRate: (faceDescriptors.length / faceImages.length * 100).toFixed(1)
      }
    };

    this.userFaceProfiles.set(userId, profile);
    
    if (onProgress) {
      onProgress({
        type: 'profile_completed',
        phase: 'Face profile created successfully!',
        descriptorsCreated: faceDescriptors.length,
        avgQuality: profile.metadata.avgQuality,
        successRate: profile.metadata.successRate
      });
    }

    console.log(`🎯 Face profile created for ${userId}:`);
    console.log(`   Descriptors: ${faceDescriptors.length}/${faceImages.length}`);
    console.log(`   Avg quality: ${(profile.metadata.avgQuality * 100).toFixed(1)}%`);
    console.log(`   Success rate: ${profile.metadata.successRate}%`);

    return profile;
    
  } catch (error) {
    console.error('❌ Failed to create face profile:', error);
    throw error;
  }
}

// Replace your existing calculateAverageDescriptor method with this updated version:

calculateAverageDescriptor(descriptors) {
  if (descriptors.length === 0) return null;
  if (descriptors.length === 1) return descriptors[0];

  const avgDescriptor = new Float32Array(128);
  
  // Calculate weighted average based on confidence
  let totalWeight = 0;
  
  descriptors.forEach(desc => {
    const weight = desc.confidence; // Higher confidence = more weight
    totalWeight += weight;
    
    for (let i = 0; i < 128; i++) {
      avgDescriptor[i] += desc.descriptor[i] * weight;
    }
  });
  
  // Normalize
  for (let i = 0; i < 128; i++) {
    avgDescriptor[i] /= totalWeight;
  }

  return {
    descriptor: avgDescriptor,
    confidence: descriptors.reduce((sum, d) => sum + d.confidence, 0) / descriptors.length,
    method: 'AVERAGE_PROFILE',
    isProfile: true,
    originalImageUrl: 'averaged_profile', // Mark as averaged
    addedAt: Date.now()
  };
}
  getFaceProfile(userId) {
    return this.userFaceProfiles.get(userId);
  }

  hasFaceProfile(userId) {
    return this.userFaceProfiles.has(userId);
  }

  deleteFaceProfile(userId) {
    const deleted = this.userFaceProfiles.delete(userId);
    if (deleted) {
      console.log(`🗑️ Deleted face profile for user ${userId}`);
    }
    return deleted;
  }

  // Enhanced multi-reference face comparison
  compareWithFaceProfile(userProfile, photoFace, userPhotoURL = '', tripPhotoURL = '') {
    if (!userProfile || !photoFace?.descriptor) {
      return { match: false, confidence: 0, reason: 'Missing profile or photo face' };
    }

    // Check cache first
    if (userPhotoURL && tripPhotoURL) {
      const cached = this.getCachedComparison(userPhotoURL, tripPhotoURL);
      if (cached) {
        this.cacheStats.hits++;
        return cached;
      }
    }

    const results = [];
    
    // Compare with average descriptor first (most reliable)
    if (userProfile.averageDescriptor) {
      const avgResult = this.compareSingleDescriptor(userProfile.averageDescriptor, photoFace);
      avgResult.comparisonType = 'average';
      results.push(avgResult);
    }

    // Compare with individual descriptors
    userProfile.descriptors.forEach((userFace, index) => {
      const result = this.compareSingleDescriptor(userFace, photoFace);
      result.comparisonType = `individual_${index}`;
      results.push(result);
    });

    // Find best match
    const bestMatch = results.reduce((best, current) => 
      current.combinedScore > best.combinedScore ? current : best
    );

    // Enhanced scoring system
    const avgScore = results.reduce((sum, r) => sum + r.combinedScore, 0) / results.length;
    const maxScore = Math.max(...results.map(r => r.combinedScore));
    const minDistance = Math.min(...results.map(r => r.euclideanDistance));
    const maxCosine = Math.max(...results.map(r => r.cosineSimilarity));
    
    // Consensus-based matching
    const strongMatches = results.filter(r => r.isStrongMatch).length;
    const weakMatches = results.filter(r => r.isWeakMatch).length;
    const totalComparisons = results.length;
    
    // Calculate agreement ratios
    const strongRatio = strongMatches / totalComparisons;
    const weakRatio = weakMatches / totalComparisons;
    const overallRatio = (strongMatches + weakMatches) / totalComparisons;
    
    // Multi-pathway matching with quality gates
    let isStrongMatch = false;
    let isWeakMatch = false;
    
    // Strong match pathways (high confidence required)
    if (
      (strongRatio >= 0.5 && maxScore > 0.65 && avgScore > 0.55) ||  // Good consensus
      (strongMatches >= 2 && maxScore > 0.70) ||                     // Multiple strong agreements
      (maxScore > 0.78 && avgScore > 0.60)                           // Single excellent match
    ) {
      isStrongMatch = true;
    }
    
    // Weak match pathways (moderate confidence, strict quality gates)
    else if (
      (overallRatio >= 0.5 && maxScore > 0.58 && avgScore > 0.50 && maxCosine > 0.40) ||  // Decent consensus with quality
      (weakMatches >= 2 && maxScore > 0.60 && avgScore > 0.48) ||                         // Multiple weak agreements
      (strongMatches >= 1 && maxScore > 0.62 && avgScore > 0.45) ||                       // At least one strong + decent overall
      (maxScore > 0.68 && avgScore > 0.50 && maxCosine > 0.42)                           // Single good match with quality
    ) {
      isWeakMatch = true;
    }
    
    const finalMatch = isStrongMatch || isWeakMatch;
    
    // Confidence calculation with quality adjustment
    let finalConfidence = avgScore;
    if (finalMatch) {
      // Boost confidence for matches, but cap it reasonably
      const qualityBoost = Math.min(0.15, maxCosine * 0.3); // Cosine similarity boost
      const consensusBoost = Math.min(0.1, overallRatio * 0.15); // Consensus boost
      finalConfidence = Math.min(0.92, (maxScore + avgScore) / 2 + qualityBoost + consensusBoost);
    }
    
    const result = {
      match: finalMatch,
      confidence: finalConfidence,
      matchType: isStrongMatch ? 'strong' : (isWeakMatch ? 'weak' : 'none'),
      
      // Detailed metrics
      euclideanDistance: minDistance,
      cosineSimilarity: maxCosine,
      combinedScore: maxScore,
      averageScore: avgScore,
      
      // Profile-specific data
      profileComparisons: results.length,
      strongMatches: strongMatches,
      weakMatches: weakMatches,
      consensus: strongRatio >= 0.5 ? 'strong' : (overallRatio >= 0.5 ? 'weak' : 'none'),
      bestComparison: bestMatch.comparisonType,
      
      // Quality indicators
      strongRatio: strongRatio,
      weakRatio: weakRatio,
      overallRatio: overallRatio,
      qualityScore: (maxScore + avgScore + maxCosine) / 3,
      
      // Methods
      methods: `PROFILE_${userProfile.descriptors.length}_vs_${photoFace.method}`,
      reason: `${strongMatches}/${totalComparisons} strong, ${weakMatches}/${totalComparisons} weak matches`
    };

    // Cache the result
    if (userPhotoURL && tripPhotoURL) {
      this.setCachedComparison(userPhotoURL, tripPhotoURL, result);
    }
    
    console.log(`👤 PROFILE face comparison:`);
    console.log(`   Profile: ${userProfile.descriptors.length} references`);
    console.log(`   Best match: ${maxScore.toFixed(3)} | Avg: ${avgScore.toFixed(3)}`);
    console.log(`   Consensus: ${strongMatches}/${totalComparisons} strong, ${weakMatches}/${totalComparisons} weak`);
    console.log(`   Quality: ${(result.qualityScore * 100).toFixed(1)}% | Ratios: S${(strongRatio*100).toFixed(0)}% W${(overallRatio*100).toFixed(0)}%`);
    console.log(`   Result: ${finalMatch ? '✅' : '❌'} (${result.matchType}, confidence: ${(finalConfidence * 100).toFixed(1)}%)`);
    
    return result;
  }

  // Quality-gated single descriptor comparison
  compareSingleDescriptor(userFace, photoFace) {
    const euclideanDistance = faceapi.euclideanDistance(userFace.descriptor, photoFace.descriptor);
    const cosineSimilarity = this.calculateCosineSimilarity(userFace.descriptor, photoFace.descriptor);
    const similarity = Math.max(0, 1 - euclideanDistance);
    
    // Adaptive thresholds based on face quality
    const avgConfidence = (userFace.confidence + photoFace.confidence) / 2;
    const baseThreshold = 0.52; // Moderate base threshold
    
    // Quality-based adjustments (more conservative)
    const confidenceMultiplier = avgConfidence > 0.8 ? 1.1 : 
                                avgConfidence > 0.6 ? 1.0 : 0.95;
    
    const methodReliability = userFace.method === 'AVERAGE_PROFILE' ? 1.05 : 
                             this.getMethodReliability(userFace.method, photoFace.method);
    
    const adjustedThreshold = baseThreshold * confidenceMultiplier * methodReliability;
    
    // Multiple validation criteria
    const euclideanMatch = euclideanDistance < adjustedThreshold;
    const cosineMatch = cosineSimilarity > 0.40; // Moderate cosine threshold
    const combinedScore = (similarity * 0.6) + (cosineSimilarity * 0.4);
    
    // Quality-gated match decisions
    const highQuality = avgConfidence > 0.75 && combinedScore > 0.50;
    const mediumQuality = avgConfidence > 0.60 && combinedScore > 0.45;
    const lowQuality = avgConfidence > 0.50 && combinedScore > 0.40;
    
    const isStrongMatch = euclideanMatch && cosineMatch && (
                         (highQuality && combinedScore > 0.58) ||
                         (mediumQuality && combinedScore > 0.62)
                       );
    
    const isWeakMatch = euclideanMatch && cosineMatch && (
                       (highQuality && combinedScore > 0.48) ||
                       (mediumQuality && combinedScore > 0.52) ||
                       (lowQuality && combinedScore > 0.55)
                     );
    
    return {
      euclideanDistance,
      cosineSimilarity,
      similarity,
      combinedScore,
      threshold: adjustedThreshold,
      isStrongMatch,
      isWeakMatch,
      avgConfidence,
      qualityTier: highQuality ? 'high' : (mediumQuality ? 'medium' : 'low')
    };
  }

  // Cache management methods
  getCacheKey(userPhotoURL, tripPhotoURL) {
    return `${userPhotoURL.split('?')[0]}_${tripPhotoURL.split('?')[0]}`;
  }

  getCachedComparison(userPhotoURL, tripPhotoURL) {
    const key = this.getCacheKey(userPhotoURL, tripPhotoURL);
    const cached = this.comparisonCache.get(key);
    if (cached) {
      this.cacheStats.hits++;
      return cached;
    }
    this.cacheStats.misses++;
    return null;
  }

  setCachedComparison(userPhotoURL, tripPhotoURL, result) {
    const key = this.getCacheKey(userPhotoURL, tripPhotoURL);
    this.comparisonCache.set(key, result);
  }

  getCachedDescriptor(imageURL) {
    const cleanURL = imageURL.split('?')[0];
    const cached = this.faceDescriptorCache.get(cleanURL);
    if (cached) {
      return cached;
    }
    return null;
  }

  setCachedDescriptor(imageURL, descriptor) {
    const cleanURL = imageURL.split('?')[0];
    this.faceDescriptorCache.set(cleanURL, descriptor);
    this.cacheStats.size = this.faceDescriptorCache.size;
  }

  clearCache() {
    this.faceDescriptorCache.clear();
    this.comparisonCache.clear();
    this.cacheStats = { hits: 0, misses: 0, size: 0 };
    console.log('🗑️ Face recognition cache cleared');
  }

  getCacheStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(1)
      : 0;
    
    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      memoryUsage: `${this.faceDescriptorCache.size} descriptors, ${this.comparisonCache.size} comparisons`,
      profilesLoaded: this.userFaceProfiles.size
    };
  }

  async loadModels() {
    if (this.modelsLoaded) return;
    
    try {
      console.log('🔄 Loading production face recognition models...');
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.modelUrl),
        faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelUrl),
        faceapi.nets.mtcnn.loadFromUri(this.modelUrl),
      ]);
      
      this.modelsLoaded = true;
      console.log('✅ All production face recognition models loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load face recognition models:', error);
      throw error;
    }
  }

  cancel() {
    console.log('🛑 Face recognition cancellation requested');
    this.shouldCancel = true;
  }

  reset() {
    this.shouldCancel = false;
    this.isProcessing = false;
    this.currentBatch = 0;
    this.totalBatches = 0;
  }

  getCanvas() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      try {
        this.ctx.willReadFrequently = true;
      } catch (e) {
        // Ignore if not supported
      }
    }
    return { canvas: this.canvas, ctx: this.ctx };
  }

  preprocessImage(img) {
    const { canvas, ctx } = this.getCanvas();
    
    const maxSize = 720;
    let { width, height } = img;
    
    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    return canvas;
  }

  async createImageElement(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 10000);
      
      img.onload = () => {
        clearTimeout(timeout);
        if (img.complete && img.naturalHeight !== 0) {
          resolve(img);
        } else {
          reject(new Error('Image failed to load properly'));
        }
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${error.message || 'Unknown error'}`));
      };
      
      const cleanUrl = imageUrl.replace('groupify-77202.appspot.com', 'groupify-77202.firebasestorage.app');
      const separator = cleanUrl.includes('?') ? '&' : '?';
      img.src = `${cleanUrl}${separator}t=${Date.now()}`;
    });
  }

  // Better 403 error handling with comprehensive fallback
  async getFaceDescriptor(imageUrl) {
    const cached = this.getCachedDescriptor(imageUrl);
    if (cached) {
      return cached;
    }

    try {
      let img;
      let attemptCount = 0;
      const maxAttempts = 3;
      
      // More comprehensive fallback strategy
      const urlVariations = [
        imageUrl, // Original URL
        imageUrl.replace('groupify-77202.appspot.com', 'groupify-77202.firebasestorage.app'),
        imageUrl.replace('groupify-77202.firebasestorage.app', 'groupify-77202.appspot.com'),
        // Add cache busting
        `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`,
        // Try without token (sometimes helps)
        imageUrl.split('&token=')[0].split('?token=')[0]
      ];
      
      for (const urlVariation of urlVariations) {
        if (attemptCount >= maxAttempts) break;
        
        try {
          console.log(`🔄 Attempt ${attemptCount + 1}: Trying URL variation...`);
          img = await this.createImageElement(urlVariation);
          break; // Success!
        } catch (urlError) {
          attemptCount++;
          console.warn(`⚠️ URL variation ${attemptCount} failed:`, urlError.message);
          
          if (attemptCount < maxAttempts) {
            // Progressive delay
            await new Promise(resolve => setTimeout(resolve, attemptCount * 500));
          }
        }
      }
      
      if (!img) {
        console.error(`❌ All URL variations failed for image`);
        this.setCachedDescriptor(imageUrl, null);
        return null;
      }

      const processedImg = this.preprocessImage(img);
      
      // Moderate detection strategies
      const detectionStrategies = [
        {
          name: 'MTCNN_STRICT',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.MtcnnOptions({ 
              minFaceSize: 90, // Slightly raised for quality
              scaleFactor: 0.709,
              scoreThresholds: [0.65, 0.75, 0.75] // Moderate thresholds
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'SSD_STRICT',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.5, // Moderate confidence
              maxResults: 1
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'MTCNN_BALANCED',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.MtcnnOptions({ 
              minFaceSize: 70,
              scaleFactor: 0.709,
              scoreThresholds: [0.55, 0.65, 0.65]
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'TINY_FALLBACK',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.4 // Conservative fallback
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        }
      ];

      for (const strategy of detectionStrategies) {
        if (this.shouldCancel) throw new Error('CANCELLED');
        
        try {
          const detection = await strategy.detect();
          
          if (detection && detection.descriptor && detection.descriptor.length === 128) {
            const confidence = detection.detection?.score || detection.detection?._score || 0.5;
            
            const result = {
              descriptor: detection.descriptor,
              confidence: confidence,
              method: strategy.name,
              landmarks: detection.landmarks,
              box: detection.detection.box
            };

            this.setCachedDescriptor(imageUrl, result);
            console.log(`✅ Face detected: ${strategy.name} (${(confidence * 100).toFixed(1)}%)`);
            return result;
          }
        } catch (error) {
          if (error.message === 'CANCELLED') throw error;
          console.warn(`⚠️ ${strategy.name} failed:`, error.message);
          continue;
        }
      }
      
      this.setCachedDescriptor(imageUrl, null);
      return null;
    } catch (error) {
      if (error.message === 'CANCELLED') throw error;
      console.error('❌ Error in getFaceDescriptor:', error);
      return null;
    }
  }

  calculateCosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  getMethodReliability(method1, method2) {
    const reliabilityScores = {
      'AVERAGE_PROFILE': 1.2,
      'MTCNN_STRICT': 1.0,
      'MTCNN_BALANCED': 0.95,
      'SSD_STRICT': 0.9,
      'SSD_BALANCED': 0.85,
      'TINY_HIGH': 0.8,
      'TINY_FALLBACK': 0.7
    };
    
    const score1 = reliabilityScores[method1] || 0.6;
    const score2 = reliabilityScores[method2] || 0.6;
    
    return Math.sqrt(score1 * score2);
  }

  // Enhanced batch processing with profile support
  async processBatch(photos, userProfile, userId, batchIndex, batchSize, onProgress) {
    const batchResults = [];
    const batchStartTime = Date.now();
    
    for (let i = 0; i < photos.length; i++) {
      if (this.shouldCancel) {
        throw new Error('CANCELLED');
      }
      
      const photo = photos[i];
      const globalIndex = (batchIndex * batchSize) + i;
      
      try {
        if (onProgress) {
          const estimatedTimeRemaining = this.calculateTimeRemaining(batchStartTime, i, photos.length);
          onProgress({
            type: 'processing',
            current: globalIndex + 1,
            total: this.totalPhotos,
            batch: batchIndex + 1,
            totalBatches: this.totalBatches,
            currentPhoto: photo.fileName || photo.originalName || `Photo ${globalIndex + 1}`,
            estimatedTimeRemaining,
            phase: 'Analyzing faces with profile...'
          });
        }
        
        const photoFace = await this.getFaceDescriptor(photo.downloadURL);
        
        if (photoFace) {
          // Use profile-based comparison
          const comparison = this.compareWithFaceProfile(userProfile, photoFace, '', photo.downloadURL);
          
          if (comparison.match) {
            batchResults.push({
              ...photo,
              faceMatch: {
                confidence: comparison.confidence,
                matchType: comparison.matchType,
                detectionMethod: photoFace.method,
                profileComparisons: comparison.profileComparisons,
                consensus: comparison.consensus,
                strongMatches: comparison.strongMatches,
                weakMatches: comparison.weakMatches,
                reason: comparison.reason,
                qualityScore: comparison.qualityScore
              }
            });
            
            if (onProgress) {
              onProgress({
                type: 'match_found',
                photo: photo.fileName || photo.originalName || `Photo ${globalIndex + 1}`,
                confidence: comparison.confidence,
                matchType: comparison.matchType,
                consensus: comparison.consensus
              });
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 25));
        
      } catch (error) {
        if (error.message === 'CANCELLED') throw error;
        console.error(`❌ Failed to process ${photo.fileName}:`, error);
        
        if (onProgress) {
          onProgress({
            type: 'error',
            photo: photo.fileName || photo.originalName || `Photo ${globalIndex + 1}`,
            error: error.message
          });
        }
      }
    }
    
    return batchResults;
  }

  calculateTimeRemaining(startTime, processed, total) {
    if (processed === 0) return null;
    
    const elapsed = Date.now() - startTime;
    const avgTimePerPhoto = elapsed / processed;
    const remaining = (total - processed) * avgTimePerPhoto;
    
    return Math.max(0, Math.round(remaining / 1000));
  }

  // MAIN: Enhanced profile-based photo filtering
  async filterPhotosByFaceProfile(photos, userId, onProgress = null) {
    if (!photos.length) {
      console.log('❌ No photos to process');
      return [];
    }

    const userProfile = this.getFaceProfile(userId);
    if (!userProfile) {
      throw new Error('No face profile found for user. Please create a face profile first.');
    }

    this.reset();
    this.isProcessing = true;
    const startTime = Date.now();
    
    try {
      await this.loadModels();
      
      if (this.shouldCancel) throw new Error('CANCELLED');
      
      console.log('🔍 Starting PROFILE-BASED face recognition...');
      console.log(`👤 Using profile with ${userProfile.descriptors.length} reference faces`);
      console.log('📊 Cache stats before processing:', this.getCacheStats());
      this.totalPhotos = photos.length;
      
      if (onProgress) {
        onProgress({
          type: 'initializing',
          phase: `Using face profile with ${userProfile.descriptors.length} references...`,
          current: 0,
          total: photos.length,
          profileInfo: {
            references: userProfile.descriptors.length,
            avgQuality: userProfile.metadata.avgQuality,
            successRate: userProfile.metadata.successRate
          }
        });
      }
      
      if (this.shouldCancel) throw new Error('CANCELLED');
      
      // Enhanced batch processing
      const batchSize = 2;
      const batches = [];
      
      for (let i = 0; i < photos.length; i += batchSize) {
        batches.push(photos.slice(i, i + batchSize));
      }
      
      this.totalBatches = batches.length;
      const allMatches = [];
      
      if (onProgress) {
        onProgress({
          type: 'batch_starting',
          phase: 'Processing photos with face profile...',
          totalBatches: this.totalBatches,
          batchSize: batchSize
        });
      }
      
      // Process batches
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (this.shouldCancel) throw new Error('CANCELLED');
        
        this.currentBatch = batchIndex;
        
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}`);
        
        const batchResults = await this.processBatch(
          batches[batchIndex], 
          userProfile,
          userId,
          batchIndex, 
          batchSize, 
          onProgress
        );
        
        allMatches.push(...batchResults);
        
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Sort by confidence
      const sortedMatches = allMatches.sort((a, b) => b.faceMatch.confidence - a.faceMatch.confidence);
      
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      const finalCacheStats = this.getCacheStats();
      
      if (onProgress) {
        onProgress({
          type: 'completed',
          phase: 'Profile-based face recognition completed!',
          totalMatches: sortedMatches.length,
          strongMatches: sortedMatches.filter(p => p.faceMatch.matchType === 'strong').length,
          weakMatches: sortedMatches.filter(p => p.faceMatch.matchType === 'weak').length,
          averageConfidence: sortedMatches.length > 0 
            ? (sortedMatches.reduce((sum, p) => sum + p.faceMatch.confidence, 0) / sortedMatches.length * 100).toFixed(1)
            : 0,
          processingTime: processingTime,
          cacheStats: finalCacheStats,
          profileUsed: {
            references: userProfile.descriptors.length,
            avgQuality: (userProfile.metadata.avgQuality * 100).toFixed(1)
          }
        });
      }
      
      console.log(`\n🎯 PROFILE-BASED RESULTS:`);
      console.log(`   Photos processed: ${photos.length} in ${processingTime}s`);
      console.log(`   Profile references: ${userProfile.descriptors.length}`);
      console.log(`   Matches found: ${sortedMatches.length}`);
      console.log(`   Strong matches: ${sortedMatches.filter(p => p.faceMatch.matchType === 'strong').length}`);
      console.log(`   Weak matches: ${sortedMatches.filter(p => p.faceMatch.matchType === 'weak').length}`);
      console.log(`   📊 Cache performance: ${finalCacheStats.hitRate} hit rate`);
      
      return sortedMatches;
      
    } catch (error) {
      this.isProcessing = false;
      
      if (error.message === 'CANCELLED') {
        console.log('🛑 Face recognition was cancelled by user');
        if (onProgress) {
          onProgress({
            type: 'cancelled',
            phase: 'Face recognition cancelled'
          });
        }
        return [];
      }
      
      console.error('❌ Profile-based face recognition failed:', error);
      if (onProgress) {
        onProgress({
          type: 'error',
          phase: 'Face recognition failed',
          error: error.message
        });
      }
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  getStatus() {
    return {
      isProcessing: this.isProcessing,
      shouldCancel: this.shouldCancel,
      currentBatch: this.currentBatch,
      totalBatches: this.totalBatches,
      cacheStats: this.getCacheStats(),
      profilesLoaded: this.userFaceProfiles.size
    };
  }
}

// Create singleton instance
const faceProfileRecognition = new FaceProfileRecognition();

// Profile-based API
export const createFaceProfile = async (userId, faceImages, onProgress = null) => {
  return await faceProfileRecognition.createFaceProfile(userId, faceImages, onProgress);
};

export const filterPhotosByFaceProfile = async (photos, userId, onProgress = null) => {
  return await faceProfileRecognition.filterPhotosByFaceProfile(photos, userId, onProgress);
};

export const hasFaceProfile = (userId) => {
  return faceProfileRecognition.hasFaceProfile(userId);
};

export const getFaceProfile = (userId) => {
  return faceProfileRecognition.getFaceProfile(userId);
};

export const deleteFaceProfile = (userId) => {
  return faceProfileRecognition.deleteFaceProfile(userId);
};

// Enhanced existing API with fallback support
export const filterPhotosByFace = async (photos, userPhotoURL, onProgress = null) => {
  // Try to extract userId from URL or use profile-based recognition
  console.log('⚠️ Using legacy single-photo recognition. Consider creating a face profile for better accuracy.');
  
  // Fallback to single-photo method for backwards compatibility
  const userFace = await faceProfileRecognition.getFaceDescriptor(userPhotoURL);
  if (!userFace) {
    throw new Error('Could not detect face in user photo');
  }

  // Create temporary single-descriptor profile
  const tempProfile = {
    descriptors: [userFace],
    averageDescriptor: userFace,
    metadata: { avgQuality: userFace.confidence }
  };

  faceProfileRecognition.userFaceProfiles.set('temp_user', tempProfile);
  
  try {
    const results = await faceProfileRecognition.filterPhotosByFaceProfile(photos, 'temp_user', onProgress);
    return results;
  } finally {
    faceProfileRecognition.userFaceProfiles.delete('temp_user');
  }
};

export const cancelFaceRecognition = () => {
  faceProfileRecognition.cancel();
};

export const getFaceRecognitionStatus = () => {
  return faceProfileRecognition.getStatus();
};

export const resetFaceRecognition = () => {
  faceProfileRecognition.reset();
};

export const clearFaceRecognitionCache = () => {
  faceProfileRecognition.clearCache();
};

export const getFaceRecognitionCacheStats = () => {
  return faceProfileRecognition.getCacheStats();
};

// 🚀 NEW: Profile management functions
export const addPhotosToProfile = async (userId, newImages, onProgress = null) => {
  return await faceProfileRecognition.addPhotosToProfile(userId, newImages, onProgress);
};

export const removePhotosFromProfile = (userId, imageUrlsToRemove) => {
  return faceProfileRecognition.removePhotosFromProfile(userId, imageUrlsToRemove);
};

export const getProfilePhotos = (userId) => {
  return faceProfileRecognition.getProfilePhotos(userId);
};

export const replaceProfile = async (userId, newImages, onProgress = null) => {
  return await faceProfileRecognition.replaceProfile(userId, newImages, onProgress);
};

export const optimizeProfile = (userId, minQuality = 0.5) => {
  return faceProfileRecognition.optimizeProfile(userId, minQuality);
};