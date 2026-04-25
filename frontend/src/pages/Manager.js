import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchLowStock, fetchOrders, fetchOrderSummary, fetchInventory, restockItem, fetchMenu, updatePrice } from '../api/api';
import { useNavigate } from 'react-router-dom';

// Employee API calls - add these to your api.js too
const BASE = 'https://project3-team21-fade-boba.onrender.com/api';
async function fetchEmployees() {
  const res = await fetch(`${BASE}/employees`); return res.json();
}
async function addEmployee(first_name, last_name, role) {
  const res = await fetch(`${BASE}/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ first_name, last_name, role }) });
  if (!res.ok) throw new Error('Failed to add employee'); return res.json();
}
async function updateEmployeeRole(employee_id, role) {
  const res = await fetch(`${BASE}/employees/${employee_id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
  if (!res.ok) throw new Error('Failed to update role'); return res.json();
}
async function deleteEmployee(employee_id) {
  const res = await fetch(`${BASE}/employees/${employee_id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete employee'); return res.json();
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const TABS = ['Overview', 'Orders', 'Inventory', 'Menu Prices', 'Employees'];

export default function Manager() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [summary, setSummary] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [inventory, setInventory] = useState([]);
  const [menu, setMenu] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [restockAmt, setRestockAmt] = useState({});
  const [newPrice, setNewPrice] = useState({});
  const [editMsg, setEditMsg] = useState('');

  // New employee form state
  const [newEmpFirst, setNewEmpFirst] = useState('');
  const [newEmpLast, setNewEmpLast]   = useState('');
  const [newEmpRole, setNewEmpRole]   = useState('Cashier');

  const user = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('user') || 'null'); }
    catch { return null; }
  }, []);

  const loadData = useCallback(async (announceRefresh = false) => {
    setLoading(true);
    setError('');
    try {
      const [summaryRows, orderRows, lowStockRows, inventoryRows, menuRows, employeeRows] = await Promise.all([
        fetchOrderSummary(), fetchOrders(), fetchLowStock(),
        fetchInventory(), fetchMenu(), fetchEmployees(),
      ]);
      setSummary(Array.isArray(summaryRows) ? summaryRows : []);
      setOrders(Array.isArray(orderRows) ? orderRows : []);
      setLowStock(Array.isArray(lowStockRows) ? lowStockRows : []);
      setInventory(Array.isArray(inventoryRows) ? inventoryRows : []);
      setMenu(Array.isArray(menuRows) ? menuRows : []);
      setEmployees(Array.isArray(employeeRows) ? employeeRows : []);
      const refreshedAt = new Date().toISOString();
      setLastUpdated(refreshedAt);
      if (announceRefresh) setAnnouncement(`Refreshed at ${formatTime(refreshedAt)}.`);
    } catch (loadError) {
      console.error(loadError);
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'Manager') { navigate('/login'); return; }
    loadData();
  }, [loadData, navigate, user]);

  const totalRevenue = summary.reduce((s, d) => s + parseFloat(d.revenue || 0), 0);
  const totalOrders  = summary.reduce((s, d) => s + parseInt(d.order_count || 0, 10), 0);
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const handleRestock = async (id) => {
    const amt = parseFloat(restockAmt[id]);
    if (!amt || amt <= 0) return;
    await restockItem(id, amt);
    setEditMsg('Restocked!');
    setRestockAmt((p) => ({ ...p, [id]: '' }));
    loadData();
  };

  const handlePriceUpdate = async (id) => {
    const price = parseFloat(newPrice[id]);
    if (!price || price <= 0) return;
    await updatePrice(id, price);
    setEditMsg('Price updated!');
    setNewPrice((p) => ({ ...p, [id]: '' }));
    loadData();
  };

  const handleAddEmployee = async () => {
    if (!newEmpFirst.trim() || !newEmpLast.trim()) return;
    try {
      await addEmployee(newEmpFirst.trim(), newEmpLast.trim(), newEmpRole);
      setEditMsg(`Added ${newEmpFirst} ${newEmpLast}!`);
      setNewEmpFirst(''); setNewEmpLast(''); setNewEmpRole('Cashier');
      loadData();
    } catch { setEditMsg('Failed to add employee.'); }
  };

  const handleRoleChange = async (employee_id, role) => {
    try {
      await updateEmployeeRole(employee_id, role);
      setEditMsg('Role updated!');
      loadData();
    } catch { setEditMsg('Failed to update role.'); }
  };

  const handleDeleteEmployee = async (employee_id, name) => {
    if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return;
    try {
      await deleteEmployee(employee_id);
      setEditMsg(`Removed ${name}.`);
      loadData();
    } catch { setEditMsg('Failed to delete employee.'); }
  };

  if (loading && !lastUpdated) {
    return (
      <main style={styles.centered} id="main-content" aria-live="polite">
        <div style={styles.loadingCard}>
          <h1 style={styles.logo}>🧋 Fade Boba</h1>
          <p style={styles.loadingText}>Loading manager dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page} id="main-content">
      <p className="sr-only" aria-live="polite">{announcement}</p>

      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>🧋 Fade Boba</h1>
          <p style={styles.subtitle}>Manager — {user?.first_name || 'Manager'}</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.secondaryButton} onClick={() => loadData(true)}>Refresh</button>
          <button style={styles.secondaryButton} onClick={() => navigate('/')}>Portal</button>
          <button style={styles.primaryButton} onClick={() => { sessionStorage.clear(); navigate('/login'); }}>Sign Out</button>
        </div>
      </header>

      <p style={styles.refreshStatus} aria-live="polite">
        {loading ? 'Refreshing…' : lastUpdated ? `Last updated at ${formatTime(lastUpdated)}.` : ''}
      </p>

      {error && <div style={styles.errorBanner} role="alert">{error}</div>}

      {/* Tab Bar */}
      <nav style={styles.tabBar} role="tablist" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <button
            key={t} role="tab" aria-selected={tab === t}
            style={{ ...styles.tabBtn, ...(tab === t ? styles.tabActive : {}) }}
            onClick={() => { setTab(t); setEditMsg(''); }}
          >
            {t}
            {t === 'Inventory' && lowStock.length > 0 && (
              <span style={styles.badge}>{lowStock.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Overview */}
      {tab === 'Overview' && (
        <section aria-label="Overview">
          <div style={styles.metricsGrid}>
            {[
              { label: '30-Day Revenue',  value: '$' + totalRevenue.toFixed(2) },
              { label: '30-Day Orders',   value: totalOrders },
              { label: 'Average Order',   value: '$' + avgOrder.toFixed(2) },
              { label: 'Low Stock Items', value: lowStock.length, red: lowStock.length > 0 },
              { label: 'Total Employees', value: employees.length },
            ].map((m) => (
              <div key={m.label} style={styles.metricCard}>
                <span style={{ ...styles.metricValue, color: m.red ? 'var(--red)' : 'var(--pink)' }}>{m.value}</span>
                <span style={styles.metricLabel}>{m.label}</span>
              </div>
            ))}
          </div>
          {lowStock.length > 0 && (
            <div style={styles.alertBox} role="alert">
              <strong>⚠️ Low Stock Alert</strong>
              <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                {lowStock.map((i) => i.item_name).join(', ')} — go to the Inventory tab to restock.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Orders */}
      {tab === 'Orders' && (
        <section aria-label="Orders">
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Daily Sales Summary (X-Report)</h2>
            {summary.length === 0 ? <p style={styles.emptyText}>No data yet.</p> : (
              <div style={styles.tableWrap}>
                <table aria-label="Daily sales summary">
                  <thead><tr><th scope="col">Date</th><th scope="col">Orders</th><th scope="col">Revenue</th></tr></thead>
                  <tbody>
                    {summary.slice().reverse().map((day) => (
                      <tr key={day.date}>
                        <td>{new Date(day.date).toLocaleDateString()}</td>
                        <td>{day.order_count}</td>
                        <td style={{ color: 'var(--green)', fontWeight: 700 }}>${parseFloat(day.revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div style={{ ...styles.card, marginTop: '20px' }}>
            <h2 style={styles.cardTitle}>Recent Orders</h2>
            {orders.length === 0 ? <p style={styles.emptyText}>No orders found.</p> : (
              <div style={styles.tableWrap}>
                <table aria-label="Recent orders">
                  <thead><tr><th scope="col">Order</th><th scope="col">Timestamp</th><th scope="col">Employee</th><th scope="col">Total</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.order_id}>
                        <td>#{o.order_id}</td>
                        <td>{new Date(o.order_timestamp).toLocaleString()}</td>
                        <td>{o.employee_name}</td>
                        <td style={{ color: 'var(--green)', fontWeight: 700 }}>${parseFloat(o.total_amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Inventory */}
      {tab === 'Inventory' && (
        <section aria-label="Inventory">
          <div style={styles.card}>
            <div style={styles.tabHeader}>
              <h2 style={styles.cardTitle}>Inventory Management</h2>
              {editMsg && <span style={styles.successMsg}>{editMsg}</span>}
            </div>
            {inventory.length === 0 ? <p style={styles.emptyText}>No inventory data found.</p> : (
              <div style={styles.tableWrap}>
                <table aria-label="Inventory management">
                  <thead>
                    <tr><th scope="col">Item</th><th scope="col">In Stock</th><th scope="col">Reorder Level</th><th scope="col">Status</th><th scope="col">Restock</th></tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const low = parseFloat(item.quantity_in_stock) <= parseFloat(item.reorder_level);
                      return (
                        <tr key={item.inventory_id}>
                          <td>{item.item_name}</td>
                          <td>{parseFloat(item.quantity_in_stock).toFixed(1)}</td>
                          <td>{parseFloat(item.reorder_level).toFixed(1)}</td>
                          <td><span className={low ? 'badge-low' : 'badge-ok'}>{low ? '⚠️ Low' : '✅ OK'}</span></td>
                          <td style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input type="number" style={{ width: '80px', padding: '6px', borderRadius: '6px' }}
                              placeholder="Qty" value={restockAmt[item.inventory_id] || ''}
                              onChange={(e) => setRestockAmt((p) => ({ ...p, [item.inventory_id]: e.target.value }))}
                              aria-label={`Restock amount for ${item.item_name}`}
                            />
                            <button style={{ ...styles.primaryButton, padding: '6px 12px', fontSize: '13px' }}
                              onClick={() => handleRestock(item.inventory_id)}>Add</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Menu Prices */}
      {tab === 'Menu Prices' && (
        <section aria-label="Menu prices">
          <div style={styles.card}>
            <div style={styles.tabHeader}>
              <h2 style={styles.cardTitle}>Menu Price Editor</h2>
              {editMsg && <span style={styles.successMsg}>{editMsg}</span>}
            </div>
            {menu.length === 0 ? <p style={styles.emptyText}>No menu data found.</p> : (
              <div style={styles.tableWrap}>
                <table aria-label="Menu price editor">
                  <thead>
                    <tr><th scope="col">Item</th><th scope="col">Type</th><th scope="col">Current Price</th><th scope="col">New Price</th><th scope="col"></th></tr>
                  </thead>
                  <tbody>
                    {menu.map((item) => (
                      <tr key={item.menu_item_id}>
                        <td>{item.item_name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.item_type}</td>
                        <td style={{ color: 'var(--pink)', fontWeight: 700 }}>${parseFloat(item.base_price).toFixed(2)}</td>
                        <td>
                          <input type="number" step="0.01" style={{ width: '90px', padding: '6px', borderRadius: '6px' }}
                            placeholder="New $" value={newPrice[item.menu_item_id] || ''}
                            onChange={(e) => setNewPrice((p) => ({ ...p, [item.menu_item_id]: e.target.value }))}
                            aria-label={`New price for ${item.item_name}`}
                          />
                        </td>
                        <td>
                          <button style={{ ...styles.primaryButton, padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => handlePriceUpdate(item.menu_item_id)}>Update</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Employees */}
      {tab === 'Employees' && (
        <section aria-label="Employee management">
          <div style={styles.card}>
            <div style={styles.tabHeader}>
              <h2 style={styles.cardTitle}>Employee Management</h2>
              {editMsg && <span style={styles.successMsg}>{editMsg}</span>}
            </div>

            {/* Add Employee Form */}
            <div style={styles.addEmpForm}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Add New Employee
              </h3>
              <div style={styles.addEmpRow}>
                <input
                  type="text" placeholder="First name" value={newEmpFirst}
                  onChange={(e) => setNewEmpFirst(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px' }}
                  aria-label="New employee first name"
                />
                <input
                  type="text" placeholder="Last name" value={newEmpLast}
                  onChange={(e) => setNewEmpLast(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px' }}
                  aria-label="New employee last name"
                />
                <select value={newEmpRole} onChange={(e) => setNewEmpRole(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px', background: 'var(--dark)' }}
                  aria-label="New employee role"
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                </select>
                <button style={{ ...styles.primaryButton, padding: '8px 18px' }} onClick={handleAddEmployee}>
                  Add Employee
                </button>
              </div>
            </div>

            {/* Employee Table */}
            {employees.length === 0 ? <p style={styles.emptyText}>No employees found.</p> : (
              <div style={styles.tableWrap}>
                <table aria-label="Employee management">
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Role</th>
                      <th scope="col">Change Role</th>
                      <th scope="col">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.employee_id}>
                        <td style={{ color: 'var(--text-muted)' }}>#{emp.employee_id}</td>
                        <td style={{ fontWeight: 600 }}>{emp.first_name} {emp.last_name}</td>
                        <td>
                          <span style={{
                            background: emp.role === 'Manager' ? 'var(--purple)' : 'var(--border)',
                            color: 'white', borderRadius: '99px', padding: '2px 10px', fontSize: '12px', fontWeight: 700
                          }}>
                            {emp.role}
                          </span>
                        </td>
                        <td>
                          <select
                            value={emp.role}
                            onChange={(e) => handleRoleChange(emp.employee_id, e.target.value)}
                            style={{ padding: '6px', borderRadius: '6px', background: 'var(--dark)', fontSize: '13px' }}
                            aria-label={`Change role for ${emp.first_name} ${emp.last_name}`}
                          >
                            <option value="Cashier">Cashier</option>
                            <option value="Manager">Manager</option>
                          </select>
                        </td>
                        <td>
                          <button
                            style={{ background: 'var(--red)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => handleDeleteEmployee(emp.employee_id, `${emp.first_name} ${emp.last_name}`)}
                            aria-label={`Remove ${emp.first_name} ${emp.last_name}`}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

const styles = {
  page:            { minHeight: '100vh', background: 'var(--dark)', color: 'var(--text)', padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' },
  centered:        { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)', padding: '24px' },
  loadingCard:     { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', textAlign: 'center' },
  loadingText:     { marginTop: '12px', color: 'var(--text-muted)' },
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' },
  headerActions:   { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  logo:            { fontSize: '2rem', color: 'var(--pink)', fontWeight: 800 },
  subtitle:        { marginTop: '6px', color: 'var(--text-muted)' },
  refreshStatus:   { color: 'var(--text-muted)', fontSize: '0.95rem' },
  primaryButton:   { background: 'var(--purple)', color: 'white' },
  secondaryButton: { background: 'var(--border)', color: 'var(--text)' },
  errorBanner:     { background: 'rgba(248, 113, 113, 0.14)', border: '1px solid var(--red)', color: 'var(--text)', borderRadius: '12px', padding: '12px 16px' },
  tabBar:          { display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' },
  tabBtn:          { background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--text-muted)', padding: '10px 20px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: '6px' },
  tabActive:       { background: 'var(--dark-card)', color: 'var(--text)', borderBottom: '2px solid var(--purple)' },
  badge:           { background: 'var(--red)', color: 'white', borderRadius: '99px', fontSize: '11px', fontWeight: 800, padding: '1px 7px' },
  metricsGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' },
  metricCard:      { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  metricValue:     { fontSize: '1.9rem', fontWeight: 800, color: 'var(--pink)' },
  metricLabel:     { color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  alertBox:        { background: '#3D1A1A', border: '1px solid var(--red)', borderRadius: '10px', padding: '14px 18px', marginTop: '16px' },
  card:            { background: 'var(--dark-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' },
  cardTitle:       { fontSize: '1.25rem', fontWeight: 700, marginBottom: '0' },
  tabHeader:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  successMsg:      { color: 'var(--green)', fontWeight: 600, fontSize: '14px' },
  tableWrap:       { overflowX: 'auto' },
  emptyText:       { color: 'var(--text-muted)' },
  addEmpForm:      { background: 'var(--dark)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '20px' },
  addEmpRow:       { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
};