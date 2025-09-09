// services/api.js
const API_BASE = process.env.REACT_APP_API_URL || 'https://organic-food-backend.onrender.com';

export const createOrder = async (orderData, token) => {
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};