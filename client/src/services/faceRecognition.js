import * as faceapi from 'face-api.js';

class ProductionFaceRecognition {
  constructor() {
    this.modelsLoaded = false;
    this.modelUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    this.canvas = null;
    this.ctx = null;
  }

  async loadModels() {
    if (this.modelsLoaded) return;
    
    try {
      console.log('🔄 Loading production face recognition models...');
      
      // Load all models for maximum accuracy and fallback options
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

  // Create canvas for image preprocessing
  getCanvas() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      // Optimize for frequent reading operations
      try {
        this.ctx.willReadFrequently = true;
      } catch (e) {
        // Ignore if not supported
      }
    }
    return { canvas: this.canvas, ctx: this.ctx };
  }

  // Robust image preprocessing that works across different conditions
  preprocessImage(img) {
    const { canvas, ctx } = this.getCanvas();
    
    // Balanced size for accuracy vs performance
    const maxSize = 720;
    let { width, height } = img;
    
    // Scale image while maintaining aspect ratio
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
      
      let retryCount = 0;
      const maxRetries = 3;
      
      const attemptLoad = () => {
        img.onload = () => {
          if (img.complete && img.naturalHeight !== 0) {
            resolve(img);
          } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Retry ${retryCount} for image loading...`);
            setTimeout(attemptLoad, 1000);
          } else {
            reject(new Error('Image failed to load properly after retries'));
          }
        };
        
        img.onerror = (error) => {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Retry ${retryCount} after error...`);
            setTimeout(attemptLoad, 1000);
          } else {
            reject(new Error(`Failed to load image: ${error.message || 'Unknown error'}`));
          }
        };
        
        // Handle different Firebase storage domains
        const cleanUrl = imageUrl.replace('groupify-77202.appspot.com', 'groupify-77202.firebasestorage.app');
        const separator = cleanUrl.includes('?') ? '&' : '?';
        img.src = `${cleanUrl}${separator}t=${Date.now()}`;
      };
      
      attemptLoad();
    });
  }

  async getFaceDescriptor(imageUrl) {
    try {
      const img = await this.createImageElement(imageUrl);
      const processedImg = this.preprocessImage(img);
      
      // Progressive detection strategies from most to least accurate
      const detectionStrategies = [
        {
          name: 'MTCNN_STRICT',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.MtcnnOptions({ 
              minFaceSize: 100,
              scaleFactor: 0.709,
              scoreThresholds: [0.7, 0.8, 0.8]
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'MTCNN_BALANCED',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.MtcnnOptions({ 
              minFaceSize: 80,
              scaleFactor: 0.709,
              scoreThresholds: [0.6, 0.7, 0.7]
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'SSD_STRICT',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.6,
              maxResults: 1
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'SSD_BALANCED',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.4,
              maxResults: 1
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'TINY_HIGH',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.TinyFaceDetectorOptions({ 
              inputSize: 512,
              scoreThreshold: 0.5
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'TINY_FALLBACK',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.TinyFaceDetectorOptions({ 
              inputSize: 416,
              scoreThreshold: 0.3
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        }
      ];

      for (const strategy of detectionStrategies) {
        try {
          const detection = await strategy.detect();
          
          if (detection && detection.descriptor && detection.descriptor.length === 128) {
            const confidence = detection.detection?.score || detection.detection?._score || 0.5;
            
            return {
              descriptor: detection.descriptor,
              confidence: confidence,
              method: strategy.name,
              landmarks: detection.landmarks,
              box: detection.detection.box
            };
          }
        } catch (error) {
          console.warn(`⚠️ ${strategy.name} failed:`, error.message);
          continue;
        }
      }
      
      console.warn('❌ All detection methods failed for image');
      return null;
    } catch (error) {
      console.error('❌ Error in getFaceDescriptor:', error);
      return null;
    }
  }

  // Production-ready face comparison with robust thresholds
  compareFaceDescriptors(face1, face2) {
    if (!face1?.descriptor || !face2?.descriptor) {
      return { match: false, confidence: 0, reason: 'Missing descriptors' };
    }
    
    if (face1.descriptor.length !== 128 || face2.descriptor.length !== 128) {
      return { match: false, confidence: 0, reason: 'Invalid descriptor length' };
    }
    
    // Calculate multiple similarity metrics
    const euclideanDistance = faceapi.euclideanDistance(face1.descriptor, face2.descriptor);
    const cosineSimilarity = this.calculateCosineSimilarity(face1.descriptor, face2.descriptor);
    const similarity = Math.max(0, 1 - euclideanDistance);
    
    // Production thresholds based on research and real-world performance
    const baseThreshold = 0.68; // Conservative base threshold for production
    
    // Confidence-based threshold adjustment
    const avgConfidence = (face1.confidence + face2.confidence) / 2;
    const confidenceMultiplier = Math.min(1.2, Math.max(0.8, avgConfidence));
    
    // Method-based reliability scoring
    const methodReliability = this.getMethodReliability(face1.method, face2.method);
    
    // Dynamic threshold calculation
    const adjustedThreshold = baseThreshold * confidenceMultiplier * methodReliability;
    
    // Multi-criteria decision making
    const euclideanMatch = euclideanDistance < adjustedThreshold;
    const cosineMatch = cosineSimilarity > 0.35; // Stricter cosine threshold
    const combinedScore = (similarity * 0.6) + (cosineSimilarity * 0.4); // Weighted combination
    
    // Conservative matching criteria for production
    const isStrongMatch = euclideanMatch && cosineMatch && combinedScore > 0.5;
    const isWeakMatch = (euclideanMatch || (combinedScore > 0.45 && cosineSimilarity > 0.4)) && avgConfidence > 0.7;
    
    const finalMatch = isStrongMatch || isWeakMatch;
    const matchConfidence = finalMatch ? Math.min(0.95, combinedScore + (avgConfidence * 0.1)) : combinedScore;
    
    const result = {
      match: finalMatch,
      confidence: matchConfidence,
      euclideanDistance: euclideanDistance,
      cosineSimilarity: cosineSimilarity,
      similarity: similarity,
      combinedScore: combinedScore,
      threshold: adjustedThreshold,
      matchType: isStrongMatch ? 'strong' : (isWeakMatch ? 'weak' : 'none'),
      methods: `${face1.method}_vs_${face2.method}`,
      avgConfidence: avgConfidence
    };
    
    console.log(`👤 Production face comparison:`);
    console.log(`   Distance: ${euclideanDistance.toFixed(3)} (threshold: ${adjustedThreshold.toFixed(3)})`);
    console.log(`   Cosine: ${cosineSimilarity.toFixed(3)} | Combined: ${(combinedScore * 100).toFixed(1)}%`);
    console.log(`   Methods: ${face1.method} vs ${face2.method} (reliability: ${methodReliability.toFixed(2)})`);
    console.log(`   Confidences: ${face1.confidence.toFixed(3)} vs ${face2.confidence.toFixed(3)}`);
    console.log(`   Result: ${finalMatch ? '✅' : '❌'} (${result.matchType}, confidence: ${(matchConfidence * 100).toFixed(1)}%)`);
    
    return result;
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
      'MTCNN_STRICT': 1.0,
      'MTCNN_BALANCED': 0.95,
      'SSD_STRICT': 0.9,
      'SSD_BALANCED': 0.85,
      'TINY_HIGH': 0.8,
      'TINY_FALLBACK': 0.7
    };
    
    const score1 = reliabilityScores[method1] || 0.6;
    const score2 = reliabilityScores[method2] || 0.6;
    
    // Use geometric mean for combined reliability
    return Math.sqrt(score1 * score2);
  }

  async filterPhotosByFace(photos, userPhotoURL, onProgress = null) {
    if (!userPhotoURL || !photos.length) {
      console.log('❌ Missing user photo URL or photos array');
      return [];
    }

    try {
      await this.loadModels();
      
      console.log('🔍 Starting production face recognition...');
      console.log(`👤 User photo: ${userPhotoURL}`);
      console.log(`📸 Processing ${photos.length} photos`);
      
      const userFace = await this.getFaceDescriptor(userPhotoURL);
      if (!userFace) {
        console.warn('⚠️ Could not detect face in user photo');
        return [];
      }
      
      console.log(`✅ User face detected with ${userFace.method} (confidence: ${userFace.confidence.toFixed(3)})`);
      
      const matchingPhotos = [];
      const batchSize = 3;
      
      for (let i = 0; i < photos.length; i += batchSize) {
        const batch = photos.slice(i, i + batchSize);
        
        for (let j = 0; j < batch.length; j++) {
          const photo = batch[j];
          const globalIndex = i + j;
          
          if (onProgress) onProgress(globalIndex + 1, photos.length);
          
          try {
            console.log(`\n🔍 Processing ${globalIndex + 1}/${photos.length}: ${photo.fileName}`);
            
            const photoFace = await this.getFaceDescriptor(photo.downloadURL);
            
            if (photoFace) {
              const comparison = this.compareFaceDescriptors(userFace, photoFace);
              
              if (comparison.match) {
                console.log(`🎯 MATCH: ${photo.fileName} (${comparison.matchType}, ${(comparison.confidence * 100).toFixed(1)}%)`);
                matchingPhotos.push({
                  ...photo,
                  faceMatch: {
                    confidence: comparison.confidence,
                    matchType: comparison.matchType,
                    detectionMethod: photoFace.method,
                    similarity: comparison.similarity,
                    euclideanDistance: comparison.euclideanDistance,
                    cosineSimilarity: comparison.cosineSimilarity
                  }
                });
              }
            } else {
              console.log(`❌ No face detected in ${photo.fileName}`);
            }
          } catch (error) {
            console.error(`❌ Failed to process ${photo.fileName}:`, error);
          }
          
          // Prevent browser freezing
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Batch delay
        if (i + batchSize < photos.length) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      
      // Sort by match confidence (highest first)
      const sortedMatches = matchingPhotos.sort((a, b) => b.faceMatch.confidence - a.faceMatch.confidence);
      
      console.log(`\n🎯 PRODUCTION RESULTS:`);
      console.log(`   Photos processed: ${photos.length}`);
      console.log(`   Matches found: ${sortedMatches.length}`);
      console.log(`   Strong matches: ${sortedMatches.filter(p => p.faceMatch.matchType === 'strong').length}`);
      console.log(`   Weak matches: ${sortedMatches.filter(p => p.faceMatch.matchType === 'weak').length}`);
      
      if (sortedMatches.length > 0) {
        console.log(`   Best match: ${(sortedMatches[0].faceMatch.confidence * 100).toFixed(1)}%`);
        console.log(`   Average confidence: ${(sortedMatches.reduce((sum, p) => sum + p.faceMatch.confidence, 0) / sortedMatches.length * 100).toFixed(1)}%`);
      }
      
      return sortedMatches;
      
    } catch (error) {
      console.error('❌ Production face recognition failed:', error);
      return [];
    }
  }
}

// Create and export the production instance
const productionFaceRecognition = new ProductionFaceRecognition();

export const filterPhotosByFace = async (photos, userPhotoURL, onProgress = null) => {
  return await productionFaceRecognition.filterPhotosByFace(photos, userPhotoURL, onProgress);
};

export const compareFaces = async (referenceImageUrl, compareImageUrl) => {
  try {
    await productionFaceRecognition.loadModels();
    
    const referenceFace = await productionFaceRecognition.getFaceDescriptor(referenceImageUrl);
    if (!referenceFace) return { match: false, confidence: 0 };
    
    const compareFace = await productionFaceRecognition.getFaceDescriptor(compareImageUrl);
    if (!compareFace) return { match: false, confidence: 0 };
    
    return productionFaceRecognition.compareFaceDescriptors(referenceFace, compareFace);
  } catch (error) {
    console.error('❌ Face comparison failed:', error);
    return { match: false, confidence: 0 };
  }
};