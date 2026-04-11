// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { verifyGoogleToken } from '../api/api';

export default function Login() {
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    setError('');
    try {
      // Send the Google token to the backend auth route
      const data = await verifyGoogleToken(credentialResponse.credential);

      if (data.success) {
        // Store user info in sessionStorage so other pages can read it
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('userType', data.userType);

        // Enforce Isolated Access routing based on DB role
        if (data.userType === 'employee') {
          if (data.user.role === 'Manager') {
            navigate('/manager');
          } else {
            navigate('/cashier');
          }
        } else {
          // Customers go to the self-serve kiosk
          navigate('/kiosk');
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError('Server error during login. Please try again.');
    }
  };

  return (
    <div style={styles.bg}>
      <div style={styles.box}>
        <h1 style={styles.logo}>🧋 Fade Boba</h1>
        <h2 style={styles.title}>Sign In</h2>
        
        <p style={styles.subtitle}>
          Staff and Customers please authenticate below.
        </p>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.btnContainer}>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => setError('Google Login UI Failed')}
            theme="filled_black" 
            shape="rectangular"
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  bg:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' },
  box:      { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '50px', width: '450px', display: 'flex', flexDirection: 'column', gap: '18px' },
  logo:     { fontSize: '36px', textAlign: 'center', color: 'var(--pink)', fontWeight: 800, margin: '0 0 10px 0' },
  title:    { textAlign: 'center', fontWeight: 700, fontSize: '24px', margin: '0' },
  subtitle: { textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)', marginBottom: '10px' },
  error:    { color: 'var(--red)', fontSize: '14px', textAlign: 'center' },
  btnContainer: { display: 'flex', justifyContent: 'center', marginTop: '10px' }
};