import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000"; // adjust to your base URL
const DESIGNATIONS = ["Assistant", "Associate", "Professor", "HOD", "Other"];
const blank = () => ({ name: "", designation: "Assistant", available: true });

export default function Teachers() {
  const location = useLocation();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [examDays, setExamDays] = useState(0);
  const [faculty, setFaculty] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState(blank());
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // On mount: seed DB from router state, then load everything
  useEffect(() => {
  const init = async () => {
    

    // 🔥 fetch AFTER seed completes
    const roomsRes = await fetch(`${API_BASE}/api/classes`).then(r => r.json());
    const configRes = await fetch(`${API_BASE}/api/teachers/examconfig`).then(r => r.json());
    const facultyRes = await fetch(`${API_BASE}/api/faculty`).then(r => r.json());

    setClassrooms(roomsRes);
    setExamDays(configRes?.examDays ?? 0);
    setFaculty(facultyRes);
    setLoading(false);
  };

  init();
}, []);

  // Add More — POST single member
  const handleAddMore = async () => {
    if (!newMember.name.trim()) return;
    const res = await fetch(`${API_BASE}/api/faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember),
    });
    const added = await res.json();
    setFaculty([...faculty, added]);
    setNewMember(blank());
    setShowAddForm(false);
    setSaved(false);
  };

  // Remove — DELETE by _id
  const handleRemove = async (id) => {
  try {
    console.log("Deleting ID:", id);

    const res = await fetch(`${API_BASE}/api/faculty/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    console.log("Delete response:", data);

    // 🔥 Refresh from DB (best fix)
    const updated = await fetch(`${API_BASE}/api/faculty`)
      .then((r) => r.json());

    setFaculty(updated);

  } catch (err) {
    console.error("Delete failed:", err);
  }
};

  // Inline edit (local state only — committed on OK)
  const handleChange = (id, field, value) => {
    setFaculty(faculty.map((f) => (f._id === id ? { ...f, [field]: value } : f)));
    setSaved(false);
  };

  // OK — PUT full list to DB
const handleOK = async () => {
  try {
    // 🔥 Save updates
    await fetch(`${API_BASE}/api/faculty`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faculty }),
    });

    // 🔥 Fetch updated data from DB
    const updated = await fetch(`${API_BASE}/api/faculty`)
      .then((res) => res.json());

    setFaculty(updated); // 💥 refresh UI with DB data
    setSaved(true);
  } catch (err) {
    console.error("Update failed:", err);
  }
};

  // Schedule — navigate with full data
  const handleSchedule = () => {
  navigate("/done", {
    state: {
      examDays,
    },
  });
};

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  // ── same styles as before (omitted for brevity, copy from previous version) ──

  return (
    <div style={{
  maxWidth: "900px",
  margin: "40px auto",
  padding: "30px",
  fontFamily: "Georgia, serif",
  background: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 8px 25px rgba(0,0,0,0.08)"
}}>
      {/* <h2 style={{
  marginBottom: "10px",
  fontSize: "26px",
  fontWeight: "bold"
}}>Faculty & Schedule Setup</h2> */}
      {/* <p><strong>Exam Days:</strong> {examDays}</p> */}

      {/* Classrooms */}
      <div style={{
  background: "#f8f9fb",
  padding: "15px",
  borderRadius: "10px",
  marginBottom: "20px"
}}>
  {/* <h3 style={{ marginBottom: "10px" }}>Classrooms</h3> */}
  {/* <ul style={{ paddingLeft: "20px" }}>
    {classrooms.map((c) => (
      <li key={c._id}>{c.name} — Capacity: {c.capacity}</li>
    ))}
  </ul> */}
</div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{
  display: "flex",
  gap: "10px",
  marginBottom: "15px",
  flexWrap: "wrap",
  background: "#f1f3f6",
  padding: "12px",
  borderRadius: "10px"
}}>
          <input style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc" }}placeholder="Name" value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
          <select 
          style={{ padding: "6px", borderRadius: "6px", border: "1px solid #ccc" }}
          value={newMember.designation}
            onChange={(e) => setNewMember({ ...newMember, designation: e.target.value })}>
            {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <label>
            <input type="checkbox" checked={newMember.available}
              onChange={(e) => setNewMember({ ...newMember, available: e.target.checked })} />
            {" "}Available
          </label>
          <button 
          style={{
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer"
}}
onClick={handleAddMore}>Add</button>
          <button onClick={() => { setShowAddForm(false); setNewMember(blank()); }}>Cancel</button>
        </div>
      )}

      {/* Faculty Table */}
      <table style={{
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "20px",
  borderRadius: "10px",
  overflow: "hidden"
}}>
        <thead style={{ background: "#4f46e5", color: "white" }}>
          <tr><th>#</th><th>Name</th><th>Designation</th><th>Available</th><th>Action</th></tr>
        </thead>
        <tbody>
          {faculty.map((f, i) => (
            <tr key={f._id}>
              <td style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #eee" }}>{i + 1}</td>
              <td style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #eee" }}>{f.name}</td>
              <td style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #eee" }}>
                <select value={f.designation}
                  onChange={(e) => handleChange(f._id, "designation", e.target.value)}>
                  {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </td>
              <td style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #eee" }}>
                <input type="checkbox" checked={f.available}
                  onChange={(e) => handleChange(f._id, "available", e.target.checked)} />
                {" "}{f.available ? "Yes" : "No"}
              </td>
              <td style={{ textAlign: "center", padding: "10px", borderBottom: "1px solid #eee" }}><button style={{
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer"
}}onClick={() => handleRemove(f._id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button style={{
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer"
}} onClick={() => setShowAddForm(true)}>+ Add More</button>
        <button 
        style={{
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#4f46e5",
  color: "white",
  cursor: "pointer"
}}onClick={handleOK}>✓ OK</button>
        {saved && <span style={{ color: "green", fontSize: 13 }}>✓ Saved</span>}
        <button style={{
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#4f46e5",
  color: "white",
  cursor: "pointer"
}}onClick={handleSchedule}>📋 Schedule →</button>
      </div>
    </div>
  );
}