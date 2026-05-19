import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { Box, Button, Paper, TextField, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Landing from './components/Landing';
import Navbar from './components/Navbar';
import Examination from './components/Examination';
import Generate from './components/Generate';
import Teachers from './components/Teachers';
import Done from './components/Done';
import Timetable from './components/Timetable'


function App() {
const [genData, setGenData] = useState(null);

  return (
    <>
     <Routes>
        <Route path='/' element={<Login/>}/> 
        {/* remove the previous line later */}

        <Route path='/login' element={<Login/>}/>
        <Route path='/landing' element={<Landing/>}/>
        <Route path='/exam' element={<Examination setGenData={setGenData} />} />
        <Route path='/timetable' element={<Timetable />} />
        <Route path='/signup' element={<Signup/>}/>
        <Route path='/done' element={<Done/>}/>
        <Route path='/generate' element={<Generate data={genData} />}/>
        <Route path="/teachers" element={<Teachers />} />
      </Routes>

    </>
  )
}

export default App
