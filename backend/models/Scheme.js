import mongoose from "mongoose";

const SchemeSchema = new mongoose.Schema({
  scheme: {
    type: String,
    required: true,
    enum: ["2019", "2024"],
  },
  semester: {
    type: String,
    required: true,
    enum: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
  },
  subjects: {
    type: Map,
    of: String,
    required: true,
    // Keys are exam slots like "A", "B", "C", ...
    // Values are subject names
  },
});

// Compound index so lookups by (scheme + semester) are fast
SchemeSchema.index({ scheme: 1, semester: 1 }, { unique: true });

export default mongoose.model("Scheme", SchemeSchema);