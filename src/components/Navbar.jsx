import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router-dom";

const Navbar = ({ theme, setTheme }) => {
  const isDark = theme === "dark";

  // ✅ Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  // ✅ Role-based menu
  const role = localStorage.getItem("role");

  const drawerItems =
    role === "admin"
      ? [
          { label: "Time Table Generation", path: "/timetable" },
          { label: "Examination Schedule", path: "/exam" }
        ]
      : [
          { label: "Time Table", path: "/timetablegen" },
          { label: "Schedule View", path: "/examgen" }
        ];

  return (
    <>
      {/* 🔷 Navbar */}
      <AppBar
        position="fixed"
        sx={{
          background: isDark
            ? "linear-gradient(90deg, #0b0f5a, #1e3a8a)"
            : "#e5e7eb",
          color: isDark ? "white" : "#111",
        }}
      >
        <Toolbar>
          {/* ☰ Hamburger */}
          <IconButton color="inherit" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>

          {/* Title */}
          <Typography sx={{
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    fontWeight: "bold",
  }}>
            GECTCR
          </Typography>

          {/* 🌗 Theme toggle */}
          <div style={{ marginLeft: "auto",display: "flex", gap: "10px", cursor: "pointer" }}>
            <Sun
              size={20}
              onClick={() => setTheme("light")}
              style={{ opacity: !isDark ? 1 : 0.5 }}
            />
            <Moon
              size={18}
              onClick={() => setTheme("dark")}
              style={{ opacity: isDark ? 1 : 0.5 }}
            />
          </div>
        </Toolbar>
      </AppBar>

      {/* 📂 Sidebar */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <List sx={{ width: 250 }}>
          {drawerItems.map(({ label, path }) => (
            <ListItem key={label} disablePadding>
              <ListItemButton
                component={Link}
                to={path}
                onClick={toggleDrawer(false)}
              >
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;