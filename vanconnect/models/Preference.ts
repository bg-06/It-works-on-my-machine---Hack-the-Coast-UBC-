import mongoose from "mongoose";

const PreferenceSchema = new mongoose.Schema({
  userId: String,
  activity: String,        // study / cafe / walk / social / outdoor
  energyLevel: String,     // low / medium / high
  vibe: String,            // chill / focused / social / active
  indoorOutdoor: String,   // indoor / outdoor / both
  sustainability: String,  // low / medium / high
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Preference ||
  mongoose.model("Preference", PreferenceSchema);
