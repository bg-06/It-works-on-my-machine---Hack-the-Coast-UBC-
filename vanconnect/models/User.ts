import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  password: String,
  onboarded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);
