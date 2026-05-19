import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  selected: { type: Boolean, default: true }
});

export default mongoose.model("Class", classSchema);