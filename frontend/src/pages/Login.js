import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { verifyGoogleToken } from '../api/api';
import { loginEmployee } from '../api/api';

export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [pin, setPin] = useState('');

  const handlePinLogin = async () => {
    if (!pin.trim()) return setError('Please enter a PIN.');
    setError('');

    try {
      const user = await loginEmployee(pin); 

      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('userType', 'employee');

      if (user.role === 'Manager') {
        navigate('/manager');
      } else {
        navigate('/cashier');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed. Please try again.');
    }
  };

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
      <div style={styles.wrapper}>
        <section style={styles.box} aria-labelledby="login-title">
          <h1 style={styles.logo}>🧋 Fade Boba</h1>
          <h2 id="login-title" style={styles.title}>
            Staff Sign In
          </h2>

          <p style={styles.subtitle}>
            Managers and cashiers should authenticate below. Customers should use the kiosk
            from the portal page.
          </p>

          {error && (
            <p style={styles.error} role="alert">
              {error}
            </p>
          )}



          <div style={styles.pinSection}>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={styles.input}
            />

            <button onClick={handlePinLogin} style={styles.pinBtn}>
              Login with PIN
            </button>
          </div>

          <div style={styles.divider}>OR</div>

          <div style={styles.btnContainer} aria-label="Google sign-in section">
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
        </section>
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
    position: 'relative', 
  },
  wrapper: {
    width: '100%',
    maxWidth: '500px', 
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  box: {
    background: 'var(--dark-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  logo: {
    fontSize: '2.25rem',
    textAlign: 'center',
    color: 'var(--pink)',
    fontWeight: 800,
    margin: '0 0 8px 0',
  },
  title: {
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '1.6rem',
    margin: '0',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '1rem',
    color: 'var(--text-muted)',
    marginBottom: '6px',
  },

  error: {
    color: 'var(--red)',
    fontSize: '0.95rem',
    textAlign: 'center',
  },
  btnContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '4px',
  },
  backBtn: {
    background: 'var(--border)',
    color: 'var(--text)',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
  },
  pinSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '10px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--dark)',
    color: 'white',
    fontSize: '1rem',
  },
  pinBtn: {
    background: 'var(--purple)',
    color: 'white',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    border: 'none',
  },
  divider: {
    textAlign: 'center',
    margin: '10px 0',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
};