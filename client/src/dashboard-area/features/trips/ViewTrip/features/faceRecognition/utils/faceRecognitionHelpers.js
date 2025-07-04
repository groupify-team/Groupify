// /**
//  * Face recognition processing utilities and formatting helpers
//  * Handles confidence calculations, progress tracking, and recognition statistics
//  */

// ********* check if needed !! *********

// /**

// export const formatTimeRemaining = (seconds) => {
//   if (!seconds || seconds < 0) return "";

//   if (seconds < 60) {
//     return `~${seconds}s remaining`;
//   } else {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `~${minutes}m ${remainingSeconds}s remaining`;
//   }
// };

// /**
//  * Calculate progress percentage
//  */
// export const getProgressPercentage = (
//   current,
//   total
// ) => {
//   if (total === 0) return 0;
//   return Math.round((current / total) * 100);
// };

// /**
//  * Format face match confidence as percentage
//  */
// export const formatConfidence = (confidence) => {
//   return `${(confidence * 100).toFixed(0)}%`;
// };

// /**
//  * Get confidence level description
//  */
// export const getConfidenceLevel = (
//   confidence
// ) "high" | "medium" | "low" => {
//   if (confidence >= 0.8) return "high";
//   if (confidence >= 0.6) return "medium";
//   return "low";
// };

// /**
//  * Get match type based on confidence
//  */
// export const getMatchType = (confidence): "strong" | "weak" => {
//   return confidence >= 0.7 ? "strong" : "weak";
// };

// /**
//  * Format processing phase message
//  */
// export const formatProcessingPhase = (
//   phase,
//   current,
//   total,
// ):  => {
//   if (current !== undefined && total !== undefined) {
//     return `${phase} (${current}/${total})`;
//   }
//   return phase;
// };

// /**
//  * Calculate estimated time remaining based on processing speed
//  */
// export const calculateEstimatedTime = (
//   processed: number,
//   total: number,
//   startTime: number
// ): number => {
//   if (processed === 0) return 0;

//   const elapsed = Date.now() - startTime;
//   const averageTimePerPhoto = elapsed / processed;
//   const remaining = total - processed;

//   return Math.round((remaining * averageTimePerPhoto) / 1000);
// };

// /**
//  * Group photos by confidence level
//  */
// export const groupPhotosByConfidence = (
//   photos: any[]
// ): {
//   strong: any[],
//   weak: any[],
// } => {
//   return photos.reduce(
//     (acc, photo) => {
//       if (photo.faceMatch?.matchType === "strong") {
//         acc.strong.push(photo);
//       } else {
//         acc.weak.push(photo);
//       }
//       return acc;
//     },
//     { strong: [], weak: [] }
//   );
// };

// /**
//  * Calculate face recognition statistics
//  */
// export const calculateFaceRecognitionStats = (
//   matches: any[]
// ): {
//   totalMatches: number,
//   strongMatches: number,
//   weakMatches: number,
//   averageConfidence: number,
//   highestConfidence: number,
//   lowestConfidence: number,
// } => {
//   if (matches.length === 0) {
//     return {
//       totalMatches: 0,
//       strongMatches: 0,
//       weakMatches: 0,
//       averageConfidence: 0,
//       highestConfidence: 0,
//       lowestConfidence: 0,
//     };
//   }

//   const confidences = matches.map((m) => m.faceMatch?.confidence || 0);
//   const strongMatches = matches.filter(
//     (m) => m.faceMatch?.matchType === "strong"
//   ).length;
//   const weakMatches = matches.length - strongMatches;

//   return {
//     totalMatches: matches.length,
//     strongMatches,
//     weakMatches,
//     averageConfidence:
//       confidences.reduce((a, b) => a + b, 0) / confidences.length,
//     highestConfidence: Math.max(...confidences),
//     lowestConfidence: Math.min(...confidences),
//   };
// };

// /**
//  * Format processing speed
//  */
// export const formatProcessingSpeed = (
//   photosProcessed: number,
//   timeElapsed: number
// ): string => {
//   if (timeElapsed === 0) return "0 photos/sec";

//   const photosPerSecond = photosProcessed / (timeElapsed / 1000);

//   if (photosPerSecond < 1) {
//     const secondsPerPhoto = timeElapsed / 1000 / photosProcessed;
//     return `${secondsPerPhoto.toFixed(1)}s per photo`;
//   }

//   return `${photosPerSecond.toFixed(1)} photos/sec`;
// };

// /**
//  * Get status message based on processing state
//  */
// export const getProcessingStatusMessage = (
//   phase: string,
//   progress: number,
//   total: number,
//   matches: number
// ): string => {
//   switch (phase.toLowerCase()) {
//     case "initializing":
//       return "Starting face recognition...";
//     case "loading":
//       return "Loading face profile...";
//     case "processing":
//       return `Analyzing photos... ${progress}/${total}`;
//     case "completed":
//       return `Complete! Found ${matches} matching photos`;
//     case "cancelled":
//       return "Processing cancelled";
//     case "error":
//       return "An error occurred during processing";
//     default:
//       return phase;
//   }
// };

// /**
//  * Validate face recognition requirements
//  */
// export const validateFaceRecognitionRequirements = (
//   hasProfile: boolean,
//   photoCount: number,
//   isMember: boolean
// ): {
//   isValid: boolean,
//   message: string,
// } => {
//   if (!isMember) {
//     return {
//       isValid: false,
//       message: "Face filtering is only available for registered trip members.",
//     };
//   }

//   if (!hasProfile) {
//     return {
//       isValid: false,
//       message:
//         "No face profile found. Please create one in your Dashboard first.",
//     };
//   }

//   if (photoCount === 0) {
//     return {
//       isValid: false,
//       message: "No photos available to search through.",
//     };
//   }

//   return {
//     isValid: true,
//     message: "Ready to find your photos!",
//   };
// };

// /**
//  * Sort photos by confidence score
//  */
// export const sortPhotosByConfidence = (
//   photos: any[],
//   order: "asc" | "desc" = "desc"
// ): any[] => {
//   return [...photos].sort((a, b) => {
//     const confA = a.faceMatch?.confidence || 0;
//     const confB = b.faceMatch?.confidence || 0;
//     return order === "desc" ? confB - confA : confA - confB;
//   });
// };

// /**
//  * Filter photos by confidence threshold
//  */
// export const filterPhotosByConfidence = (
//   photos: any[],
//   minConfidence: number
// ): any[] => {
//   return photos.filter((photo) => {
//     const confidence = photo.faceMatch?.confidence || 0;
//     return confidence >= minConfidence;
//   });

//   return photos;
// };
// */
