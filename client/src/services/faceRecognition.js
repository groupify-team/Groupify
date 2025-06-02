import * as faceapi from 'face-api.js';

// Initialize face-api.js models
let modelsLoaded = false;

const loadModels = async () => {
  if (modelsLoaded) return;
  
  try {
    console.log('🔄 Loading face recognition models...');
    
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
    ]);
    
    modelsLoaded = true;
    console.log('✅ Face recognition models loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load face recognition models:', error);
    throw error;
  }
};

const createImageElement = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    
    const separator = imageUrl.includes('?') ? '&' : '?';
    img.src = `${imageUrl}${separator}t=${Date.now()}`;
  });
};

const getFaceDescriptor = async (imageUrl) => {
  try {
    const img = await createImageElement(imageUrl);
    
    let detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ 
        inputSize: 416,
        scoreThreshold: 0.3
      }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (!detection) {
      detection = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.3
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    }
    
    return detection ? detection.descriptor : null;
  } catch (error) {
    console.error('❌ Error extracting face descriptor:', error);
    return null;
  }
};

const compareFaceDescriptors = (descriptor1, descriptor2, threshold = 0.5) => {
  if (!descriptor1 || !descriptor2) return false;
  
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  const similarity = Math.max(0, 1 - distance);
  
  console.log(`👤 Face similarity: ${(similarity * 100).toFixed(2)}%`);
  
  return distance < threshold;
};

export const compareFaces = async (referenceImageUrl, compareImageUrl) => {
  try {
    await loadModels();
    
    const referenceDescriptor = await getFaceDescriptor(referenceImageUrl);
    if (!referenceDescriptor) return false;
    
    const compareDescriptor = await getFaceDescriptor(compareImageUrl);
    if (!compareDescriptor) return false;
    
    return compareFaceDescriptors(referenceDescriptor, compareDescriptor);
  } catch (error) {
    console.error('❌ Face comparison failed:', error);
    return false;
  }
};

export const filterPhotosByFace = async (photos, userPhotoURL, onProgress = null) => {
  if (!userPhotoURL || !photos.length) return [];

  try {
    await loadModels();
    
    const userDescriptor = await getFaceDescriptor(userPhotoURL);
    if (!userDescriptor) {
      console.warn('⚠️ Could not detect face in user photo');
      return [];
    }
    
    const matchingPhotos = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      if (onProgress) onProgress(i + 1, photos.length);
      
      try {
        const photoDescriptor = await getFaceDescriptor(photo.downloadURL);
        
        if (photoDescriptor && compareFaceDescriptors(userDescriptor, photoDescriptor)) {
          matchingPhotos.push(photo);
        }
      } catch (error) {
        console.error(`❌ Failed to process photo ${photo.fileName}:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return matchingPhotos;
  } catch (error) {
    console.error('❌ Face filtering failed:', error);
    return [];
  }
};