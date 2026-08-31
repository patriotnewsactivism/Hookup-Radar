import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<div style="color:white;background:black;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:18px;">Unable to start the application.</div>';
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
