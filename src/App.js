import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import ThreeBackground from './ThreeBackground';
import Expense from './Expense';
import Attendance from './Attendance';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <ThreeBackground />
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expense" element={<Expense />} />
            <Route path="/attendance" element={<Attendance />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
