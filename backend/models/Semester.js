import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
  sem: String,
  strength: Number,
});

export default mongoose.model("Semester", semesterSchema);