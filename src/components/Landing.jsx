import React, { useState } from "react";
import Navbar from "./Navbar";

const Landing = () => {
  const [theme, setTheme] = useState("dark"); // default

  const isDark = theme === "dark";

  const styles = {
    page: {
      background: isDark ? "#05083d" : "#ffffff",
      color: isDark ? "white" : "#111",
      minHeight: "100vh",
      padding: "15px",
      transition: "0.3s",
    },
    hero: {
      marginTop: "40px",
      textAlign: "center",
    },
    button: {
      padding: "12px 25px",
      background: isDark ? "#3b82f6" : "#2563eb",
      border: "none",
      borderRadius: "8px",
      color: "white",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      {/* Pass theme + setter */}
      <Navbar theme={theme} setTheme={setTheme} />

      <div style={styles.hero}>
        <h1>Welcome to GECTCR</h1>
        <p>Your campus, your community, all in one place.</p>
        <button style={styles.button}>Get Started</button>
      </div>
    </div>
  );
};

export default Landing;