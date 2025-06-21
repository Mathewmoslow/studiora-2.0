// src/main.jsx - Entry Point for Studiora 2.0
import React from 'react'
import ReactDOM from 'react-dom/client'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import App from './App.jsx'
import './index.css'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)