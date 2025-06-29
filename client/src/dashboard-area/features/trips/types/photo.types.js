// types/photo.types.js
export const PhotoTypes = {
  Photo: {
    id: "string",
    tripId: "string",
    fileName: "string",
    originalName: "string",
    downloadURL: "string",
    uploadedBy: "string",
    uploadedAt: "string",
    faceMatch: "object", // Optional face recognition data
  },

  FaceMatch: {
    confidence: "number",
    matchType: "string", // strong, weak
    consensus: "number",
    userId: "string",
  },

  PhotoStats: {
    count: "number",
    remaining: "number",
    status: "string", // normal, warning, full
  },
};
