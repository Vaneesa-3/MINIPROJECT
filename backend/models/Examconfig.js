import mongoose from "mongoose";

// Singleton doc — only one exam config at a time
const examConfigSchema = new mongoose.Schema({
  examDays: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("ExamConfig", examConfigSchema);