import React, { useState } from "react";

export default function Generate({ data }) {
  const [shuffleIndex, setShuffleIndex] = useState(0);

  if (!data) return <h2>No Data</h2>;

  const { selectedSems, studentStrength, classes } = data;
  const selectedClasses = selectedSems;
  const selectedRooms = classes.filter(c => c.selected);
  const rooms = selectedRooms.map(r => r.name);
  const caps = {};
  selectedRooms.forEach(r => { caps[r.name] = r.capacity; });
  const totals = {};
  selectedClasses.forEach(s => { totals[s] = studentStrength[s]; });

  if (rooms.length < 1) return <h3>Select classrooms</h3>;

  // ── CASE A: 1 semester, 2 rooms ──────────────────────────────────────────
  // Split roll numbers across 2 rooms, alternate benches (odd columns only)
  const generateSingleSemLayout = (cls, total, rooms) => {
    const perRoom = Math.ceil(total / rooms.length);
    const benchPattern = ["C1", "C3", "C5", "C7", "C9"];

    return rooms.map((room, index) => {
      const start = index * perRoom + 1;
      const end = Math.min(start + perRoom - 1, total);
      const count = end - start + 1;
      const perBench = Math.floor(count / benchPattern.length);
      const extra = count % benchPattern.length;

      const benches = benchPattern.map((b, bi) => ({
        bench: b,
        count: perBench + (bi < extra ? 1 : 0),
      }));

      return { room, cls, range: `${start}-${end}`, benches };
    });
  };

  // ── CASE B: multiple semesters, multiple rooms ────────────────────────────
  // Each semester's students are spread across ALL rooms.
  // Within each room, benches are assigned interleaving semesters cyclically.
  //
  // Bench capacities per room (total 63):
  //   C1-C6 → 8 seats each  (48 total)
  //   C7-C9 → 5 seats each  (15 total)
  //
  // Interleaving: benches are assigned round-robin across semesters.
  // e.g. 3 sems → C1=S3, C2=S5, C3=S7, C4=S3, C5=S5, C6=S7, C7=S3, C8=S5, C9=S7
  const generateMultiSemLayout = (classes, rooms, totals, shuffleIndex) => {
    const numSems = classes.length;
    const benchDefs = [
      { bench: "C1", seats: 8 },
      { bench: "C2", seats: 8 },
      { bench: "C3", seats: 8 },
      { bench: "C4", seats: 8 },
      { bench: "C5", seats: 8 },
      { bench: "C6", seats: 8 },
      { bench: "C7", seats: 5 },
      { bench: "C8", seats: 5 },
      { bench: "C9", seats: 5 },
    ];

    // Rotate class order based on shuffleIndex
    const rotatedClasses = classes.map(
      (_, i) => classes[(i + shuffleIndex) % numSems]
    );

    // For each room, assign benches cycling through semesters
    // Track roll number cursors per semester
    const cursors = {};
    classes.forEach(cls => { cursors[cls] = 1; });

    // Build per-room data
    return rooms.map((room) => {
      const roomBenches = benchDefs.map((bd, bi) => {
        const cls = rotatedClasses[bi % numSems];
        return { bench: bd.bench, cls, count: bd.seats };
      });

      // Calculate range per semester in this room
      const semRanges = {};
      classes.forEach(cls => { semRanges[cls] = { start: null, end: null, count: 0 }; });
      roomBenches.forEach(rb => { semRanges[rb.cls].count += rb.count; });

      // Assign ranges using cursors
      const result = {};
      classes.forEach(cls => {
        const count = semRanges[cls].count;
        if (count > 0) {
          const start = cursors[cls];
          const end = Math.min(start + count - 1, totals[cls]);
          result[cls] = { range: `${start}-${end}`, benches: roomBenches.filter(rb => rb.cls === cls) };
          cursors[cls] = end + 1;
        } else {
          result[cls] = { range: "-", benches: [] };
        }
      });

      return { room, semData: result, roomBenches };
    });
  };

  const isSingleSem = selectedClasses.length === 1 && rooms.length === 2;
  const isMultiSem = selectedClasses.length > 1;

  const singleLayout = isSingleSem
    ? generateSingleSemLayout(selectedClasses[0], totals[selectedClasses[0]], rooms)
    : null;

  const multiLayout = isMultiSem
    ? generateMultiSemLayout(selectedClasses, rooms, totals, shuffleIndex)
    : null;

  const downloadPDF = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const canvas = await html2canvas(document.body);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape");
    pdf.addImage(imgData, "PNG", 10, 10, 280, 150);
    pdf.save("seating.pdf");
  };

const downloadAttendance = async () => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  let isFirstPage = true;

  const addSheetPage = (cls, room, range) => {
    if (!isFirstPage) pdf.addPage();
    isFirstPage = false;

    const [start, end] = range.split("-").map(Number);

    // ── Title ──
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("ATTENDANCE SHEET - SERIES", pageWidth / 2, 18, { align: "center" });

    // ── CLASS label (left) and Form No + Room (right) ──
    pdf.setFontSize(11);
    pdf.text(`CLASS: ${cls}`, 14, 28);
    pdf.text(`Form No: EX 04(00)     ${room}`, pageWidth - 14, 28, { align: "right" });

    // ── Table ──
    const rows = [];
    for (let i = start; i <= end; i++) {
      rows.push([i, "", "", "", "", "", ""]);
    }

    autoTable(pdf, {
      startY: 33,
      head: [["Roll No", "", "", "", "", "", ""]],
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 10,
        fontStyle: "bold",
        halign: "left",
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
        4: { cellWidth: 28 },
        5: { cellWidth: 28 },
        6: { cellWidth: 28 },
      },
    });
  };

  if (isSingleSem && singleLayout) {
    singleLayout.forEach((item) => {
      addSheetPage(item.cls, item.room, item.range);
    });

  } else if (isMultiSem && multiLayout) {
    multiLayout.forEach((roomData) => {
      selectedClasses.forEach((cls) => {
        const semData = roomData.semData[cls];
        if (!semData || semData.range === "-") return;
        addSheetPage(cls, roomData.room, semData.range);
      });
    });
  }

  pdf.save("attendance_sheets.pdf");
};

  const tdStyle = { border: "1px solid #ccc", padding: "8px", textAlign: "center", verticalAlign: "top" };
  const thStyle = { ...tdStyle, fontWeight: "bold", background: "#f0f0f0" };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Seating Arrangement</h2>

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div><label>Date: </label><input type="text" placeholder="Enter date" /></div>
        <div><label>Time: </label><input type="text" placeholder="FN / AN / FN & AN" /></div>
      </div>

      {/* ── CASE A: Single Semester, 2 Rooms ── */}
      {isSingleSem && singleLayout && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Semester</th>
              <th style={thStyle}>Room</th>
              <th style={thStyle}>Roll Range</th>
              <th style={thStyle}>Bench Distribution</th>
            </tr>
          </thead>
          <tbody>
            {singleLayout.map((item, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{item.cls}</td>
                <td style={tdStyle}>{item.room}</td>
                <td style={tdStyle}>{item.range}</td>
                <td style={tdStyle}>
                  {item.benches.map(b => `${b.bench}: ${b.count}`).join(",  ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── CASE B: Multiple Semesters, Multiple Rooms ── */}
      {isMultiSem && multiLayout && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Class</th>
              {rooms.map(r => <th key={r} style={thStyle}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {/* Roll range rows */}
            {selectedClasses.map((cls) => (
              <tr key={cls}>
                <td style={tdStyle}>{cls}</td>
                {multiLayout.map((roomData, ri) => (
                  <td key={ri} style={tdStyle}>
                    {roomData.semData[cls]?.range || "-"}
                  </td>
                ))}
              </tr>
            ))}

            {/* Bench distribution row */}
            <tr>
              <td style={{ ...tdStyle, fontWeight: "bold" }}>Seats</td>
              {multiLayout.map((roomData, ri) => (
                <td key={ri} style={{ ...tdStyle, fontSize: "12px" }}>
                  {roomData.roomBenches.map((rb, bi) =>
                    `${rb.bench}(${rb.cls}:${rb.count})`
                  ).join(", ")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      )}

      {/* Fallback for other configurations */}
      {!isSingleSem && !isMultiSem && (
        <p>Unsupported configuration. Please select 1 or more semesters and appropriate rooms.</p>
      )}

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => setShuffleIndex(shuffleIndex + 1)}>Shuffle</button>
        
        <button onClick={downloadPDF}>Download PDF</button>
        <button onClick={downloadAttendance}>Attendance Sheet</button>
      </div>
    </div>
  );
}