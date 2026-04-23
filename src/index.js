import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Dashboard from './dashbord';
import reportWebVitals from './reportWebVitals';

// Detect route
const path = window.location.pathname;

// Create root ONLY ONCE
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render based on route
root.render(
  <React.StrictMode>
    {path === '/admin' ? <Dashboard /> : <App />}
  </React.StrictMode>
);

reportWebVitals();