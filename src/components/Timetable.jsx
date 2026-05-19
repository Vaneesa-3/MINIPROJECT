import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SEMESTERS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

export default function Timetable() {
  const [seniorScheme, setSeniorScheme] = useState("2019");
  const [rawInput, setRawInput] = useState("");
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setTimetableData(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/timetable/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput, seniorScheme }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");

      setTimetableData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!timetableData) return;

    setPdfLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/timetable/download-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: timetableData }),
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "Exam_Time_Table.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
  <div style={{
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "30px",
    fontFamily: "Segoe UI, sans-serif"
  }}>
    <div style={{
      width: "100%",
      background: "#fff",
      borderRadius: "12px",
      padding: "25px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
    }}>

      {/* Title */}
      <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>
        Internal Exam Timetable Generator
      </h2>

      {/* FORM CARD */}
      <div style={{
        background: "#f9fafb",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        marginBottom: "25px"
      }}>
        <form onSubmit={handleGenerate}>

          {/* Scheme */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ marginRight: "10px" }}>
              Scheme for S7 / S8:
            </label>

            <select
              value={seniorScheme}
              onChange={(e) => setSeniorScheme(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #ccc"
              }}
            >
              <option value="2019">2019</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* TEXTAREA */}
          <div style={{ marginBottom: "15px" }}>
            <label>Paste Exam Schedule:</label>

            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              required
              style={{
                width: "100%",
                minHeight: "300px",
                marginTop: "8px",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                fontFamily: "monospace"
              }}
              placeholder={`Paste the raw schedule text here.

Expected format (5 lines per exam):
Day
DD/MM/YYYY FN/AN
HH:MM - HH:MM
Slot A/B/C...
S1,S3,S5`}
            />
          </div>

          {/* ERROR */}
          {error && (
            <div style={{
              color: "red",
              marginBottom: "10px"
            }}>
              {error}
            </div>
          )}

          {/* GENERATE BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "linear-gradient(to right, #2563eb, #4f46e5)",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "10px",
              cursor: "pointer"
            }}
          >
            {loading ? "Generating…" : "Generate Timetable"}
          </button>

        </form>
      </div>

      {/* RESULTS */}
      {timetableData && (
        <div>

          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px"
          }}>
            <h3>Generated Time Table</h3>

            {/* DOWNLOAD BUTTON */}
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              style={{
                background: "linear-gradient(to right, #10b981, #059669)",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "10px",
                cursor: "pointer"
              }}
            >
              {pdfLoading ? "Generating PDF…" : "Download PDF"}
            </button>
          </div>

          {/* TABLES */}
          {SEMESTERS.filter((sem) => timetableData[sem]?.length > 0).map(
            (sem) => (
              <div key={sem} style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "20px"
              }}>

                <h4 style={{ marginBottom: "10px" }}>{sem}</h4>

                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse"
                  }}>
                    <thead>
                      <tr style={{ background: "#f3f4f6" }}>
                        {["Date", "Session", "Time", "Slot", "Subject"].map(
                          (h) => (
                            <th key={h} style={{
                              padding: "10px",
                              textAlign: "left"
                            }}>
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {timetableData[sem].map((exam, idx) => (
                        <tr key={idx} style={{
                          borderTop: "1px solid #e5e7eb"
                        }}>
                          <td style={{ padding: "10px" }}>{exam.date}</td>
                          <td style={{ padding: "10px" }}>{exam.session}</td>
                          <td style={{ padding: "10px" }}>{exam.time}</td>
                          <td style={{ padding: "10px", fontWeight: "bold" }}>
                            {exam.slot}
                          </td>
                          <td style={{ padding: "10px" }}>{exam.subject}</td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>

              </div>
            )
          )}
        </div>
      )}

    </div>
  </div>
);
}