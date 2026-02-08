import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  name: String,
  type: String, // cafe / park / trail / study
  sustainabilityScore: Number,
  indoorOutdoor: String,
});

export default mongoose.models.Location ||
  mongoose.model("Location", LocationSchema);
