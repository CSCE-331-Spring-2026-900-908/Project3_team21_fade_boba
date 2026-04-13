import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { verifyGoogleToken } from '../api/api';

export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    setError('');
    try {
      const data = await verifyGoogleToken(credentialResponse.credential);

      if (data.success) {
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('userType', data.userType);

        if (data.userType === 'employee') {
          if (data.user.role === 'Manager') {
            navigate('/manager');
          } else {
            navigate('/cashier');
          }
        } else {
          navigate('/kiosk');
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError('Server error during login. Please try again.');
    }
  };

  return (
    <main style={styles.bg} id="main-content">
      <div style={styles.box}>
        <h1 style={styles.logo}>🧋 Fade Boba</h1>
        <h2 style={styles.title}>Staff Sign In</h2>

        <p style={styles.subtitle}>
          Managers and cashiers should authenticate below. Customers should use the kiosk
          from the portal page.
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

        <button style={styles.backBtn} onClick={() => navigate('/')}>
          Back to Portal
        </button>
      </div>
    </main>
  );
}

const styles = {
  bg: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--dark)',
    padding: '24px',
  },
  box: {
    background: 'var(--dark-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '50px',
    width: '450px',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  logo: {
    fontSize: '36px',
    textAlign: 'center',
    color: 'var(--pink)',
    fontWeight: 800,
    margin: '0 0 10px 0',
  },
  title: { textAlign: 'center', fontWeight: 700, fontSize: '24px', margin: '0' },
  subtitle: {
    textAlign: 'center',
    fontSize: '15px',
    color: 'var(--text-muted)',
    marginBottom: '10px',
  },
  error: { color: 'var(--red)', fontSize: '14px', textAlign: 'center' },
  btnContainer: { display: 'flex', justifyContent: 'center', marginTop: '10px' },
  backBtn: {
    background: 'var(--border)',
    color: 'var(--text)',
  },
};