// src/pages/Cashier.js
import React from 'react';

export default function Cashier() {
  return (
    <div style={styles.bg}>
      <div style={styles.box}>
        <h1 style={styles.logo}>🧋 Fade Boba</h1>
        <h2 style={styles.title}>Cashier POS</h2>
        <p style={styles.msg}>Coming in Sprint 2</p>
      </div>
    </div>
  );
}

const styles = {
  bg:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' },
  box:   { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px' },
  logo:  { fontSize: '32px', color: 'var(--pink)', fontWeight: 800 },
  title: { fontWeight: 700, fontSize: '20px' },
  msg:   { color: 'var(--text-muted)' },
};