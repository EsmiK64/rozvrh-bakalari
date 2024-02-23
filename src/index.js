import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import Teachers from './pages/Teachers.jsx';
import Classes from './pages/Classes.jsx';
import reportWebVitals from './reportWebVitals.js';
import { BrowserRouter, Routes, Route } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/teachers" element={<Teachers />} />
      <Route path="/classes" element={<Classes />} />
    </Routes>
  </BrowserRouter>
);

reportWebVitals();