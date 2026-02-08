import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
