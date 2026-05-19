import { useState, useEffect } from "react";

export default function Done() {
  const [schedule, setSchedule] = useState([]);
  const [days, setDays] = useState(0);

  useEffect(() => {
    fetchDaysAndGenerate();
  }, []);

  const fetchDaysAndGenerate = async () => {
    try {
      // Fetch examDays from DB for display
      const configRes = await fetch("http://localhost:5000/api/teachers/examconfig");
      const config = await configRes.json();
      setDays(config?.examDays ?? 0);

      // Generate schedule (backend reads examDays from DB internally)
      const res = await fetch("http://localhost:5000/api/generate-schedule", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setSchedule(data.schedule);
      } else {
        console.error("API Error:", data.error);
        setSchedule([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setSchedule([]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Generated Schedule</h2>
      <p><strong>Number of Days:</strong> {days}</p>

      <table border="1" style={{ marginTop: "20px", width: "100%" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Classroom</th>
            <th>Faculty</th>
            <th>MTech Scholars</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row, index) => (
            <tr key={index}>
              <td>{row.date}</td>
              <td>{row.classroom}</td>
              <td>{row.faculty}</td>
              <td>{row.mtech}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}