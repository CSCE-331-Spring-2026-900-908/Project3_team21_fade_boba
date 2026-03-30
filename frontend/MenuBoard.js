// src/pages/MenuBoard.js
// Non-interactive large display - shows menu above the counter
import React, { useState, useEffect } from 'react';
import { fetchDrinks } from '../api/api';

export default function MenuBoard() {
  const [drinks, setDrinks] = useState([]);
  const [time,   setTime]   = useState(new Date());

  useEffect(() => {
    fetchDrinks().then(setDrinks);
    // Refresh time every minute
    const tick = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div style={styles.bg}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.logo}>🧋 Fade Boba</h1>
          <p style={styles.tagline}>Premium Bubble Tea</p>
        </div>
        <div style={styles.clock}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Menu grid */}
      <div style={styles.menuGrid}>
        {drinks.map((d) => (
          <div key={d.menu_item_id} style={styles.menuItem}>
            <span style={styles.itemEmoji}>🧋</span>
            <span style={styles.itemName}>{d.item_name}</span>
            <span style={styles.itemPrice}>${parseFloat(d.base_price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span>Customize your drink — ask for add-ons at the counter</span>
      </div>
    </div>
  );
}

const styles = {
  bg:       { minHeight: '100vh', background: '#0D0818', color: 'white', display: 'flex', flexDirection: 'column' },
  header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '2px solid #3D2B52' },
  logo:     { fontSize: '48px', fontWeight: 900, color: '#F472B6' },
  tagline:  { color: '#B09CC8', fontSize: '20px', marginTop: '4px' },
  clock:    { fontSize: '48px', fontWeight: 700, color: '#9B6FD0' },
  menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', flex: 1, padding: '32px 48px' },
  menuItem: { background: '#1A0F2E', border: '1px solid #3D2B52', borderRadius: '12px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' },
  itemEmoji:{ fontSize: '32px' },
  itemName: { fontWeight: 700, fontSize: '16px', color: 'white' },
  itemPrice:{ fontWeight: 900, fontSize: '22px', color: '#F472B6' },
  footer:   { padding: '16px 48px', background: '#6B3FA0', textAlign: 'center', fontSize: '18px', fontWeight: 600 },
};
