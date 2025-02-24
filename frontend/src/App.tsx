import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Register from './components/Register/Register';
import Login from './components/Login/Login';
import Tasks from './components/Tasks/Tasks';
function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/tasks" element={<Tasks />} />
      {/* default fallback route */}
      <Route path="*" element={<Register />} />
    </Routes>
  )
}

export default App;
