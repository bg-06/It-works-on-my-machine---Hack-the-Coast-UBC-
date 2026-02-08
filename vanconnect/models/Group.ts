import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  members: [String],              // userIds
  activity: String,
  vibe: String,
  availabilityDays: [String],
  availabilityTimes: [String],

  // Event info
  eventTime: Date,                // when activity happens
  locationId: String,             // reference to Location
  locationName: String,           // cached for fast list view
  locationImage: String,          // thumbnail for list view

  status: {
    type: String,
    enum: ["forming", "confirmed", "scheduled", "completed", "cancelled"],
    default: "forming",
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Group ||
  mongoose.model("Group", GroupSchema);
