// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId="448380649776-1b933d1lvvba6fu0h6semr1a6lqbe034.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);