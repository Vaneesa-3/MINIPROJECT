import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: {
    type: String,
    enum: ["Assistant", "Associate", "Professor", "HOD","Other"],
    default: "Assistant",
  },
  available: { type: Boolean, default: true },
  // Used during scheduling
  count: { type: Number, default: 0 },

  // Optional restriction
  allowed_rooms: [{ type: String }]
});

export default mongoose.model("Faculty", facultySchema);