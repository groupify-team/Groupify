// types/trip.types.js
export const TripTypes = {
  Trip: {
    id: "string",
    name: "string",
    description: "string",
    location: "string",
    startDate: "string",
    endDate: "string",
    createdBy: "string",
    members: "array",
    admins: "array",
    photoCount: "number",
    createdAt: "string",
    updatedAt: "string",
  },

  TripStatus: {
    status: "string", // draft, upcoming, ongoing, completed
    color: "string", // gray, blue, purple, green
  },
};
