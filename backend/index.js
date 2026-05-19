import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "./connection.js";
import User from "./models/User.js";
import Semester from "./models/Semester.js";
import Class from "./models/Class.js";
import mongoose from "mongoose";
import ExamConfig from "./models/Examconfig.js";
import Faculty from "./models/Faculty.js";
import Mtech from "./models/Mtech.js";
import PDFDocument from "pdfkit";
import Scheme from "./models/Scheme.js";


dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// connect DB
connectDB();


// ================== SIGNUP ==================
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: {
  type: String,
  default: "user"
}
    });

    await newUser.save();

    res.send("Signup successful ✅");
  } catch (err) {
    res.status(500).send("Server error");
  }
});


// ================== LOGIN ==================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      role: user.role,
    });

  } catch (err) {
    res.status(500).send("Server error");
  }
});


// GET all semesters
app.get("/api/semesters", async (req, res) => {
  const data = await Semester.find();
  res.json(data);
});

// UPDATE strength
app.put("/api/semesters/:sem", async (req, res) => {
  const updated = await Semester.findOneAndUpdate(
    { sem: req.params.sem },
    { strength: req.body.strength },
    { new: true }
  );
  res.json(updated);
});
app.post("/api/semesters", async (req, res) => {
  const newSem = new Semester(req.body);
  await newSem.save();   // 🔥 THIS LINE STORES DATA
  res.json(newSem);
});
// ------------------CLASSES-------------------
app.get("/api/classes", async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/classes", async (req, res) => {
  try {
    const classes = req.body;

    // remove old
    await Class.deleteMany();

    // insert new
    await Class.insertMany(classes);

    res.json({ message: "Saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ================== EXAM CONFIG ==================
app.post("/api/teachers/seed", async (req, res) => {
  try {
    const { classes, examDays } = req.body;

    if (!classes || !Array.isArray(classes)) {
      return res.status(400).json({ error: "Invalid classes data" });
    }

    // Save classes
    await Class.deleteMany();
    await Class.insertMany(classes);

    // Save exam days (optional)
    await ExamConfig.deleteMany();

await ExamConfig.create({
  examDays: Number(examDays)
});

    res.json({ success: true });

  } catch (err) {
    console.error("SEED ERROR:", err); // 👈 THIS WILL SHOW REAL ERROR
    res.status(500).json({ error: "Seed failed" });
  }
});

app.get("/api/teachers/examconfig", async (req, res) => {
  try {
    const config = await ExamConfig.findOne().sort({ createdAt: -1 });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================== FACULTY ==================
app.get("/api/faculty", async (req, res) => {
  try {
    const faculty = await Faculty.find();
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/faculty", async (req, res) => {
  try {
    const member = await Faculty.create(req.body);
    res.json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/faculty", async (req, res) => {
  try {
    const { faculty } = req.body;
    for (const f of faculty) {
      if (f._id) {
        await Faculty.findByIdAndUpdate(f._id, {
          name: f.name,
          designation: f.designation,
          available: f.available,
        });
      } else {
        await Faculty.create(f);
      }
    }
    const updated = await Faculty.find();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/faculty/:id", async (req, res) => {
  try {
    console.log("DELETE ID:", req.params.id);

    const deleted = await Faculty.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================== SCHEDULE DATA ==================
app.get("/api/schedule-data", async (req, res) => {
  try {
    const [classrooms, config, allFaculty] = await Promise.all([
      Class.find(),
      ExamConfig.findOne().sort({ createdAt: -1 }),
      Faculty.find(),
    ]);
    res.json({
      classrooms,
      examDays: config?.examDays ?? 0,
      availableFaculty: allFaculty.filter((f) => f.available),
      allFaculty,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/generate-schedule", async (req, res) => {
  try {
    // ❌ REMOVE THIS
    // const { days } = req.body;

    // ✅ GET FROM DATABASE
    const config = await ExamConfig.findOne().sort({ createdAt: -1 });
    const days = config?.examDays || 1;

    let teachers = await Faculty.find({ available: true });
    let mtechList = await Mtech.find({ available: true });
    let classes = await Class.find({ selected: true });

    // Reset counts
    teachers = teachers.map(t => ({ ...t._doc, count: 0 }));
    mtechList = mtechList.map(m => ({ ...m._doc, count: 0 }));

    const PRIORITY_MAP = {
      Assistant: 1,
      Associate: 2,
      Other: 2
    };

    const getPriority = (designation) =>
      PRIORITY_MAP[designation] || 0;

    let schedule = [];

    for (let day = 1; day <= days; day++) {
      let usedToday = new Set();

      let eligibleTeachers = teachers.filter(
        t =>
          t.designation !== "HOD" 
      );

      eligibleTeachers.sort((a, b) => {
        if (a.count !== b.count) return a.count - b.count;
        return getPriority(b.designation) - getPriority(a.designation);
      });

      let teacherPointer = 0;

      for (let cls of classes) {
        let room = cls.name;
        let capacity = cls.capacity;

        if (capacity === 0) continue;

        let totalInvigilators = Math.ceil(capacity / 20);
        let mtechNeeded = totalInvigilators - 1;

        // Assign Teacher
        let assignedTeacher = null;

        while (teacherPointer < eligibleTeachers.length) {
          let t = eligibleTeachers[teacherPointer];

          if (usedToday.has(t.name)) {
            teacherPointer++;
            continue;
          }

          if (t.allowed_rooms && t.allowed_rooms.length > 0) {
            if (!t.allowed_rooms.includes(room)) {
              teacherPointer++;
              continue;
            }
          }

          assignedTeacher = t;
          break;
        }

        if (!assignedTeacher) continue;

        assignedTeacher.count++;
        usedToday.add(assignedTeacher.name);
        teacherPointer++;

        // Assign MTechs
        let mtechAssigned = [];

        for (let i = 0; i < mtechNeeded; i++) {
          if (mtechList.length === 0) break; 
          mtechList.sort((a, b) => a.count - b.count);

          let mtech = mtechList[0];
          mtech.count++;

          mtechAssigned.push(mtech.name);
        }

        // Final row format
        schedule.push({
          date: `Day ${day}`,
          classroom: room,
          faculty: assignedTeacher.name,
          mtech: mtechAssigned.join(", ")
        });
      }
    }

    res.json({ success: true, schedule });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});
app.post("/api/timetable/generate", async (req, res) => {
  try {
    const { rawInput, seniorScheme } = req.body;
    if (!rawInput || !seniorScheme) {
      return res.status(400).json({ error: "rawInput and seniorScheme are required" });
    }
 
    const JUNIOR_SEMS = ["S1", "S2", "S3", "S4", "S5", "S6"];
    const IGNORE = new Set(["Date", "Time", "Exam Slot", "Semester"]);
 
    let lines = rawInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !IGNORE.has(l));
 
    const grouped = {}; // { "S3": [{ date, session, time, slot, subject }] }
 
    for (let i = 0; i + 4 < lines.length; i += 5) {
      // line i   = day name  (unused but consumed)
      const dateSession = lines[i + 1];
      const time        = lines[i + 2];
      const slotLine    = lines[i + 3];
      const semLine     = lines[i + 4];
 
      const dsParts = dateSession.split(/\s+/);
      const date    = dsParts[0] || "";
      const session = dsParts[1] || "";
      const slot    = slotLine.split(/\s+/)[0];
 
      const semesters = semLine.split(",").map((s) => s.trim());
 
      for (const sem of semesters) {
        const schemeToUse = JUNIOR_SEMS.includes(sem) ? "2024" : seniorScheme;
 
        // Fetch from DB
        const schemeDoc = await Scheme.findOne({
          scheme: schemeToUse,
          semester: sem,
        });
 
        const subject =
          schemeDoc?.subjects?.get(slot) || "Not Found";
 
        if (!grouped[sem]) grouped[sem] = [];
        grouped[sem].push({ date, session, time, slot, subject });
      }
    }
 
    res.json({ data: grouped });
  } catch (err) {
    console.error("Timetable generate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
 
// POST /api/timetable/download-pdf
// Body: { data: { "S3": [{ date, session, time, slot, subject }], ... } }
app.post("/api/timetable/download-pdf", (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "data is required" });
 
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Exam_Time_Table.pdf"'
    );
    doc.pipe(res);
 
    // Header
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("DEPT. OF COMPUTER SCIENCE & ENGINEERING", { align: "center" })
      .text("GOVT. ENGINEERING COLLEGE, THRISSUR", { align: "center" })
      .text("SERIES TEST TIMETABLE", { align: "center" })
      .moveDown(1);
 
    const COL_WIDTHS = [70, 55, 90, 40, 265]; // Date, Session, Time, Slot, Subject
    const HEADERS = ["Date", "Session", "Time", "Slot", "Subject"];
    const ROW_HEIGHT = 20;
    const TABLE_LEFT = 40;
 
    const drawRow = (rowData, isHeader = false) => {
      const y = doc.y;
      doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(9);
 
      let x = TABLE_LEFT;
      rowData.forEach((text, i) => {
        doc.rect(x, y, COL_WIDTHS[i], ROW_HEIGHT).stroke();
        doc.text(String(text), x + 4, y + 5, {
          width: COL_WIDTHS[i] - 8,
          lineBreak: false,
        });
        x += COL_WIDTHS[i];
      });
      doc.moveDown(0); // advance past the row manually
      doc.y = y + ROW_HEIGHT;
    };
 
    const ORDER = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
    for (const sem of ORDER) {
      const exams = data[sem];
      if (!exams || exams.length === 0) continue;
 
      doc.font("Helvetica-Bold").fontSize(11).text(sem).moveDown(0.3);
      drawRow(HEADERS, true);
      exams.forEach((exam) =>
        drawRow([exam.date, exam.session, exam.time, exam.slot, exam.subject])
      );
      doc.moveDown(1);
    }
 
    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) res.status(500).json({ error: "PDF generation failed" });
  }
});

// start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT} 🚀`);
});