import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  name: String,
  type: String, // cafe / park / trail / study / outdoor / social
  description: String,
  address: String,
  rating: Number,
  tags: [String],
  sustainabilityScore: Number,
  indoorOutdoor: String,
  images: [String],
});

export default mongoose.models.Location ||
  mongoose.model("Location", LocationSchema);
