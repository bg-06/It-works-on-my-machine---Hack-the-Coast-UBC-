import mongoose from "mongoose";

const PreferenceSchema = new mongoose.Schema({
  userId: String,
  activity: String,        // primary activity (back-compat)
  activities: { type: [String], default: [] },    // list of activity goals
  energyLevel: String,     // low / medium / high
  vibe: String,            // chill / focused / social / active
  socialStyle: { type: String, default: 'casual' },     // quiet / casual / social
  indoorOutdoor: String,   // indoor / outdoor / both
  sustainability: String,  // low / medium / high
  availabilityDays: { type: [String], default: [] },
  availabilityTimes: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Preference ||
  mongoose.model("Preference", PreferenceSchema);
