// src/pages/Cashier.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDrinks, fetchAddons, placeOrder } from '../api/api';

export default function Cashier() {
  const navigate  = useNavigate();
  const employee  = JSON.parse(sessionStorage.getItem('employee') || 'null');

  const [drinks,  setDrinks]  = useState([]);
  const [addons,  setAddons]  = useState([]);
  const [cart,    setCart]    = useState([]);
  const [modal,   setModal]   = useState(null);   // drink being customized
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!employee || employee.role !== 'Cashier') {
      navigate('/login');
      return;
    }
    fetchDrinks().then(setDrinks);
    fetchAddons().then(setAddons);
  }, []);

  const openCustomize = (drink) => {
    setModal(drink);
    setSelectedAddons([]);
  };

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.menu_item_id === addon.menu_item_id)
        ? prev.filter((a) => a.menu_item_id !== addon.menu_item_id)
        : [...prev, addon]
    );
  };

  const addToCart = () => {
    const addonTotal = selectedAddons.reduce((s, a) => s + parseFloat(a.base_price), 0);
    setCart((prev) => [...prev, {
      ...modal,
      sale_price: parseFloat(modal.base_price) + addonTotal,
      addons: selectedAddons,
    }]);
    setModal(null);
  };

  const removeFromCart = (index) => setCart((prev) => prev.filter((_, i) => i !== index));

  const total = cart.reduce((s, i) => s + parseFloat(i.sale_price), 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    try {
      const items = cart.map((item) => ({
        menu_item_id: item.menu_item_id,
        sale_price: item.sale_price,
        quantity: 1,
        addons: item.addons.map((a) => ({ add_on_menu_item_id: a.menu_item_id, quantity: 1 })),
      }));
      const res = await placeOrder(employee.employee_id, items);
      setMessage(`✅ Order #${res.order_id} placed!`);
      setCart([]);
    } catch {
      setMessage('❌ Order failed. Please try again.');
    }
  };

  return (
    <div style={styles.layout}>
      {/* Left: Drink grid */}
      <div style={styles.menu}>
        <div style={styles.header}>
          <span>🧋 Fade Boba — Cashier: {employee?.first_name}</span>
        </div>
        <div style={styles.grid}>
          {drinks.map((d) => (
            <button key={d.menu_item_id} style={styles.drinkBtn} onClick={() => openCustomize(d)}>
              <span style={styles.drinkName}>{d.item_name}</span>
              <span style={styles.drinkPrice}>${parseFloat(d.base_price).toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div style={styles.cart}>
        <h2 style={styles.cartTitle}>Current Order</h2>

        <div style={styles.cartItems}>
          {cart.length === 0 && <p style={styles.empty}>No items yet</p>}
          {cart.map((item, i) => (
            <div key={i} style={styles.cartItem}>
              <div>
                <div style={{ fontWeight: 600 }}>{item.item_name}</div>
                {item.addons.map((a) => (
                  <div key={a.menu_item_id} style={styles.addonLine}>+ {a.item_name}</div>
                ))}
              </div>
              <div style={styles.cartRight}>
                <span>${parseFloat(item.sale_price).toFixed(2)}</span>
                <button style={styles.removeBtn} onClick={() => removeFromCart(i)}>✕</button>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.totalRow}>
          <span>Total</span>
          <span style={{ color: 'var(--pink)', fontWeight: 800 }}>${total.toFixed(2)}</span>
        </div>

        {message && <p style={{ fontSize: '13px', color: 'var(--green)', textAlign: 'center' }}>{message}</p>}

        <button style={styles.checkoutBtn} onClick={checkout} disabled={cart.length === 0}>
          Checkout
        </button>
      </div>

      {/* Customize Modal */}
      {modal && (
        <div style={styles.overlay}>
          <div style={styles.modalBox}>
            <h3 style={{ marginBottom: '4px' }}>{modal.item_name}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Base: ${parseFloat(modal.base_price).toFixed(2)}
            </p>
            <p style={{ fontWeight: 600, marginBottom: '10px' }}>Add-ons:</p>
            <div style={styles.addonList}>
              {addons.map((a) => {
                const selected = !!selectedAddons.find((s) => s.menu_item_id === a.menu_item_id);
                return (
                  <button
                    key={a.menu_item_id}
                    style={{ ...styles.addonBtn, background: selected ? 'var(--purple)' : 'var(--border)' }}
                    onClick={() => toggleAddon(a)}
                  >
                    {a.item_name} +${parseFloat(a.base_price).toFixed(2)}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button style={{ ...styles.checkoutBtn, background: 'var(--border)' }} onClick={() => setModal(null)}>Cancel</button>
              <button style={styles.checkoutBtn} onClick={addToCart}>Add to Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  layout:      { display: 'flex', height: '100vh', background: 'var(--dark)' },
  menu:        { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header:      { padding: '16px 24px', background: 'var(--dark-card)', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '18px' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '20px', overflowY: 'auto' },
  drinkBtn:    { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer', textAlign: 'left' },
  drinkName:   { fontWeight: 600, color: 'var(--text)', fontSize: '14px' },
  drinkPrice:  { color: 'var(--pink)', fontWeight: 700 },
  cart:        { width: '300px', background: 'var(--dark-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px', gap: '12px' },
  cartTitle:   { fontWeight: 700, fontSize: '18px' },
  cartItems:   { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  empty:       { color: 'var(--text-muted)', fontSize: '13px' },
  cartItem:    { background: 'var(--dark)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  addonLine:   { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' },
  cartRight:   { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  removeBtn:   { background: 'var(--red)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' },
  totalRow:    { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '12px' },
  checkoutBtn: { background: 'var(--purple)', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', width: '100%' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99 },
  modalBox:    { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '380px' },
  addonList:   { display: 'flex', flexDirection: 'column', gap: '8px' },
  addonBtn:    { border: 'none', borderRadius: '8px', padding: '10px 14px', color: 'white', cursor: 'pointer', textAlign: 'left', fontWeight: 600 },
};
