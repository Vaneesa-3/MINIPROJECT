import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const ALL_CLASSES = ["6A", "7A", "8A", "9A"];
const DEFAULT_CAPACITY = 63;

const SEMESTERS = {
  odd: ["S1", "S3", "S5", "S7"],
  even: ["S2", "S4", "S6", "S8"],
};

export default function Examination({ setGenData }) {
  const navigate = useNavigate();
  const [semesterType, setSemesterType] = useState("odd");
  const [availableSems, setAvailableSems] = useState(SEMESTERS.odd);
  const [selectedSems, setSelectedSems] = useState([]);
  const [studentStrength, setStudentStrength] = useState({});
  const CLASS_API = "http://localhost:5000/api/classes";

  const [classes, setClasses] = useState(
    ALL_CLASSES.map((c) => ({ name: c, capacity: DEFAULT_CAPACITY, selected: false }))
  );
  const [examDays, setExamDays] = useState("");
const [showDaysInput, setShowDaysInput] = useState(false);

  useEffect(() => {
    const sems = SEMESTERS[semesterType];
    setAvailableSems(sems);
    setSelectedSems([]);

    fetch("http://localhost:5000/api/semesters")
      .then((res) => res.json())
      .then((data) => {
        let db = {};
        data.forEach((item) => {
          db[item.sem] = item.strength;
        });

        let filtered = {};
        sems.forEach((s) => {
          filtered[s] = db[s] || 0;
        });

        setStudentStrength(filtered);
      });
  }, [semesterType]);
  useEffect(() => {
  fetch(CLASS_API)
    .then((res) => res.json())
    .then((data) => {
      if (data.length > 0) {
        setClasses(data);
      }
    })
    .catch((err) => console.error(err));
}, []);

  const toggleSemester = (sem) => {
    setSelectedSems((prev) =>
      prev.includes(sem) ? prev.filter((s) => s !== sem) : [...prev, sem]
    );
  };

  const updateStrength = (sem, value) => {
    const num = parseInt(value) || 0;
    setStudentStrength((prev) => ({ ...prev, [sem]: num }));

    fetch(`http://localhost:5000/api/semesters/${sem}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strength: num }),
    });
  };

  const toggleClass = (index) => {
    let updated = [...classes];
    updated[index].selected = !updated[index].selected;
    setClasses(updated);
  };

  const updateCapacity = (index, value) => {
    let updated = [...classes];
    updated[index].capacity = parseInt(value) || 0;
    setClasses(updated);
  };

  const addClass = () => {
    const name = prompt("Enter class name");
    if (!name) return;

    setClasses([
      ...classes,
      { name, capacity: DEFAULT_CAPACITY, selected: true },
    ]);
  };

  const removeClass = (index) => {
    let updated = [...classes];
    updated.splice(index, 1);
    setClasses(updated);
  };
  const saveClasses = async () => {
  try {
    await fetch(CLASS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(classes),
    });

    alert("Classes saved successfully!");
  } catch (err) {
    console.error(err);
  }
};

  const getMinClassesRequired = () => {
    if (selectedSems.length === 1) return 2;
    if (selectedSems.length === 2) return 3;
    if (selectedSems.length >= 3) return 4;
    return 0;
  };

const handleGenerate = () => {
  const selectedClassCount = classes.filter((c) => c.selected).length;
  const minRequired = getMinClassesRequired();

  if (selectedSems.length === 0) {
    alert("Select at least one semester");
    return;
  }

  if (selectedClassCount < minRequired) {
    alert(`Minimum ${minRequired} classes required`);
    return;
  }

  setGenData({
    selectedSems,
    studentStrength,
    classes,
  });

  navigate("/generate");
};
const handleTeacherPage = async () => {
  const selectedClasses = classes.filter(c => c.selected);

  // 🔥 SAVE TO DB FIRST
  await fetch("http://localhost:5000/api/teachers/seed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      classes: selectedClasses,
      examDays: parseInt(examDays)
    })
  });

  // THEN NAVIGATE
  navigate("/teachers");
};

  return (
    <div
  style={{
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "sans-serif",
    background: "#f5f7fb",
    minHeight: "100vh",
  }}
>
      <h2 style={{ textAlign: "center" }}>Examination Setup</h2>

      {/* Semester Type Card */}
      <div style={cardStyle}>
        <h3>Semester Type</h3>
        <label>
          <input
            type="radio"
            checked={semesterType === "odd"}
            onChange={() => setSemesterType("odd")}
          /> Odd
        </label>
        <label style={{ marginLeft: "20px" }}>
          <input
            type="radio"
            checked={semesterType === "even"}
            onChange={() => setSemesterType("even")}
          /> Even
        </label>
      </div>

      {/* Semester Card */}
      <div style={cardStyle}>
        <h3>Select Semesters</h3>
        {availableSems.map((sem) => (
          <div key={sem} style={rowStyle}>
            <input
              type="checkbox"
              checked={selectedSems.includes(sem)}
              onChange={() => toggleSemester(sem)}
            />
            <span style={{ flex: 1 }}>{sem}</span>
            <input
              type="number"
              value={studentStrength[sem] || ""}
              onChange={(e) => updateStrength(sem, e.target.value)}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* Classes Card */}
{selectedSems.length > 0 && (
  <div style={cardStyle}>
    <h3>Class Capacity</h3>

    {classes.map((cls, index) => (
      <div key={index} style={rowStyle}>
        <input
          type="checkbox"
          checked={cls.selected}
          onChange={() => toggleClass(index)}
        />

        <span style={{ flex: 1 }}>{cls.name}</span>

        <input
          type="number"
          value={cls.capacity}
          onChange={(e) => updateCapacity(index, e.target.value)}
          style={inputStyle}
        />

        <button style={removeBtn} onClick={() => removeClass(index)}>
          ✕
        </button>
      </div>
    ))}

    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
      <button style={addBtn} onClick={addClass}>
        + Add Class
      </button>

      <button
        style={{
          ...addBtn,
          backgroundColor: "#4CAF50",
          color: "white"
        }}
        onClick={saveClasses}
      >
        OK
      </button>
    </div>
  </div>
)}

      {/* Generate Button Card */}
      {selectedSems.length > 0 && (
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <button style={generateBtn} onClick={handleGenerate}>
            Generate Seating
          </button>
        </div>
      )}
      {/* Teachers Schedule Card */}
<div style={{ ...cardStyle, textAlign: "center" }}>
  {!showDaysInput ? (
    <button style={generateBtn} onClick={() => setShowDaysInput(true)}>
      Teachers Schedule
    </button>
  ) : (
    <>
      <input
        type="number"
        placeholder="Enter number of exam days"
        value={examDays}
        onChange={(e) => setExamDays(e.target.value)}
        style={{ padding: "10px", marginBottom: "10px", width: "60%" }}
      />

      <br />

      <button
        style={generateBtn}
        onClick={() => handleTeacherPage()}
      >
        Generate List
      </button>
    </>
  )}
</div>
    </div>
  );
}

// 🎨 Styles
const cardStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "20px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "10px",
};

const inputStyle = {
  width: "80px",
  padding: "5px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const addBtn = {
  marginTop: "10px",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#4CAF50",
  color: "white",
  cursor: "pointer",
};

const removeBtn = {
  background: "#ff4d4f",
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "4px 8px",
  cursor: "pointer",
};

const generateBtn = {
  padding: "12px 20px",
  fontSize: "16px",
  borderRadius: "10px",
  border: "none",
  background: "#6366f1",
  color: "white",
  cursor: "pointer",
};