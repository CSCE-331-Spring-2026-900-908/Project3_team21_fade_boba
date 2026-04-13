// src/pages/Manager.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchOrders, fetchOrderSummary,
  fetchInventory, fetchLowStock,
  restockItem, updatePrice, fetchMenu,
} from '../api/api';

const TABS = ['Overview', 'Orders', 'Inventory', 'Menu Prices'];

export default function Manager() {
  const navigate  = useNavigate();
  const user      = JSON.parse(sessionStorage.getItem('user') || 'null');

  const [tab,       setTab]       = useState('Overview');
  const [summary,   setSummary]   = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [inventory, setInventory] = useState([]);
  const [lowStock,  setLowStock]  = useState([]);
  const [menu,      setMenu]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState('');

  const [restockTarget, setRestockTarget] = useState(null);
  const [restockAmt,    setRestockAmt]    = useState('');
  const [editPrice,     setEditPrice]     = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o, inv, low, m] = await Promise.all([
        fetchOrderSummary(),
        fetchOrders(),
        fetchInventory(),
        fetchLowStock(),
        fetchMenu(),
      ]);
      setSummary(Array.isArray(s)   ? s   : []);
      setOrders(Array.isArray(o)    ? o   : []);
      setInventory(Array.isArray(inv) ? inv : []);
      setLowStock(Array.isArray(low) ? low : []);
      setMenu(Array.isArray(m)      ? m   : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'Manager') {
      navigate('/login');
      return;
    }
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRevenue = summary.reduce((s, d) => s + parseFloat(d.revenue || 0), 0);
  const totalOrders  = summary.reduce((s, d) => s + parseInt(d.order_count || 0), 0);
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const today        = summary[summary.length - 1];
  const maxRev       = Math.max(...summary.map((d) => parseFloat(d.revenue || 0)), 1);

  const handleRestock = async () => {
    if (!restockTarget || !restockAmt || isNaN(restockAmt) || parseInt(restockAmt) <= 0) return;
    try {
      await restockItem(restockTarget.inventory_id, parseInt(restockAmt));
      showToast('✅ Restocked ' + restockTarget.item_name + ' by ' + restockAmt);
      setRestockTarget(null);
      setRestockAmt('');
      const [inv, low] = await Promise.all([fetchInventory(), fetchLowStock()]);
      setInventory(inv);
      setLowStock(low);
    } catch (e) {
      showToast('❌ Restock failed');
    }
  };

  const handlePriceUpdate = async (item) => {
    const newPrice = editPrice[item.menu_item_id];
    if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) return;
    try {
      await updatePrice(item.menu_item_id, parseFloat(newPrice));
      showToast('✅ Updated ' + item.item_name + ' to $' + parseFloat(newPrice).toFixed(2));
      setEditPrice((prev) => { const n = {...prev}; delete n[item.menu_item_id]; return n; });
      const m = await fetchMenu();
      setMenu(m);
    } catch (e) {
      showToast('❌ Price update failed');
    }
  };

  if (loading) return (
    <div style={S.center} aria-live="polite">
      <span style={{ fontSize: 40 }}>🧋</span>
      <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Loading dashboard…</p>
    </div>
  );

  return (
    <div style={S.page} role="main" id="main-content">
      {toast && <div style={S.toast} role="status" aria-live="polite">{toast}</div>}

      <header style={S.header}>
        <div>
          <h1 style={S.logo}>🧋 Fade Boba</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>
            Manager Dashboard — Welcome, {user?.first_name}
          </p>
        </div>
        <button
          style={S.logoutBtn}
          aria-label="Sign out"
          onClick={() => { sessionStorage.clear(); navigate('/login'); }}
        >
          Sign Out
        </button>
      </header>

      <nav style={S.tabBar} role="tablist" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            style={{ ...S.tabBtn, ...(tab === t ? S.tabActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === 'Overview' && (
        <section style={S.section} aria-label="Overview">
          <div style={S.metricGrid}>
            {[
              { label: '30-Day Revenue',  value: '$' + totalRevenue.toFixed(2),  color: 'var(--pink)' },
              { label: '30-Day Orders',   value: totalOrders,                    color: 'var(--purple-lt)' },
              { label: 'Avg Order Value', value: '$' + avgOrder.toFixed(2),      color: 'var(--green)' },
              { label: 'Low Stock Items', value: lowStock.length,                color: lowStock.length > 0 ? 'var(--red)' : 'var(--green)' },
              { label: "Today's Revenue", value: today ? '$' + parseFloat(today.revenue).toFixed(2) : '—', color: 'var(--pink)' },
              { label: "Today's Orders",  value: today ? today.order_count : '—', color: 'var(--purple-lt)' },
            ].map((m) => (
              <div key={m.label} style={S.metricCard} aria-label={m.label + ': ' + m.value}>
                <span style={{ ...S.metricVal, color: m.color }}>{m.value}</span>
                <span style={S.metricLabel}>{m.label}</span>
              </div>
            ))}
          </div>

          {lowStock.length > 0 && (
            <div style={S.alertBox} role="alert">
              <strong>⚠️ Low Stock Alert</strong>
              <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                {lowStock.map((i) => i.item_name).join(', ')} — go to Inventory tab to restock.
              </p>
            </div>
          )}

          <div style={S.card}>
            <h2 style={S.cardTitle}>📈 Revenue — Last 30 Days</h2>
            {summary.length === 0
              ? <p style={{ color: 'var(--text-muted)' }}>No data yet.</p>
              : (
                <div style={S.chartWrap} role="img" aria-label="Bar chart of daily revenue over last 30 days">
                  {summary.map((d) => {
                    const h = Math.max(4, (parseFloat(d.revenue) / maxRev) * 120);
                    return (
                      <div key={d.date} style={S.barCol} title={d.date + ': $' + parseFloat(d.revenue).toFixed(2)}>
                        <div style={{ ...S.bar, height: h }} />
                        <span style={S.barLabel}>{new Date(d.date).getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </section>
      )}

      {tab === 'Orders' && (
        <section style={S.section} aria-label="Orders">
          <div style={S.card}>
            <h2 style={S.cardTitle}>🧾 Recent Orders (last 50)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table aria-label="Recent orders">
                <thead>
                  <tr>
                    <th scope="col">Order #</th>
                    <th scope="col">Date / Time</th>
                    <th scope="col">Employee</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && (
                    <tr><td colSpan={4} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No orders found.</td></tr>
                  )}
                  {orders.map((o) => (
                    <tr key={o.order_id}>
                      <td>#{o.order_id}</td>
                      <td>{new Date(o.order_timestamp).toLocaleString()}</td>
                      <td>{o.employee_name}</td>
                      <td style={{ color: 'var(--pink)', fontWeight: 700 }}>${parseFloat(o.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...S.card, marginTop: 20 }}>
            <h2 style={S.cardTitle}>📊 Daily Sales Summary (X-Report)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table aria-label="Daily sales summary">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Orders</th>
                    <th scope="col">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {[...summary].reverse().map((d) => (
                    <tr key={d.date}>
                      <td>{new Date(d.date).toLocaleDateString()}</td>
                      <td>{d.order_count}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 700 }}>${parseFloat(d.revenue).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {tab === 'Inventory' && (
        <section style={S.section} aria-label="Inventory">
          <div style={S.card}>
            <h2 style={S.cardTitle}>📦 Inventory</h2>
            <div style={{ overflowX: 'auto' }}>
              <table aria-label="Inventory items">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">In Stock</th>
                    <th scope="col">Reorder At</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const low = item.quantity_in_stock <= item.reorder_level;
                    return (
                      <tr key={item.inventory_id}>
                        <td>{item.item_name}</td>
                        <td>{item.quantity_in_stock}</td>
                        <td>{item.reorder_level}</td>
                        <td>
                          <span className={low ? 'badge-low' : 'badge-ok'}>
                            {low ? '⚠️ Low' : '✅ OK'}
                          </span>
                        </td>
                        <td>
                          <button
                            style={S.actionBtn}
                            aria-label={'Restock ' + item.item_name}
                            onClick={() => { setRestockTarget(item); setRestockAmt(''); }}
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {tab === 'Menu Prices' && (
        <section style={S.section} aria-label="Menu prices">
          <div style={S.card}>
            <h2 style={S.cardTitle}>💲 Menu Item Prices</h2>
            <div style={{ overflowX: 'auto' }}>
              <table aria-label="Menu price editor">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Type</th>
                    <th scope="col">Current Price</th>
                    <th scope="col">New Price</th>
                    <th scope="col">Save</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.map((item) => (
                    <tr key={item.menu_item_id}>
                      <td>{item.item_name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.item_type}</td>
                      <td style={{ color: 'var(--pink)', fontWeight: 700 }}>${parseFloat(item.base_price).toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.25"
                          placeholder={parseFloat(item.base_price).toFixed(2)}
                          value={editPrice[item.menu_item_id] ?? ''}
                          aria-label={'New price for ' + item.item_name}
                          onChange={(e) => setEditPrice((prev) => ({ ...prev, [item.menu_item_id]: e.target.value }))}
                          style={{ width: 90 }}
                        />
                      </td>
                      <td>
                        <button
                          style={{ ...S.actionBtn, opacity: editPrice[item.menu_item_id] ? 1 : 0.4 }}
                          disabled={!editPrice[item.menu_item_id]}
                          aria-label={'Save price for ' + item.item_name}
                          onClick={() => handlePriceUpdate(item)}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {restockTarget && (
        <div style={S.overlay} role="dialog" aria-modal="true" aria-label={'Restock ' + restockTarget.item_name}>
          <div style={S.modal}>
            <h2 style={{ marginBottom: 8, fontSize: 20 }}>Restock — {restockTarget.item_name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Current stock: {restockTarget.quantity_in_stock} | Reorder level: {restockTarget.reorder_level}
            </p>
            <label htmlFor="restockQty" style={{ fontSize: 14, marginBottom: 6, display: 'block' }}>
              Amount to add:
            </label>
            <input
              id="restockQty"
              type="number"
              min="1"
              value={restockAmt}
              onChange={(e) => setRestockAmt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRestock()}
              style={{ marginBottom: 16 }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...S.actionBtn, flex: 1, background: 'var(--border)' }} onClick={() => setRestockTarget(null)}>Cancel</button>
              <button style={{ ...S.actionBtn, flex: 2 }} onClick={handleRestock}>Confirm Restock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page:        { minHeight: '100vh', background: 'var(--dark)', color: 'var(--text)' },
  center:      { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', background: 'var(--dark-card)', borderBottom: '1px solid var(--border)' },
  logo:        { fontSize: 26, fontWeight: 800, color: 'var(--pink)' },
  logoutBtn:   { background: 'var(--border)', color: 'var(--text)', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' },
  tabBar:      { display: 'flex', gap: 4, padding: '12px 28px', background: 'var(--dark-card)', borderBottom: '1px solid var(--border)' },
  tabBtn:      { background: 'none', border: 'none', color: 'var(--text-muted)', padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  tabActive:   { background: 'var(--purple)', color: 'white' },
  section:     { padding: '24px 28px', maxWidth: 1100, margin: '0 auto', width: '100%' },
  metricGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 20 },
  metricCard:  { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 },
  metricVal:   { fontSize: 28, fontWeight: 800 },
  metricLabel: { fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  alertBox:    { background: '#3D1A1A', border: '1px solid var(--red)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 },
  card:        { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' },
  cardTitle:   { fontSize: 18, fontWeight: 700, marginBottom: 16 },
  chartWrap:   { display: 'flex', alignItems: 'flex-end', gap: 4, height: 140, overflowX: 'auto', paddingBottom: 4 },
  barCol:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 18 },
  bar:         { width: 14, background: 'var(--purple)', borderRadius: '3px 3px 0 0' },
  barLabel:    { fontSize: 10, color: 'var(--text-muted)' },
  actionBtn:   { background: 'var(--purple)', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal:       { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 30, width: 360 },
  toast:       { position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 24px', fontWeight: 600, zIndex: 200, fontSize: 15 },
};