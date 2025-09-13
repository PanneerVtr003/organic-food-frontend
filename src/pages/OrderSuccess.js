import React from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderSuccess.css'; // optional, for styling

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="order-success-page">
      <div className="container">
        <h1>🎉 Order Placed Successfully!</h1>
        <p>Thank you for your purchase. Your order is being processed.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;
