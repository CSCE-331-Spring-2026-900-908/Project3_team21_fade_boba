// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginEmployee } from '../api/api';

export default function Login() {
  const [empId, setEmpId]   = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!empId.trim()) return setError('Please enter your Employee ID.');
    setLoading(true);
    setError('');
    try {
      const emp = await loginEmployee(Number(empId));
      // Store employee info in sessionStorage so other pages can read it
      sessionStorage.setItem('employee', JSON.stringify(emp));

      if (emp.role === 'Manager') {
        navigate('/manager');
      } else {
        navigate('/cashier');
      }
    } catch {
      setError('Invalid Employee ID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.bg}>
      <div style={styles.box}>
        <h1 style={styles.logo}>🧋 Fade Boba</h1>
        <h2 style={styles.title}>Staff Login</h2>

        <label style={styles.label}>Employee ID</label>
        <input
          style={styles.input}
          type="number"
          value={empId}
          onChange={(e) => setEmpId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="Enter your ID..."
          autoFocus
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={styles.btn}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  bg:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' },
  box:   { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', width: '360px', display: 'flex', flexDirection: 'column', gap: '14px' },
  logo:  { fontSize: '32px', textAlign: 'center', color: 'var(--pink)', fontWeight: 800 },
  title: { textAlign: 'center', fontWeight: 700, fontSize: '20px' },
  label: { fontSize: '13px', color: 'var(--text-muted)' },
  input: { padding: '12px', fontSize: '16px' },
  error: { color: 'var(--red)', fontSize: '13px' },
  btn:   { background: 'var(--purple)', color: 'white', padding: '14px', fontSize: '16px', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer' },
};
