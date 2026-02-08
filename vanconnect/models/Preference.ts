import mongoose from "mongoose";

const PreferenceSchema = new mongoose.Schema({
  userId: String,

  // New onboarding fields
  goal: String,              // study / sustainable / outdoors
  transport: String,         // transit / biking / walking / carpool
  energy: String,            // chill / balanced / active
  interests: [String],       // e.g. ["Coffee","Hiking","Coding"]

  // Availability
  availabilityDays: [String],   // e.g. ["Monday","Wednesday","Friday"]
  availabilityTimes: [String],  // e.g. ["Morning","Afternoon"]

  // Legacy / back-compat fields
  activity: String,        // study / cafe / walk / social / outdoor
  energyLevel: String,     // low / medium / high
  vibe: String,            // chill / focused / social / active
  indoorOutdoor: String,   // indoor / outdoor / both
  sustainability: String,  // low / medium / high

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Preference ||
  mongoose.model("Preference", PreferenceSchema);
