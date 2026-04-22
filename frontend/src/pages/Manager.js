import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchLowStock, fetchOrders, fetchOrderSummary, fetchInventory, restockItem, fetchMenu, updatePrice } from '../api/api';
import { useNavigate } from 'react-router-dom';


function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Manager() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [inventory, setInventory] = useState([]);
  const [menu, setMenu] = useState([]);
  const [restockAmt, setRestockAmt] = useState({});
  const [newPrice, setNewPrice] = useState({});
  const [editMsg, setEditMsg] = useState('');

  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);



  const loadData = useCallback(
    async (announceRefresh = false) => {
      setLoading(true);
      setError('');

      try {
        const [summaryRows, orderRows, lowStockRows, inventoryRows, menuRows] = await Promise.all([
          fetchOrderSummary(),
          fetchOrders(),
          fetchLowStock(),
          fetchInventory(),
          fetchMenu(),
        ]);

        setSummary(Array.isArray(summaryRows) ? summaryRows : []);
        setOrders(Array.isArray(orderRows) ? orderRows : []);
        setLowStock(Array.isArray(lowStockRows) ? lowStockRows : []);
        setInventory(Array.isArray(inventoryRows) ? inventoryRows : []);
        setMenu(Array.isArray(menuRows) ? menuRows : []);

        const refreshedAt = new Date().toISOString();
        setLastUpdated(refreshedAt);
        if (announceRefresh) {
          setAnnouncement(`Manager dashboard refreshed at ${formatTime(refreshedAt)}.`);
        }
      } catch (loadError) {
        console.error(loadError);
        setError('Unable to load manager dashboard data right now.');
        setAnnouncement('Manager dashboard refresh failed.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!user || user.role !== 'Manager') {
      navigate('/login');
      return;
    }

    loadData();
  }, [loadData, navigate, user]);

  const totalRevenue = summary.reduce(
    (sum, day) => sum + parseFloat(day.revenue || 0),
    0
  );
  const totalOrders = summary.reduce(
    (sum, day) => sum + parseInt(day.order_count || 0, 10),
    0
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const handleRestock = async (id) => {
    const amt = parseFloat(restockAmt[id]);
    if (!amt || amt <= 0) return;
    await restockItem(id, amt);
    setEditMsg('Restocked successfully!');
    setRestockAmt((prev) => ({ ...prev, [id]: '' }));
    loadData();
  };

  const handlePriceUpdate = async (id) => {
    const price = parseFloat(newPrice[id]);
    if (!price || price <= 0) return;
    await updatePrice(id, price);
    setEditMsg('Price updated!');
    setNewPrice((prev) => ({ ...prev, [id]: '' }));
    loadData();
  };

  const handleSignOut = () => {
    sessionStorage.clear();
    navigate('/login');
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
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>🧋 Fade Boba</h1>
          <p style={styles.subtitle}>Manager overview for {user?.first_name || 'Manager'}</p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.secondaryButton}
            onClick={() => loadData(true)}
            aria-describedby="manager-refresh-status"
          >
            Refresh Dashboard
          </button>
          <button style={styles.secondaryButton} onClick={() => navigate('/')}>
            Portal
          </button>
          <button style={styles.primaryButton} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <p id="manager-refresh-status" style={styles.refreshStatus} aria-live="polite">
        {loading
          ? 'Refreshing dashboard data…'
          : lastUpdated
          ? `Last updated at ${formatTime(lastUpdated)}.`
          : 'Dashboard has not been refreshed yet.'}
      </p>

      {error && (
        <div style={styles.errorBanner} role="alert">
          {error}
        </div>
      )}



      <section style={styles.metricsGrid} aria-label="Manager summary metrics">
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>${totalRevenue.toFixed(2)}</span>
          <span style={styles.metricLabel}>30-Day Revenue</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>{totalOrders}</span>
          <span style={styles.metricLabel}>30-Day Orders</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>${averageOrderValue.toFixed(2)}</span>
          <span style={styles.metricLabel}>Average Order</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricValue}>{lowStock.length}</span>
          <span style={styles.metricLabel}>Low Stock Items</span>
        </div>
      </section>

      <section style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Daily Sales Summary</h2>
          {summary.length === 0 ? (
            <p style={styles.emptyText}>No sales summary data is available yet.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table aria-label="Daily sales summary">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Orders</th>
                    <th scope="col">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {summary
                    .slice()
                    .reverse()
                    .map((day) => (
                      <tr key={day.date}>
                        <td>{new Date(day.date).toLocaleDateString()}</td>
                        <td>{day.order_count}</td>
                        <td>${parseFloat(day.revenue || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p style={styles.emptyText}>All tracked inventory is above reorder levels.</p>
          ) : (
            <ul style={styles.lowStockList}>
              {lowStock.map((item) => (
                <li key={item.inventory_id} style={styles.lowStockItem}>
                  <div>
                    <div style={styles.lowStockName}>{item.item_name}</div>
                    <div style={styles.lowStockMeta}>
                      In stock: {item.quantity_in_stock} • Reorder level: {item.reorder_level}
                    </div>
                  </div>
                  <span className="badge-low">Low</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section style={{ ...styles.card, marginTop: '24px' }}>
        <h2 style={styles.cardTitle}>Recent Orders</h2>
        {orders.length === 0 ? (
          <p style={styles.emptyText}>No recent orders were found.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table aria-label="Recent orders">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Timestamp</th>
                  <th scope="col">Employee</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>
                    <td>{new Date(order.order_timestamp).toLocaleString()}</td>
                    <td>{order.employee_name}</td>
                    <td>${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section style={{ ...styles.card, marginTop: '24px' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
    <h2 style={styles.cardTitle}>Inventory Management</h2>
    {editMsg && <span style={{ color: 'var(--green)', fontWeight: 600 }}>{editMsg}</span>}
  </div>
  {inventory.length === 0 ? (
    <p style={styles.emptyText}>No inventory data found.</p>
  ) : (
    <div style={styles.tableWrap}>
      <table aria-label="Inventory management">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">In Stock</th>
            <th scope="col">Reorder Level</th>
            <th scope="col">Status</th>
            <th scope="col">Restock</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => {
            const low = parseFloat(item.quantity_in_stock) <= parseFloat(item.reorder_level);
            return (
              <tr key={item.inventory_id}>
                <td>{item.item_name}</td>
                <td>{parseFloat(item.quantity_in_stock).toFixed(1)}</td>
                <td>{parseFloat(item.reorder_level).toFixed(1)}</td>
                <td>
                  <span className={low ? 'badge-low' : 'badge-ok'}>
                    {low ? 'Low' : 'OK'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    style={{ width: '80px', padding: '6px', borderRadius: '6px' }}
                    placeholder="Qty"
                    value={restockAmt[item.inventory_id] || ''}
                    onChange={(e) => setRestockAmt((prev) => ({ ...prev, [item.inventory_id]: e.target.value }))}
                    aria-label={`Restock amount for ${item.item_name}`}
                  />
                  <button
                    style={{ ...styles.primaryButton, padding: '6px 12px', fontSize: '13px' }}
                    onClick={() => handleRestock(item.inventory_id)}
                  >
                    Add
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</section>
<section style={{ ...styles.card, marginTop: '24px' }}>
  <h2 style={styles.cardTitle}>Menu Price Editor</h2>
  {menu.length === 0 ? (
    <p style={styles.emptyText}>No menu data found.</p>
  ) : (
    <div style={styles.tableWrap}>
      <table aria-label="Menu price editor">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Type</th>
            <th scope="col">Current Price</th>
            <th scope="col">New Price</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          {menu.map((item) => (
            <tr key={item.menu_item_id}>
              <td>{item.item_name}</td>
              <td>{item.item_type}</td>
              <td>${parseFloat(item.base_price).toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  style={{ width: '90px', padding: '6px', borderRadius: '6px' }}
                  placeholder="New $"
                  value={newPrice[item.menu_item_id] || ''}
                  onChange={(e) => setNewPrice((prev) => ({ ...prev, [item.menu_item_id]: e.target.value }))}
                  aria-label={`New price for ${item.item_name}`}
                />
              </td>
              <td>
                <button
                  style={{ ...styles.primaryButton, padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => handlePriceUpdate(item.menu_item_id)}
                >
                  Update
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--dark)',
    color: 'var(--text)',
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  centered: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--dark)',
    padding: '24px',
  },
  loadingCard: {
    background: 'var(--dark-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: '12px',
    color: 'var(--text-muted)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  logo: {
    fontSize: '2rem',
    color: 'var(--pink)',
    fontWeight: 800,
  },
  subtitle: {
    marginTop: '6px',
    color: 'var(--text-muted)',
  },
  refreshStatus: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
  primaryButton: {
    background: 'var(--purple)',
    color: 'white',
  },
  secondaryButton: {
    background: 'var(--border)',
    color: 'var(--text)',
  },
  errorBanner: {
    background: 'rgba(248, 113, 113, 0.14)',
    border: '1px solid var(--red)',
    color: 'var(--text)',
    borderRadius: '12px',
    padding: '12px 16px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    background: 'var(--dark-card)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricValue: {
    fontSize: '1.9rem',
    fontWeight: 800,
    color: 'var(--pink)',
  },
  metricLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
    gap: '24px',
  },
  card: {
    background: 'var(--dark-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '16px',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  emptyText: {
    color: 'var(--text-muted)',
  },
  lowStockList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  lowStockItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    background: 'var(--surface-muted)',
  },
  lowStockName: {
    fontWeight: 700,
  },
  lowStockMeta: {
    color: 'var(--text-muted)',
    fontSize: '0.86rem',
    marginTop: '4px',
  },
};