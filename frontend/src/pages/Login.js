import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { verifyGoogleToken } from '../api/api';
import { loginEmployee } from '../api/api';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import {
  getContrastAnnouncement,
  getTextSizeAnnouncement,
  readAccessibilitySettings,
  updateAccessibilitySettings,
} from '../utils/accessibility';

export default function Login() {
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [accessibility, setAccessibility] = useState(() => readAccessibilitySettings());
  const navigate = useNavigate();
  const [pin, setPin] = useState('');

  const updateAccessibility = (updates) => {
    const next = updateAccessibilitySettings({ ...accessibility, ...updates });
    setAccessibility(next);

    if (updates.contrast) {
      setAnnouncement(getContrastAnnouncement(next.contrast));
    }
    if (updates.textSize) {
      setAnnouncement(getTextSizeAnnouncement(next.textSize));
    }
  };

  const handlePinLogin = async () => {
    if (!pin.trim()) return setError('Please enter a PIN.');
    setError('');

    try {
      // 1. Use the helper from your api.js
      const user = await loginEmployee(pin); 

      // 2. Store user data in sessionStorage
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('userType', 'employee');

      // 3. Route based on the role returned from the database
      if (user.role === 'Manager') {
        navigate('/manager');
      } else {
        navigate('/cashier');
      }
    } catch (err) {
      console.error(err);
      // This catches both "Invalid PIN" and "Server Error"
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
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div style={styles.wrapper}>
        <AccessibilityToolbar
          settings={accessibility}
          onContrastChange={(value) => updateAccessibility({ contrast: value })}
          onTextSizeChange={(value) => updateAccessibility({ textSize: value })}
        />

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

          <div style={styles.helpBox}>
            <p style={styles.helpTitle}>Keyboard and screen reader support</p>
            <p style={styles.helpText}>
              Use Tab to move through controls. Use the accessibility settings above for
              high contrast or larger text.
            </p>
          </div>

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
  },
  wrapper: {
    width: '100%',
    maxWidth: '720px',
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
  helpBox: {
    background: 'var(--surface-muted)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  helpTitle: {
    fontWeight: 700,
    marginBottom: '4px',
  },
  helpText: {
    color: 'var(--text-muted)',
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
  },

  pinBtn: {
    background: 'var(--purple)',
    color: 'white',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
  },

  divider: {
    textAlign: 'center',
    margin: '10px 0',
    color: 'var(--text-muted)',
  },
};