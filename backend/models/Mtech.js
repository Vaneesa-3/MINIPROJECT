import mongoose from "mongoose";

const mtechSchema = new mongoose.Schema({
  name: { type: String, required: true },

  available: { type: Boolean, default: true },

  count: { type: Number, default: 0 }
});

export default mongoose.model("Mtech", mtechSchema);