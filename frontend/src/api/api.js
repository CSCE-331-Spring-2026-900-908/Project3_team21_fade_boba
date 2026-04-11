// src/api/api.js
// All backend calls go through here - easy to update the base URL

const BASE = 'https://project3-team21-fade-boba.onrender.com/api';

export async function fetchDrinks() {
  const res = await fetch(`${BASE}/menu/drinks`);
  return res.json();
}

export async function fetchAddons() {
  const res = await fetch(`${BASE}/menu/addons`);
  return res.json();
}

export async function fetchMenu() {
  const res = await fetch(`${BASE}/menu`);
  return res.json();
}

export async function loginEmployee(employee_id) {
  const res = await fetch(`${BASE}/employees/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id }),
  });
  if (!res.ok) throw new Error('Employee not found');
  return res.json();
}

export async function placeOrder(employee_id, items) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id, items }),
  });
  if (!res.ok) throw new Error('Order failed');
  return res.json();
}

export async function fetchOrders() {
  const res = await fetch(`${BASE}/orders`);
  return res.json();
}

export async function fetchOrderSummary() {
  const res = await fetch(`${BASE}/orders/summary`);
  return res.json();
}

export async function fetchInventory() {
  const res = await fetch(`${BASE}/inventory`);
  return res.json();
}

export async function fetchLowStock() {
  const res = await fetch(`${BASE}/inventory/low-stock`);
  return res.json();
}

export async function restockItem(inventory_id, amount) {
  const res = await fetch(`${BASE}/inventory/${inventory_id}/restock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  return res.json();
}

export async function updatePrice(menu_item_id, base_price) {
  const res = await fetch(`${BASE}/menu/${menu_item_id}/price`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_price }),
  });
  return res.json();
}

export const verifyGoogleToken = async (token) => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error verifying token:", error);
    throw error;
  }
};