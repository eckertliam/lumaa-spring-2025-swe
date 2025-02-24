import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Register from './components/Register/Register';
import Login from './components/Login/Login';

function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      {/* default fallback route */}
      <Route path="*" element={<Register />} />
    </Routes>
  )
}

export default App;
