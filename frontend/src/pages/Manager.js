import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLowStock, fetchOrders, fetchOrderSummary } from '../api/api';

export default function Manager() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'Manager') {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [summaryRows, orderRows, lowStockRows] = await Promise.all([
          fetchOrderSummary(),
          fetchOrders(),
          fetchLowStock(),
        ]);

        setSummary(Array.isArray(summaryRows) ? summaryRows : []);
        setOrders(Array.isArray(orderRows) ? orderRows : []);
        setLowStock(Array.isArray(lowStockRows) ? lowStockRows : []);
      } catch (loadError) {
        console.error(loadError);
        setError('Unable to load manager dashboard data right now.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, user]);

  const totalRevenue = summary.reduce(
    (sum, day) => sum + parseFloat(day.revenue || 0),
    0
  );
  const totalOrders = summary.reduce(
    (sum, day) => sum + parseInt(day.order_count || 0, 10),
    0
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const handleSignOut = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  if (loading) {
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
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>🧋 Fade Boba</h1>
          <p style={styles.subtitle}>Manager overview for {user?.first_name || 'Manager'}</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.secondaryButton} onClick={() => navigate('/')}>
            Portal
          </button>
          <button style={styles.primaryButton} onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>

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
    marginBottom: '24px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  logo: {
    fontSize: '32px',
    color: 'var(--pink)',
    fontWeight: 800,
  },
  subtitle: {
    marginTop: '6px',
    color: 'var(--text-muted)',
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
    marginBottom: '20px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
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
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--pink)',
  },
  metricLabel: {
    color: 'var(--text-muted)',
    fontSize: '13px',
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
    fontSize: '20px',
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
    background: 'rgba(255,255,255,0.02)',
  },
  lowStockName: {
    fontWeight: 700,
  },
  lowStockMeta: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    marginTop: '4px',
  },
};