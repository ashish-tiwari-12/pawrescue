import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { NgoAuthProvider } from './context/NgoAuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NgoAuthProvider>
      <App />
    </NgoAuthProvider>
  </React.StrictMode>
);
