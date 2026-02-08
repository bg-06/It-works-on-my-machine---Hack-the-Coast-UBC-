import mongoose from "mongoose";

const SwipeSchema = new mongoose.Schema({
  userId: String,
  locationId: String,
  liked: Boolean,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Swipe ||
  mongoose.model("Swipe", SwipeSchema);
