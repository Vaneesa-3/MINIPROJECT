import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('signup');

  const[name,setName]=useState('');
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');

  const handleSubmit=(e)=>{
    e.preventDefault()
    axios.post(`${import.meta.env.VITE_API_URL}/signup`, { name, email, password })
      .then(result => {
        console.log(result.data);
        alert('Signup successful!');
        navigate('/login'); // Optional: redirect to login after signup
      })
      .catch(err => {
    if (err.response) {
      // Log the message only, not the entire error object
      console.log("Server message:", err.response.data);
      alert(err.response.data); // e.g., "User already exists"
    } else {
      console.log("Unexpected error:", err.message);
      alert('Signup failed! Please try again.');
    }
  });
  }

  return (
    <>
    <Box
  sx={{
    width: "100%",
    backgroundColor: "#8B0000",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: "1px"
  }}
>
  Government Engineering College, Thrissur
</Box>
    <Box
      style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight:  "calc(100vh - 80px)"
  }}
      
    >
      {/* currently there is no color for box */}

      <Paper elevation={13} sx={{ padding: 4, width: 400 }}>
        <Typography variant="h4" align="center" gutterBottom>
          INTERNAL EXAMINATION PORTAL
        </Typography>

        <Box
  sx={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    mb: 3
  }}
>
          <ToggleButtonGroup
  value={selected}
  exclusive
  onChange={(event, newVal) => {
    if (newVal !== null) {
      setSelected(newVal);        // update the selected state
      if (newVal === 'signup') {
        navigate('/signup');      // go to /signup page
      } else if (newVal === 'login') {
        navigate('/login');       // optional: go to /login if needed
      }
    }
  }}
>

            <ToggleButton value="signup">Signup</ToggleButton>
            <ToggleButton value="login">Login</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField fullWidth type="text" label="Username" margin="normal" 
          onChange={(e)=>setName(e.target.value)}/>
          <TextField fullWidth type="email" label="Email" margin="normal" 
          onChange={(e)=>setEmail(e.target.value)}/>
          <TextField fullWidth type="password" label="Password" margin="normal" 
          onChange={(e)=>setPassword(e.target.value)}/>
          
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, backgroundColor: '#3255ca' }}>
            Sign-Up
          </Button>
        </form>
      </Paper>
    </Box>
    </>
  );
};

export default Signup;
