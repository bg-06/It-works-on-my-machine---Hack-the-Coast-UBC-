import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  groupId: String,
  senderId: String,
  text: String,
  isAI: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
