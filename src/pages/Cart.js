import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { Minus, Plus, Trash2 } from 'lucide-react';
import "./Cart.css";

const Cart = () => {
  const { cart, getCartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You must be logged in to place an order.");
      navigate("/login", { state: { from: "/cart" } });
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    try {
      const subtotal = getCartTotal();
      const tax = parseFloat((subtotal * 0.08).toFixed(2));
      const deliveryFee = 2.99;
      const total = parseFloat((subtotal + tax + deliveryFee).toFixed(2));

      const orderData = {
        orderItems: cart.map((item) => ({
          food: item._id,
          name: item.name,
          qty: item.quantity,
          price: item.price,
        })),
        user: currentUser._id,
        shippingAddress: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
        },
        paymentMethod: "credit-card",
        itemsPrice: subtotal,
        taxPrice: tax,
        shippingPrice: deliveryFee,
        totalPrice: total,
      };

      console.log("Sending order data:", orderData);
      
      const token = localStorage.getItem("token");
      console.log("Using token:", token ? "Token exists" : "No token found");

      const API_URL = process.env.REACT_APP_API_URL || "https://organic-food-backend.onrender.com/api";
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(orderData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response error:", errorText);
        throw new Error(errorText || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Order created successfully:", data);

      toast.success("✅ Order placed successfully!");
      clearCart();
      navigate("/order-success");
    } catch (error) {
      console.error("Order creation failed:", error);
      toast.error(error.message || "Failed to place order. Please try again.");
    }
  };

  const subtotal = getCartTotal();
  const tax = parseFloat((subtotal * 0.08).toFixed(2));
  const deliveryFee = 2.99;
  const total = parseFloat((subtotal + tax + deliveryFee).toFixed(2));

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1>Your Cart</h1>
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button onClick={() => navigate("/menu")} className="btn btn-primary">
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Your Cart</h1>
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item._id} className="cart-item">
                <div className="item-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="item-details">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-price">${item.price.toFixed(2)}</p>
                </div>
                <div className="quantity-controls">
                  <button 
                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                    className="quantity-btn"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                    className="quantity-btn"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button 
                  onClick={() => removeFromCart(item._id)}
                  className="remove-btn"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal ({cart.length} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={handleSubmit} className="btn btn-primary checkout-btn">
              Place Order
            </button>
            <button onClick={() => navigate('/menu')} className="btn btn-secondary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;