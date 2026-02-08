import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  members: [String],          // userIds
  activity: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Group ||
  mongoose.model("Group", GroupSchema);
