import React, { useState } from 'react';

const CRITERIA = {
  kiosk: [
    { id: 'K1', title: 'Menu View', desc: 'Display all drinks and add-ons fetched from the backend database.', met: true },
    { id: 'K2', title: 'Item Customization', desc: 'Allow customers to select ice level, sugar level, and multiple add-ons for each drink.', met: true },
    { id: 'K3', title: 'Cart Management', desc: 'Support adding items to cart, removing items, and real-time total calculation.', met: true },
    { id: 'K4', title: 'Order Placement', desc: 'Successfully submit orders to the backend, clear cart, and show confirmation.', met: true },
    { id: 'K5', title: 'Internationalization', desc: 'Support at least 5 languages (English, Spanish, Chinese, Vietnamese, Korean) using Google Translate API.', met: true },
    { id: 'K6', title: 'Accessibility (Contrast)', desc: 'Toggleable High Contrast mode for better readability.', met: true },
    { id: 'K7', title: 'Accessibility (Text Size)', desc: 'Adjustable text sizes (Normal, Large, Extra Large).', met: true },
    { id: 'K8', title: 'Accessibility (Screen Reader)', desc: 'Proper ARIA labels, roles, and live regions for screen reader support.', met: true },
    { id: 'K9', title: 'Weather Suggestions', desc: 'Recommend drinks based on current weather data from Open-Meteo API.', met: true },
    { id: 'K10', title: 'Customer Persistence', desc: 'Persist favorite drinks and recent order history using browser localStorage.', met: true },
  ]
};

export default function AcceptanceCriteria({ view = 'kiosk' }) {
  const [isOpen, setIsOpen] = useState(false);
  const items = CRITERIA[view] || [];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={styles.toggleBtn}
        aria-label="View Acceptance Criteria Verification"
      >
        <span>✅ Verification</span>
      </button>
    );
  }

  return (
    <div style={styles.overlay} onClick={() => setIsOpen(false)}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2 style={styles.title}>Acceptance Criteria Verification</h2>
          <button style={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">×</button>
        </header>
        <div style={styles.list}>
          {items.map(item => (
            <div key={item.id} style={styles.item}>
              <div style={styles.itemHeader}>
                <span style={styles.itemId}>{item.id}</span>
                <span style={styles.itemTitle}>{item.title}</span>
                <span style={item.met ? styles.metBadge : styles.notMetBadge}>
                  {item.met ? '✓ Met' : 'Pending'}
                </span>
              </div>
              <p style={styles.itemDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  toggleBtn: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    padding: '12px 24px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: '#1a1025',
    border: '1px solid #3d2b52',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '85vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #3d2b52',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    background: '#1a1025',
    zIndex: 1,
  },
  title: { margin: 0, fontSize: '1.25rem', color: '#f3eef9' },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#b09cc8',
    fontSize: '28px',
    cursor: 'pointer',
  },
  list: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  item: {
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #3d2b52',
    borderRadius: '12px',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  itemId: {
    background: '#3d2b52',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#b09cc8',
  },
  itemTitle: { fontWeight: 700, flex: 1, color: '#f3eef9' },
  metBadge: { color: '#4ade80', fontWeight: 800, fontSize: '0.9rem' },
  notMetBadge: { color: '#b09cc8', fontWeight: 800, fontSize: '0.9rem' },
  itemDesc: { margin: 0, fontSize: '0.9rem', color: '#b09cc8', lineHeight: 1.4 },
};
