// services/faceRecognition.js - Complete Enhanced MediaPipe with face-api.js fallback
import * as faceapi from 'face-api.js';

class FaceProfileRecognition {
  constructor() {
    this.modelsLoaded = false;
    this.faceLandmarker = null;
    this.useMediaPipe = true;
    this.useFaceApi = false;
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
    this.userFaceProfiles = new Map();
  }

  // Load models with fallback strategy
  async loadModels() {
    if (this.modelsLoaded) return;
    
    try {
      console.log('🔄 Attempting to load face recognition models...');
      
      // Try MediaPipe first
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU" // Use CPU for better compatibility
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          numFaces: 3, // Detect multiple faces
          minFaceDetectionConfidence: 0.3, // Lower threshold
          minFacePresenceConfidence: 0.3,
          minTrackingConfidence: 0.3
        });
        
        this.useMediaPipe = true;
        this.useFaceApi = true; // Keep both available
        console.log('✅ MediaPipe models loaded successfully');
        
      } catch (mediaPipeError) {
        console.warn('⚠️ MediaPipe failed, using face-api.js only:', mediaPipeError);
        this.useMediaPipe = false;
        this.useFaceApi = true;
      }
      
      // Always load face-api.js as backup
      if (this.useFaceApi) {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(this.modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(this.modelUrl),
          faceapi.nets.faceRecognitionNet.loadFromUri(this.modelUrl),
          faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelUrl),
          faceapi.nets.mtcnn.loadFromUri(this.modelUrl),
        ]);
        
        console.log('✅ face-api.js models loaded successfully');
      }
      
      this.modelsLoaded = true;
      
    } catch (error) {
      console.error('❌ Failed to load any face recognition models:', error);
      throw new Error('Failed to initialize face recognition. Please refresh and try again.');
    }
  }

  // Enhanced image loading with comprehensive URL handling
  async createImageElement(imageUrl, timeout = 20000) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeoutId = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, timeout);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        if (img.complete && img.naturalHeight !== 0) {
          resolve(img);
        } else {
          reject(new Error('Image failed to load properly'));
        }
      };
      
      img.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load image: ${error.message || 'Network error'}`));
      };
      
      // Enhanced URL handling - Fix Firebase Storage URLs
      let processedUrl = imageUrl;
      
      // Convert appspot.com to firebasestorage.app if needed
      if (processedUrl.includes('appspot.com')) {
        processedUrl = processedUrl.replace('groupify-77202.appspot.com', 'groupify-77202.firebasestorage.app');
      }
      
      // Ensure alt=media is present
      if (!processedUrl.includes('alt=media')) {
        processedUrl += (processedUrl.includes('?') ? '&' : '?') + 'alt=media';
      }
      
      // Add cache buster
      processedUrl += (processedUrl.includes('?') ? '&' : '?') + `cb=${Date.now()}`;
      
      console.log(`🔄 Loading image from: ${processedUrl.substring(0, 100)}...`);
      img.src = processedUrl;
    });
  }

  // Enhanced face descriptor extraction with dual engine support
  async getFaceDescriptor(imageUrl) {
    const cached = this.getCachedDescriptor(imageUrl);
    if (cached) {
      return cached;
    }

    try {
      if (!this.modelsLoaded) {
        await this.loadModels();
      }

      // Load image with enhanced error handling
      let img;
      try {
        img = await this.createImageElement(imageUrl);
      } catch (imageError) {
        console.error(`❌ Failed to load image: ${imageError.message}`);
        
        // Try alternative URL strategies
        const alternatives = [
          imageUrl.replace('firebasestorage.app', 'appspot.com'),
          imageUrl.split('&token=')[0] + (imageUrl.includes('?') ? '&' : '?') + 'alt=media',
          imageUrl.replace(/[?&]cb=\d+/, '') // Remove cache buster
        ];
        
        for (const altUrl of alternatives) {
          try {
            img = await this.createImageElement(altUrl);
            console.log(`✅ Loaded with alternative URL`);
            break;
          } catch (altError) {
            console.warn(`⚠️ Alternative URL failed: ${altError.message}`);
          }
        }
        
        if (!img) {
          this.setCachedDescriptor(imageUrl, null);
          return null;
        }
      }

      let result = null;

      // Try MediaPipe first if available
      if (this.useMediaPipe && this.faceLandmarker) {
        try {
          result = await this.extractWithMediaPipe(img);
          if (result && result.quality > 0.3) { // Only accept decent quality
            result.method = 'MEDIAPIPE_LANDMARKS';
            console.log(`✅ MediaPipe detected face: quality ${(result.quality * 100).toFixed(1)}%`);
          } else {
            result = null; // Reject low quality
          }
        } catch (mpError) {
          console.warn('⚠️ MediaPipe extraction failed:', mpError.message);
        }
      }

      // Fallback to face-api.js if MediaPipe failed or not available
      if (!result && this.useFaceApi) {
        try {
          result = await this.extractWithFaceApi(img);
          if (result) {
            console.log(`✅ face-api.js detected face: method ${result.method}, confidence ${(result.confidence * 100).toFixed(1)}%`);
          }
        } catch (fapiError) {
          console.warn('⚠️ face-api.js extraction failed:', fapiError.message);
        }
      }

      this.setCachedDescriptor(imageUrl, result);
      return result;
      
    } catch (error) {
      if (error.message === 'CANCELLED') throw error;
      console.error('❌ Error in getFaceDescriptor:', error);
      this.setCachedDescriptor(imageUrl, null);
      return null;
    }
  }

  // MediaPipe extraction method with better quality scoring
  async extractWithMediaPipe(imageElement) {
    try {
      const results = await this.faceLandmarker.detect(imageElement);
      
      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        return null;
      }

      // Use the largest/most confident face
      const landmarks = results.faceLandmarks[0];
      
      // Create embedding from landmarks
      const embedding = this.createEmbeddingFromLandmarks(landmarks);
      const quality = this.calculateFaceQuality(landmarks, imageElement);
      
      // Boost quality scoring for MediaPipe
      const adjustedQuality = Math.min(quality * 1.5 + 0.2, 0.95);
      
      return {
        embedding: embedding,
        quality: adjustedQuality,
        landmarks: landmarks,
        confidence: adjustedQuality
      };
    } catch (error) {
      console.warn('MediaPipe detection failed:', error);
      return null;
    }
  }

  // face-api.js extraction method (enhanced)
  async extractWithFaceApi(imageElement) {
    try {
      const processedImg = this.preprocessImage(imageElement);
      
      // Enhanced detection strategies
      const detectionStrategies = [
        {
          name: 'MTCNN_HIGH_QUALITY',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.MtcnnOptions({ 
              minFaceSize: 120, // Larger minimum face size
              scaleFactor: 0.709,
              scoreThresholds: [0.6, 0.7, 0.7] // Higher quality thresholds
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'SSD_HIGH_QUALITY',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.6, // Higher confidence
              maxResults: 1
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'MTCNN_MODERATE',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.MtcnnOptions({ 
              minFaceSize: 80,
              scaleFactor: 0.709,
              scoreThresholds: [0.5, 0.6, 0.6]
            }))
            .withFaceLandmarks()
            .withFaceDescriptor()
        },
        {
          name: 'SSD_MODERATE',
          detect: () => faceapi
            .detectSingleFace(processedImg, new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.4,
              maxResults: 1
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
            
            // Enhanced quality boost for face-api.js
            const adjustedConfidence = Math.min(confidence * 1.3 + 0.15, 0.9);
            
            return {
              embedding: Array.from(detection.descriptor),
              quality: adjustedConfidence,
              method: strategy.name,
              landmarks: detection.landmarks,
              confidence: adjustedConfidence
            };
          }
        } catch (strategyError) {
          console.warn(`⚠️ ${strategy.name} failed:`, strategyError.message);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('face-api.js detection failed:', error);
      return null;
    }
  }

  // Enhanced MediaPipe embedding creation
  createEmbeddingFromLandmarks(landmarks) {
    // More comprehensive landmark selection
    const keyPointGroups = {
      jawline: Array.from({length: 17}, (_, i) => i), // 0-16
      rightBrow: Array.from({length: 5}, (_, i) => i + 17), // 17-21
      leftBrow: Array.from({length: 5}, (_, i) => i + 22), // 22-26
      nose: Array.from({length: 9}, (_, i) => i + 27), // 27-35
      rightEye: Array.from({length: 6}, (_, i) => i + 36), // 36-41
      leftEye: Array.from({length: 6}, (_, i) => i + 42), // 42-47
      mouth: Array.from({length: 20}, (_, i) => i + 48), // 48-67
      // Add some inner features
      innerMouth: [60, 61, 62, 63, 64, 65, 66, 67],
      noseTip: [30, 31, 32, 33, 34, 35],
      eyeCenters: [39, 42] // Eye centers
    };

    // Get all key landmarks
    const allKeyPoints = Object.values(keyPointGroups).flat();
    const uniqueKeyPoints = [...new Set(allKeyPoints)]; // Remove duplicates
    const keyLandmarks = uniqueKeyPoints.map(i => landmarks[Math.min(i, landmarks.length - 1)]);
    
    // Calculate face center and size for normalization
    const faceCenter = this.calculateFaceCenter(landmarks);
    const faceSize = this.calculateFaceSize(landmarks);
    
    // Normalize landmarks
    const normalizedPoints = keyLandmarks.map(point => ({
      x: (point.x - faceCenter.x) / faceSize,
      y: (point.y - faceCenter.y) / faceSize,
      z: point.z || 0
    }));

    // Add geometric ratios for better distinctiveness
    const eyeDistance = this.calculateDistance(landmarks[36] || landmarks[0], landmarks[45] || landmarks[0]);
    const noseLength = this.calculateDistance(landmarks[27] || landmarks[0], landmarks[33] || landmarks[0]);
    const mouthWidth = this.calculateDistance(landmarks[48] || landmarks[0], landmarks[54] || landmarks[0]);
    const faceWidth = this.calculateDistance(landmarks[0] || landmarks[0], landmarks[16] || landmarks[0]);
    
    const geometricFeatures = [
      eyeDistance / Math.max(faceSize, 0.001),
      noseLength / Math.max(faceSize, 0.001),
      mouthWidth / Math.max(faceSize, 0.001),
      faceWidth / Math.max(faceSize, 0.001),
      eyeDistance / Math.max(mouthWidth, 0.001),
      noseLength / Math.max(faceWidth, 0.001),
    ];

    // Create embedding vector
    const embedding = [
      ...normalizedPoints.flatMap(p => [p.x, p.y, p.z]),
      ...geometricFeatures
    ];
    
    // Ensure consistent embedding size (128 dimensions)
    const targetSize = 128;
    if (embedding.length > targetSize) {
      return embedding.slice(0, targetSize);
    } else if (embedding.length < targetSize) {
      const padding = new Array(targetSize - embedding.length).fill(0);
      return [...embedding, ...padding];
    }
    
    return embedding;
  }

  calculateDistance(point1, point2) {
    if (!point1 || !point2) return 0;
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateFaceCenter(landmarks) {
    if (!landmarks || landmarks.length === 0) return { x: 0, y: 0 };
    
    const sum = landmarks.reduce(
      (acc, point) => ({
        x: acc.x + (point.x || 0),
        y: acc.y + (point.y || 0)
      }),
      { x: 0, y: 0 }
    );
    
    return {
      x: sum.x / landmarks.length,
      y: sum.y / landmarks.length
    };
  }

  calculateFaceSize(landmarks) {
    if (!landmarks || landmarks.length === 0) return 1;
    
    const xs = landmarks.map(p => p.x || 0);
    const ys = landmarks.map(p => p.y || 0);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    return Math.max(Math.sqrt(width * width + height * height), 0.001);
  }

  calculateFaceQuality(landmarks, imageElement) {
    if (!landmarks || landmarks.length === 0) return 0.3;
    
    const faceSize = this.calculateFaceSize(landmarks);
    const imageSize = Math.sqrt(imageElement.width * imageElement.width + imageElement.height * imageElement.height);
    const relativeFaceSize = faceSize / Math.max(imageSize, 1);
    
    // Enhanced quality scoring
    const sizeScore = Math.min(relativeFaceSize * 4, 1);
    
    const faceCenter = this.calculateFaceCenter(landmarks);
    const edgeDistance = Math.min(
      Math.max(faceCenter.x, 0),
      Math.max(faceCenter.y, 0),
      Math.max(1 - faceCenter.x, 0),
      Math.max(1 - faceCenter.y, 0)
    );
    const edgeScore = Math.min(edgeDistance * 5, 1);
    
    // Face symmetry check (if enough landmarks)
    let symmetryScore = 0.8;
    if (landmarks.length > 40) {
      const leftEye = landmarks[36] || landmarks[0];
      const rightEye = landmarks[45] || landmarks[0];
      const eyeSymmetry = 1 - Math.abs((leftEye.y || 0) - (rightEye.y || 0)) * 10;
      symmetryScore = Math.max(0.3, Math.min(eyeSymmetry, 1));
    }
    
    // Landmark density
    const landmarkDensity = Math.min(landmarks.length / 468, 1);
    
    const finalQuality = (sizeScore * 0.4 + edgeScore * 0.3 + symmetryScore * 0.2 + landmarkDensity * 0.1);
    return Math.max(0.3, Math.min(finalQuality, 1));
  }

  // Enhanced face profile creation
  async createFaceProfile(userId, faceImages, onProgress = null) {
    console.log(`🔍 Creating enhanced face profile for user ${userId} with ${faceImages.length} images`);
    
    try {
      this.deleteFaceProfile(userId);
      await this.loadModels();
      
      const faceEmbeddings = [];
      const metadata = {
        createdAt: Date.now(),
        imageCount: faceImages.length,
        qualityScores: [],
        methods: [],
        engine: this.useMediaPipe ? (this.useFaceApi ? 'MediaPipe+face-api.js' : 'MediaPipe') : 'face-api.js'
      };

      const imageUrls = faceImages.map(img => img.url || img);
      console.log(`🔄 Processing ${imageUrls.length} images with ${metadata.engine}...`);

      for (let i = 0; i < imageUrls.length; i++) {
        if (this.shouldCancel) throw new Error('CANCELLED');

        if (onProgress) {
          onProgress({
            type: 'processing_profile',
            current: i + 1,
            total: imageUrls.length,
            phase: `Analyzing face image ${i + 1}/${imageUrls.length} with ${metadata.engine}...`
          });
        }

        const imageUrl = imageUrls[i];
        console.log(`📸 Processing image ${i + 1}: ${imageUrl.substring(imageUrl.lastIndexOf('/') + 1, imageUrl.indexOf('?'))}`);
        
        const faceData = await this.getFaceDescriptor(imageUrl);
        
        if (faceData && faceData.embedding) {
          const embeddingWithUrl = {
            ...faceData,
            originalImageUrl: imageUrl,
            addedAt: Date.now()
          };
          
          faceEmbeddings.push(embeddingWithUrl);
          metadata.qualityScores.push(faceData.quality);
          metadata.methods.push(faceData.method);
          console.log(`✅ Face ${i + 1}: ${faceData.method} (${(faceData.quality * 100).toFixed(1)}%)`);
        } else {
          console.warn(`⚠️ Could not detect face in image ${i + 1}`);
        }

        await new Promise(resolve => setTimeout(resolve, 100)); // Longer delay for stability
      }

      if (faceEmbeddings.length === 0) {
        throw new Error('No faces detected in any of the provided images. Please try with clearer, well-lit photos where your face is clearly visible and centered.');
      }

      // Calculate average embedding
      const avgEmbedding = this.calculateAverageEmbedding(faceEmbeddings);
      
      const profile = {
        descriptors: faceEmbeddings,
        averageEmbedding: avgEmbedding,
        metadata: {
          ...metadata,
          avgQuality: metadata.qualityScores.reduce((a, b) => a + b, 0) / metadata.qualityScores.length,
          successRate: (faceEmbeddings.length / imageUrls.length * 100).toFixed(1)
        }
      };

      this.userFaceProfiles.set(userId, profile);
      
      if (onProgress) {
        onProgress({
          type: 'profile_completed',
          phase: `Enhanced face profile created successfully with ${metadata.engine}!`,
          descriptorsCreated: faceEmbeddings.length,
          avgQuality: profile.metadata.avgQuality,
          successRate: profile.metadata.successRate
        });
      }

      console.log(`🎯 Enhanced face profile created for ${userId}:`);
      console.log(`   Engine: ${metadata.engine}`);
      console.log(`   Embeddings: ${faceEmbeddings.length}/${imageUrls.length}`);
      console.log(`   Avg quality: ${(profile.metadata.avgQuality * 100).toFixed(1)}%`);
      console.log(`   Success rate: ${profile.metadata.successRate}%`);

      return profile;
      
    } catch (error) {
      this.deleteFaceProfile(userId);
      console.error('❌ Failed to create enhanced face profile:', error);
      throw error;
    }
  }

  // Enhanced average embedding calculation
  calculateAverageEmbedding(embeddings) {
    if (embeddings.length === 0) return null;
    if (embeddings.length === 1) return embeddings[0];

    const embeddingLength = embeddings[0].embedding.length;
    const avgEmbedding = new Array(embeddingLength).fill(0);
    
    let totalWeight = 0;
    
    embeddings.forEach(faceData => {
      const weight = Math.max(faceData.quality, 0.1); // Minimum weight
      totalWeight += weight;
      
      for (let i = 0; i < embeddingLength; i++) {
        avgEmbedding[i] += (faceData.embedding[i] || 0) * weight;
      }
    });
    
    for (let i = 0; i < embeddingLength; i++) {
      avgEmbedding[i] /= Math.max(totalWeight, 0.1);
    }

    return {
      embedding: avgEmbedding,
      quality: embeddings.reduce((sum, d) => sum + d.quality, 0) / embeddings.length,
      method: 'ENHANCED_AVERAGE_PROFILE',
      isProfile: true,
      originalImageUrl: 'averaged_profile',
      addedAt: Date.now()
    };
  }

  // Enhanced similarity calculation
  calculateCosineSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    const minLength = Math.min(embedding1.length, embedding2.length);
    
    for (let i = 0; i < minLength; i++) {
      const val1 = embedding1[i] || 0;
      const val2 = embedding2[i] || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : Math.max(0, Math.min(1, dotProduct / magnitude));
  }

  calculateEuclideanDistance(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 1;
    
    let sum = 0;
    const minLength = Math.min(embedding1.length, embedding2.length);
    
    for (let i = 0; i < minLength; i++) {
      const diff = (embedding1[i] || 0) - (embedding2[i] || 0);
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  // Enhanced comparison with better thresholds
  compareSingleEmbedding(userFace, photoFace) {
    const similarity = this.calculateCosineSimilarity(userFace.embedding, photoFace.embedding);
    const distance = this.calculateEuclideanDistance(userFace.embedding, photoFace.embedding);
    
    const avgQuality = ((userFace.quality || 0.5) + (photoFace.quality || 0.5)) / 2;
    
    // Adaptive thresholds based on detection engine and quality
    let baseThreshold = 0.65; // More conservative base
    
    if (this.useMediaPipe && userFace.method?.includes('MEDIAPIPE')) {
      baseThreshold = 0.70; // Higher threshold for MediaPipe
    }
    
    const qualityMultiplier = avgQuality > 0.8 ? 1.1 : 
                             avgQuality > 0.6 ? 1.05 : 
                             avgQuality > 0.4 ? 1.0 : 0.95;
    
    const adjustedThreshold = baseThreshold * qualityMultiplier;
    
    const similarityMatch = similarity > adjustedThreshold;
    const distanceMatch = distance < (2.0 - adjustedThreshold);
    
    const isStrongMatch = similarityMatch && distanceMatch && similarity > (adjustedThreshold + 0.05);
    const isWeakMatch = similarityMatch && distanceMatch && similarity > (adjustedThreshold - 0.05);
    
    return {
      distance,
      similarity,
      threshold: adjustedThreshold,
      isStrongMatch,
      isWeakMatch,
      avgQuality,
      qualityTier: avgQuality > 0.7 ? 'high' : (avgQuality > 0.5 ? 'medium' : 'low')
    };
  }

  // Enhanced profile comparison
  compareWithFaceProfile(userProfile, photoFace, userPhotoURL = '', tripPhotoURL = '') {
    if (!userProfile || !photoFace?.embedding) {
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
    
    // Compare with average embedding first (most reliable)
    if (userProfile.averageEmbedding) {
      const avgResult = this.compareSingleEmbedding(userProfile.averageEmbedding, photoFace);
      avgResult.comparisonType = 'average';
      results.push(avgResult);
    }

    // Compare with individual embeddings
    userProfile.descriptors.forEach((userFace, index) => {
      const result = this.compareSingleEmbedding(userFace, photoFace);
      result.comparisonType = `individual_${index}`;
      results.push(result);
    });

    // Find best match
    const bestMatch = results.reduce((best, current) => 
      current.similarity > best.similarity ? current : best
    );

    // Enhanced scoring system
    const avgScore = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const maxScore = Math.max(...results.map(r => r.similarity));
    const minDistance = Math.min(...results.map(r => r.distance));
    
    // Consensus-based matching with enhanced thresholds
    const strongMatches = results.filter(r => r.isStrongMatch).length;
    const weakMatches = results.filter(r => r.isWeakMatch).length;
    const totalComparisons = results.length;
    
    // Calculate agreement ratios
    const strongRatio = strongMatches / totalComparisons;
    const weakRatio = weakMatches / totalComparisons;
    const overallRatio = (strongMatches + weakMatches) / totalComparisons;
    
    // Enhanced matching logic
    let isStrongMatch = false;
    let isWeakMatch = false;
    
    // Strong match pathways (more conservative)
    if (
      (strongRatio >= 0.5 && maxScore > 0.80 && avgScore > 0.70) ||
      (strongMatches >= 2 && maxScore > 0.85) ||
      (maxScore > 0.90 && avgScore > 0.75)
    ) {
      isStrongMatch = true;
    }
    
    // Weak match pathways (moderate confidence)
    else if (
      (overallRatio >= 0.5 && maxScore > 0.75 && avgScore > 0.65) ||
      (weakMatches >= 2 && maxScore > 0.78 && avgScore > 0.68) ||
      (strongMatches >= 1 && maxScore > 0.80 && avgScore > 0.65) ||
      (maxScore > 0.82 && avgScore > 0.70)
    ) {
      isWeakMatch = true;
    }
    
    const finalMatch = isStrongMatch || isWeakMatch;
    
    // Enhanced confidence calculation
    let finalConfidence = avgScore;
    if (finalMatch) {
      const qualityBoost = Math.min(0.1, (userProfile.metadata.avgQuality + photoFace.quality) / 2 * 0.15);
      const consensusBoost = Math.min(0.05, overallRatio * 0.1);
      finalConfidence = Math.min(0.95, (maxScore + avgScore) / 2 + qualityBoost + consensusBoost);
    }
    
    const result = {
      match: finalMatch,
      confidence: finalConfidence,
      matchType: isStrongMatch ? 'strong' : (isWeakMatch ? 'weak' : 'none'),
      
      // Detailed metrics
      distance: minDistance,
      similarity: maxScore,
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
      qualityScore: (maxScore + avgScore + ((userProfile.metadata.avgQuality + photoFace.quality) / 2)) / 3,
      
      // Methods
      methods: `ENHANCED_PROFILE_${userProfile.descriptors.length}_vs_${photoFace.method}`,
      reason: `${strongMatches}/${totalComparisons} strong, ${weakMatches}/${totalComparisons} weak matches`
    };

    // Cache the result
    if (userPhotoURL && tripPhotoURL) {
      this.setCachedComparison(userPhotoURL, tripPhotoURL, result);
    }
    
    console.log(`👤 ENHANCED PROFILE face comparison:`);
    console.log(`   Profile: ${userProfile.descriptors.length} references`);
    console.log(`   Best match: ${maxScore.toFixed(3)} | Avg: ${avgScore.toFixed(3)}`);
    console.log(`   Consensus: ${strongMatches}/${totalComparisons} strong, ${weakMatches}/${totalComparisons} weak`);
    console.log(`   Quality: ${(result.qualityScore * 100).toFixed(1)}% | Ratios: S${(strongRatio*100).toFixed(0)}% W${(overallRatio*100).toFixed(0)}%`);
    console.log(`   Result: ${finalMatch ? '✅' : '❌'} (${result.matchType}, confidence: ${(finalConfidence * 100).toFixed(1)}%)`);
    
    return result;
  }

  // Enhanced batch processing
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
            phase: 'Analyzing faces with enhanced profile...'
          });
        }
        
        const photoFace = await this.getFaceDescriptor(photo.downloadURL);
        
        if (photoFace) {
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
                qualityScore: comparison.qualityScore,
                similarity: comparison.similarity
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
        
        await new Promise(resolve => setTimeout(resolve, 50)); // Longer delay for stability
        
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

  // Enhanced photo filtering
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
      
      console.log('🔍 Starting ENHANCED PROFILE-BASED face recognition...');
      console.log(`👤 Using enhanced profile with ${userProfile.descriptors.length} reference faces`);
      console.log(`🔧 Engine: ${userProfile.metadata.engine || 'Unknown'}`);
      console.log('📊 Cache stats before processing:', this.getCacheStats());
      this.totalPhotos = photos.length;
      
      if (onProgress) {
        onProgress({
          type: 'initializing',
          phase: `Using enhanced face profile with ${userProfile.descriptors.length} references...`,
          current: 0,
          total: photos.length,
          profileInfo: {
            references: userProfile.descriptors.length,
            avgQuality: userProfile.metadata.avgQuality,
            successRate: userProfile.metadata.successRate,
            engine: userProfile.metadata.engine
          }
        });
      }
      
      if (this.shouldCancel) throw new Error('CANCELLED');
      
      // Optimized batch processing
      const batchSize = 2; // Smaller batches for better stability
      const batches = [];
      
      for (let i = 0; i < photos.length; i += batchSize) {
        batches.push(photos.slice(i, i + batchSize));
      }
      
      this.totalBatches = batches.length;
      const allMatches = [];
      
      if (onProgress) {
        onProgress({
          type: 'batch_starting',
          phase: 'Processing photos with enhanced face profile...',
          totalBatches: this.totalBatches,
          batchSize: batchSize
        });
      }
      
      // Process batches
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (this.shouldCancel) throw new Error('CANCELLED');
        
        this.currentBatch = batchIndex;
        
        console.log(`📦 Processing enhanced batch ${batchIndex + 1}/${batches.length}`);
        
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
          await new Promise(resolve => setTimeout(resolve, 150)); // Longer delay between batches
        }
      }
      
      // Sort by confidence
      const sortedMatches = allMatches.sort((a, b) => b.faceMatch.confidence - a.faceMatch.confidence);
      
      const processingTime = Math.round((Date.now() - startTime) / 1000);
      const finalCacheStats = this.getCacheStats();
      
      if (onProgress) {
        onProgress({
          type: 'completed',
          phase: 'Enhanced profile-based face recognition completed!',
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
            avgQuality: (userProfile.metadata.avgQuality * 100).toFixed(1),
            engine: userProfile.metadata.engine
          }
        });
      }
      
      console.log(`\n🎯 ENHANCED PROFILE-BASED RESULTS:`);
      console.log(`   Photos processed: ${photos.length} in ${processingTime}s`);
      console.log(`   Engine: ${userProfile.metadata.engine}`);
      console.log(`   Profile references: ${userProfile.descriptors.length}`);
      console.log(`   Matches found: ${sortedMatches.length}`);
      console.log(`   Strong matches: ${sortedMatches.filter(p => p.faceMatch.matchType === 'strong').length}`);
      console.log(`   Weak matches: ${sortedMatches.filter(p => p.faceMatch.matchType === 'weak').length}`);
      console.log(`   📊 Cache performance: ${finalCacheStats.hitRate} hit rate`);
      
      return sortedMatches;
      
    } catch (error) {
      this.isProcessing = false;
      
      if (error.message === 'CANCELLED') {
        console.log('🛑 Enhanced face recognition was cancelled by user');
        if (onProgress) {
          onProgress({
            type: 'cancelled',
            phase: 'Face recognition cancelled'
          });
        }
        return [];
      }
      
      console.error('❌ Enhanced profile-based face recognition failed:', error);
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

  // Image preprocessing
  preprocessImage(img) {
    const { canvas, ctx } = this.getCanvas();
    
    const maxSize = 720; // Larger size for better quality
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
    
    // Enhanced preprocessing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    
    // Apply enhanced contrast and brightness
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Enhanced contrast adjustment
      data[i] = Math.min(255, Math.max(0, data[i] * 1.15));     // Red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * 1.15)); // Green
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 1.15)); // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
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

  // Utility methods
  getFaceProfile(userId) {
    return this.userFaceProfiles.get(userId);
  }

  hasFaceProfile(userId) {
    return this.userFaceProfiles.has(userId);
  }

  deleteFaceProfile(userId) {
    const deleted = this.userFaceProfiles.delete(userId);
    
    const keysToDelete = [];
    for (const [key, value] of this.faceDescriptorCache.entries()) {
      if (key.includes(userId) || (value && value.userId === userId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.faceDescriptorCache.delete(key));
    
    const comparisonKeysToDelete = [];
    for (const [key, value] of this.comparisonCache.entries()) {
      if (key.includes(userId)) {
        comparisonKeysToDelete.push(key);
      }
    }
    comparisonKeysToDelete.forEach(key => this.comparisonCache.delete(key));
    
    if (deleted) {
      console.log(`🗑️ Deleted face profile and cleared cache for user ${userId}`);
    }
    return deleted;
  }

  // Cache management
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
    return this.faceDescriptorCache.get(cleanURL);
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
      memoryUsage: `${this.faceDescriptorCache.size} descriptors`,
      profilesLoaded: this.userFaceProfiles.size
    };
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

  getStatus() {
    return {
      isProcessing: this.isProcessing,
      shouldCancel: this.shouldCancel,
      currentBatch: this.currentBatch,
      totalBatches: this.totalBatches,
      cacheStats: this.getCacheStats(),
      profilesLoaded: this.userFaceProfiles.size,
      engine: this.useMediaPipe ? (this.useFaceApi ? 'MediaPipe+face-api.js' : 'MediaPipe') : 'face-api.js'
    };
  }

  // Profile management methods (add these from previous implementation)
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
        
        if (descriptor && descriptor.embedding) {
          const descriptorWithUrl = {
            ...descriptor,
            originalImageUrl: imageUrl,
            addedAt: Date.now()
          };
          
          newDescriptors.push(descriptorWithUrl);
          newQualityScores.push(descriptor.quality);
          newMethods.push(descriptor.method);
          console.log(`✅ New photo ${i + 1}: ${descriptor.method} (${(descriptor.quality * 100).toFixed(1)}%)`);
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

      // Recalculate average embedding
      const avgEmbedding = this.calculateAverageEmbedding(updatedDescriptors);
      
      const updatedProfile = {
        ...existingProfile,
        descriptors: updatedDescriptors,
        averageEmbedding: avgEmbedding,
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

  // Profile photo management
  removePhotosFromProfile(userId, imageUrlsToRemove) {
    console.log(`🗑️ Removing ${imageUrlsToRemove.length} photos from profile for user ${userId}`);
    
    const existingProfile = this.getFaceProfile(userId);
    if (!existingProfile) {
      throw new Error('No face profile found for user');
    }

    const remainingDescriptors = existingProfile.descriptors.filter(descriptor => 
      !imageUrlsToRemove.includes(descriptor.originalImageUrl)
    );

    if (remainingDescriptors.length === 0) {
      throw new Error('Cannot remove all photos from profile. Delete the profile instead.');
    }

    const remainingQualityScores = remainingDescriptors.map(d => d.quality);
    const remainingMethods = remainingDescriptors.map(d => d.method);

    const avgEmbedding = this.calculateAverageEmbedding(remainingDescriptors);
    
    const updatedProfile = {
      ...existingProfile,
      descriptors: remainingDescriptors,
      averageEmbedding: avgEmbedding,
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

  getProfilePhotos(userId) {
    const profile = this.getFaceProfile(userId);
    if (!profile) return [];

    return profile.descriptors.map((descriptor, index) => ({
      id: `profile_photo_${index}`,
      url: descriptor.originalImageUrl,
      confidence: descriptor.quality,
      method: descriptor.method,
      addedAt: descriptor.addedAt || profile.metadata.createdAt,
      qualityTier: descriptor.quality > 0.8 ? 'high' : 
                   descriptor.quality > 0.6 ? 'medium' : 'low'
    }));
  }

  optimizeProfile(userId, minQuality = 0.5) {
    console.log(`🔧 Optimizing profile for user ${userId} (min quality: ${minQuality})`);
    
    const profile = this.getFaceProfile(userId);
    if (!profile) {
      throw new Error('No face profile found for user');
    }

    const lowQualityUrls = profile.descriptors
      .filter(descriptor => descriptor.quality < minQuality)
      .map(descriptor => descriptor.originalImageUrl)
      .filter(url => url);

    if (lowQualityUrls.length === 0) {
      console.log('✅ Profile already optimized - no low quality photos found');
      return profile;
    }

    if (profile.descriptors.length - lowQualityUrls.length < 1) {
      throw new Error('Cannot optimize - would remove all photos. Lower the quality threshold.');
    }

    return this.removePhotosFromProfile(userId, lowQualityUrls);
  }
}

// Export the same API
const faceProfileRecognition = new FaceProfileRecognition();

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

export const addPhotosToProfile = async (userId, newImages, onProgress = null) => {
  return await faceProfileRecognition.addPhotosToProfile(userId, newImages, onProgress);
};

export const removePhotosFromProfile = (userId, imageUrlsToRemove) => {
  return faceProfileRecognition.removePhotosFromProfile(userId, imageUrlsToRemove);
};

export const getProfilePhotos = (userId) => {
  return faceProfileRecognition.getProfilePhotos(userId);
};

export const optimizeProfile = (userId, minQuality = 0.5) => {
  return faceProfileRecognition.optimizeProfile(userId, minQuality);
};

// Legacy compatibility
export const filterPhotosByFace = async (photos, userPhotoURL, onProgress = null) => {
  console.log('⚠️ Using legacy single-photo recognition.');
  
  const userFace = await faceProfileRecognition.getFaceDescriptor(userPhotoURL);
  if (!userFace) {
    throw new Error('Could not detect face in user photo');
  }

  const tempProfile = {
    descriptors: [userFace],
    averageEmbedding: userFace,
    metadata: { avgQuality: userFace.quality }
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

export const resetFaceRecognition = () => {
  faceProfileRecognition.reset();
};

export const getFaceRecognitionStatus = () => {
  return faceProfileRecognition.getStatus();
};

export const clearFaceRecognitionCache = () => {
  faceProfileRecognition.clearCache();
};

export const getFaceRecognitionCacheStats = () => {
  return faceProfileRecognition.getCacheStats();
};