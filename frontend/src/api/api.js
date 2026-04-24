// src/api/api.js
// All backend calls go through here - easy to update the base URL

const BASE = process.env.REACT_APP_API_URL || 'https://project3-team21-fade-boba.onrender.com/api';

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

export async function loginEmployee(pin) {
  const res = await fetch(`${BASE}/auth/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }), // Sending "0001" instead of the ID
  });

  if (!res.ok) throw new Error('Server error during login');
  
  const data = await res.json();
  if (!data.success) throw new Error('Invalid PIN');
  
  return data.user; // Returns the employee object (id, name, role)
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

export async function createMenuItem(item) {
  const res = await fetch(`${BASE}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function updateMenuItem(id, item) {
  const res = await fetch(`${BASE}/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return res.json();
}

export async function deleteMenuItem(id) {
  const res = await fetch(`${BASE}/menu/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function translateTexts(texts, target) {
  const res = await fetch(`${BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, target }),
  });

  if (!res.ok) return texts;

  const data = await res.json();
  return data.translations || texts;
}

export const verifyGoogleToken = async (token) => {
  try {
    const response = await fetch(`${BASE}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
};

export async function sendChatbotMessage(message, history) {
  const res = await fetch(`${BASE}/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error('Chatbot request failed');
  return res.json();
}