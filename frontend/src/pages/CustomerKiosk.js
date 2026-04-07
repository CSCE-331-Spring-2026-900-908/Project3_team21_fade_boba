// src/pages/CustomerKiosk.js
import React, { useState, useEffect } from 'react';
import { fetchDrinks, fetchAddons, placeOrder } from '../api/api';

const KIOSK_EMPLOYEE_ID = 1;

// Open-Meteo -College Station, TX based location.
const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=30.628&longitude=-96.3344&current_weather=true&temperature_unit=fahrenheit';

function getWeatherEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  return '⛈️';
}

function getDrinkSuggestion(tempF) {
  if (tempF >= 85) return 'Hot outside! Cool down with a Strawberry Slush or Taro Slush 🧊';
  if (tempF >= 70) return 'Nice weather! Try our Brown Sugar Boba or Matcha Latte 🧋';
  if (tempF >= 55) return 'A little cool — our Thai Milk Tea or Coffee Milk Tea will warm you up ☕';
  return 'Cold out there! Our Hot Matcha Latte or Classic Milk Tea is perfect 🍵';
}

export default function CustomerKiosk() {
  const [drinks,  setDrinks]  = useState([]);
  const [addons,  setAddons]  = useState([]);
  const [cart,    setCart]    = useState([]);
  const [modal,   setModal]   = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [iceLevel, setIceLevel] = useState('100%');
  const [sugarLevel, setSugarLevel] = useState('100%');
  const [screen,  setScreen]  = useState('menu');// 'menu' | 'cart' | 'confirm'
  const [orderId, setOrderId] = useState(null);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetchDrinks().then((data) => setDrinks(Array.isArray(data) ? data : []));
    fetchAddons().then((data) => setAddons(Array.isArray(data) ? data : []));

    // Fetch weather from Open-Meteo
    fetch(WEATHER_URL)
      .then((r) => r.json())
      .then((data) => {
        const { temperature, weathercode, windspeed } = data.current_weather;
        setWeather({ temp: Math.round(temperature), code: weathercode, wind: Math.round(windspeed) });
      })
      .catch(() => setWeather(null));
  }, []);

  const openDrink = (drink) => { 
    setModal(drink); 
    setSelectedAddons([]); 
    setIceLevel('100%');
    setSugarLevel('100%');
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
      ice: iceLevel,
      sugar: sugarLevel 
    }]);
    setModal(null);
  };

  const total = cart.reduce((s, i) => s + parseFloat(i.sale_price), 0);

  const submitOrder = async () => {
    const items = cart.map((item) => ({
      menu_item_id: item.menu_item_id,
      sale_price: item.sale_price,
      quantity: 1,
      ice: item.ice,
      sugar: item.sugar,
      addons: item.addons.map((a) => ({ add_on_menu_item_id: a.menu_item_id, quantity: 1 })),
    }));
    const res = await placeOrder(KIOSK_EMPLOYEE_ID, items);
    setOrderId(res.order_id);
    setCart([]);
    setScreen('confirm');
  };

  // Confirmation screen
  if (screen === 'confirm') {
    return (
      <div style={styles.confirmScreen}>
        <div style={styles.confirmBox}>
          <div style={{ fontSize: '64px' }}>🧋</div>
          <h1 style={{ fontSize: '32px', color: 'var(--green)' }}>Order Placed!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '18px' }}>Order #{orderId}</p>
          <p style={{ color: 'var(--text-muted)' }}>Please wait for your name to be called.</p>
          <button style={styles.bigBtn} onClick={() => setScreen('menu')}>Start New Order</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>🧋 Fade Boba</h1>

        {/* Weather widget */}
        {weather && (
          <div style={styles.weatherBox}>
            <span style={{ fontSize: '28px' }}>{getWeatherEmoji(weather.code)}</span>
            <div style={styles.weatherText}>
              <span style={styles.weatherTemp}>{weather.temp}°F</span>
              <span style={styles.weatherWind}>💨 {weather.wind} mph</span>
            </div>
          </div>
        )}

        <button style={styles.cartToggle} onClick={() => setScreen(screen === 'cart' ? 'menu' : 'cart')}>
          🛒 Cart ({cart.length})
        </button>
      </div>

      {/* Weather suggestion banner */}
      {weather && screen === 'menu' && (
        <div style={styles.suggestionBanner}>
          {getDrinkSuggestion(weather.temp)}
        </div>
      )}

      {/* Menu */}
      {screen === 'menu' && (
        <div style={styles.menuGrid}>
          {drinks.map((d) => (
            <button key={d.menu_item_id} style={styles.drinkCard} onClick={() => openDrink(d)}>
              <span style={styles.drinkEmoji}>🧋</span>
              <span style={styles.drinkName}>{d.item_name}</span>
              <span style={styles.drinkPrice}>${parseFloat(d.base_price).toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Cart view */}
      {screen === 'cart' && (
        <div style={styles.cartView}>
          <h2 style={{ marginBottom: '20px' }}>Your Order</h2>
          {cart.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Your cart is empty.</p>}
          {cart.map((item, i) => (
            <div key={i} style={styles.cartRow}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px' }}>{item.item_name}</div>
                <div style={{ color: 'var(--text-muted)' }}>Ice: {item.ice} | Sugar: {item.sugar}</div>
                {item.addons.map((a) => <div key={a.menu_item_id} style={{ color: 'var(--text-muted)' }}>+ {a.item_name}</div>)}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--pink)' }}>${parseFloat(item.sale_price).toFixed(2)}</span>
                <button style={styles.removeBtn} onClick={() => setCart((p) => p.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
          ))}
          {cart.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div style={styles.totalRow}>
                <span style={{ fontSize: '22px' }}>Total</span>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--pink)' }}>${total.toFixed(2)}</span>
              </div>
              <button style={styles.bigBtn} onClick={submitOrder}>Place Order</button>
            </div>
          )}
          <button style={{ ...styles.bigBtn, background: 'var(--border)', marginTop: '12px' }} onClick={() => setScreen('menu')}>
            ← Back to Menu
          </button>
        </div>
      )}

      {/* Addon modal */}
      {modal && (
        <div style={styles.overlay}>
          <div style={styles.modalBox}>
            <h2 style={{ marginBottom: '8px' }}>{modal.item_name}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '18px' }}>
              ${parseFloat(modal.base_price).toFixed(2)}
            </p>
            <p style={{ fontWeight: 700, marginBottom: '6px', fontSize: '16px' }}>Ice Level:</p>
            <div style={styles.levelGroup}>
              {['0%', '50%', '100%'].map(lvl => (
                <button key={'ice'+lvl} style={{...styles.levelBtn, background: iceLevel === lvl ? 'var(--blue)' : 'var(--border)'}} onClick={() => setIceLevel(lvl)}>{lvl}</button>
              ))}
            </div>

            <p style={{ fontWeight: 700, marginBottom: '6px', marginTop: '16px', fontSize: '16px' }}>Sugar Level:</p>
            <div style={styles.levelGroup}>
              {['0%', '50%', '100%'].map(lvl => (
                <button key={'sug'+lvl} style={{...styles.levelBtn, background: sugarLevel === lvl ? 'var(--pink)' : 'var(--border)'}} onClick={() => setSugarLevel(lvl)}>{lvl}</button>
              ))}
            </div>

            <p style={{ fontWeight: 700, marginBottom: '12px', marginTop: '16px', fontSize: '16px' }}>Add-ons:</p>
            <div style={styles.addonGrid}>
              {addons.map((a) => {
                const sel = !!selectedAddons.find((s) => s.menu_item_id === a.menu_item_id);
                return (
                  <button
                    key={a.menu_item_id}
                    style={{ ...styles.addonBtn, background: sel ? 'var(--purple)' : 'var(--border)' }}
                    onClick={() => toggleAddon(a)}
                  >
                    {a.item_name}<br />+${parseFloat(a.base_price).toFixed(2)}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button style={{ ...styles.bigBtn, flex: 1, background: 'var(--border)' }} onClick={() => setModal(null)}>Cancel</button>
              <button style={{ ...styles.bigBtn, flex: 2 }} onClick={addToCart}>Add to Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  layout:           { minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' },
  header:           { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', background: 'var(--dark-card)', borderBottom: '1px solid var(--border)' },
  logo:             { fontSize: '28px', fontWeight: 800, color: 'var(--pink)' },
  weatherBox:       { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--dark)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 16px' },
  weatherText:      { display: 'flex', flexDirection: 'column' },
  weatherTemp:      { fontWeight: 800, fontSize: '20px', color: 'var(--text)' },
  weatherWind:      { fontSize: '12px', color: 'var(--text-muted)' },
  suggestionBanner: { background: 'var(--purple)', color: 'white', padding: '12px 32px', fontSize: '16px', fontWeight: 600, textAlign: 'center' },
  cartToggle:       { background: 'var(--purple)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 24px', fontSize: '18px', fontWeight: 700, cursor: 'pointer' },
  menuGrid:         { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '32px' },
  drinkCard:        { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer', minHeight: '160px' },
  drinkEmoji:       { fontSize: '40px' },
  drinkName:        { fontWeight: 700, fontSize: '16px', textAlign: 'center' },
  drinkPrice:       { color: 'var(--pink)', fontWeight: 800, fontSize: '20px' },
  cartView:         { padding: '32px', maxWidth: '700px', margin: '0 auto', width: '100%' },
  cartRow:          { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  removeBtn:        { background: 'var(--red)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 600, cursor: 'pointer' },
  totalRow:         { display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--border)', marginBottom: '16px' },
  bigBtn:           { background: 'var(--purple)', color: 'white', border: 'none', borderRadius: '12px', padding: '18px', fontSize: '18px', fontWeight: 700, cursor: 'pointer', width: '100%' },
  confirmScreen:    { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' },
  confirmBox:       { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' },
  overlay:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99 },
  modalBox:         { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '36px', width: '480px' },
  levelGroup:       { display: 'flex', gap: '10px' },
  levelBtn:         { flex: 1, border: 'none', borderRadius: '10px', padding: '12px', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '16px' },
  addonGrid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '180px', overflowY: 'auto' },
  addonBtn:         { border: 'none', borderRadius: '10px', padding: '14px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
};