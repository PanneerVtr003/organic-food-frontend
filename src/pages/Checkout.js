import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin, Mail } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Checkout.css';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'credit-card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    sendEmailConfirmation: true
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || currentUser.username || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address?.street || currentUser.shippingAddress?.street || '',
        city: currentUser.address?.city || currentUser.shippingAddress?.city || '',
        state: currentUser.address?.state || currentUser.shippingAddress?.state || '',
        zipCode: currentUser.address?.zipCode || currentUser.shippingAddress?.zipCode || ''
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    if (name === 'cardNumber') {
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'expiryDate') {
      const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'cvv') {
      const formattedValue = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Your cart is empty!");
      navigate("/menu");
      return;
    }

    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      toast.error("Your session has expired. Please log in again.");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    setLoading(true);

    try {
      // Credit card validation
      if (formData.paymentMethod === "credit-card") {
        if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ""))) {
          throw new Error("Please enter a valid 16-digit card number");
        }
        if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
          throw new Error("Please enter a valid expiry date (MM/YY)");
        }
        if (!/^\d{3,4}$/.test(formData.cvv)) {
          throw new Error("Please enter a valid CVV (3-4 digits)");
        }
      }

      const orderData = {
        orderItems: cart.map(item => ({
          food: item._id || item.id,
          name: item.name,
          qty: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          street: formData.address, // backend expects "street"
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        paymentMethod: formData.paymentMethod,
        itemsPrice: getCartTotal(),
        taxPrice: parseFloat((getCartTotal() * 0.08).toFixed(2)),
        shippingPrice: 2.99,
        totalPrice: parseFloat((getCartTotal() + (getCartTotal() * 0.08) + 2.99).toFixed(2)),
        sendEmailConfirmation: formData.sendEmailConfirmation
      };

      console.log('📦 Sending order data:', orderData);

      const response = await fetch("https://organic-food-backend.onrender.com/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        clearCart(); // ✅ Ensure this exists in CartContext
        toast.success(
          `Order placed successfully!${
            formData.sendEmailConfirmation ? ` Confirmation sent to ${formData.email}` : ""
          }`
        );
        navigate("/order-success"); // ✅ Add this route in App.js
      } else {
        let errorMessage = data.message || data.error || `Error ${response.status}`;
        if (response.status === 401 || response.status === 403) {
          toast.error("Your session has expired. Please log in again.");
          navigate("/login", { state: { from: "/checkout" } });
        } else {
          throw new Error(errorMessage);
        }
      }

    } catch (err) {
      console.error("❌ Order error:", err);
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <h1>Checkout</h1>
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <button onClick={() => navigate('/menu')} className="btn btn-primary">
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const deliveryFee = 2.99;
  const tax = parseFloat((subtotal * 0.08).toFixed(2));
  const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        <div className="checkout-content">
          {/* Form */}
          <div className="checkout-form">
            <form onSubmit={handleSubmit}>
              {/* Delivery Info */}
              <div className="form-section">
                <div className="section-header">
                  <MapPin size={24} />
                  <h2>Delivery Information</h2>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Delivery Address *</label>
                  <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input type="text" id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code *</label>
                    <input type="text" id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-section">
                <div className="section-header">
                  <CreditCard size={24} />
                  <h2>Payment Method</h2>
                </div>
                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method *</label>
                  <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} required>
                    <option value="credit-card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>
                {formData.paymentMethod === 'credit-card' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="cardNumber">Card Number *</label>
                      <input type="text" id="cardNumber" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} placeholder="1234 5678 9012 3456" required maxLength="19" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="expiryDate">Expiry Date *</label>
                        <input type="text" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} placeholder="MM/YY" required maxLength="5" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cvv">CVV *</label>
                        <input type="text" id="cvv" name="cvv" value={formData.cvv} onChange={handleInputChange} placeholder="123" required maxLength="4" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Email Confirmation */}
              <div className="form-section">
                <div className="section-header">
                  <Mail size={24} />
                  <h2>Email Confirmation</h2>
                </div>
                <div className="form-group checkbox-group">
                  <label htmlFor="sendEmailConfirmation" className="checkbox-label">
                    <input type="checkbox" id="sendEmailConfirmation" name="sendEmailConfirmation" checked={formData.sendEmailConfirmation} onChange={handleInputChange} />
                    <span className="checkmark"></span>
                    Send order confirmation to my email
                  </label>
                  <p className="checkbox-help">
                    You'll receive a detailed receipt at <strong>{formData.email}</strong>
                  </p>
                </div>
              </div>

              <button type="submit" className="btn btn-primary checkout-btn" disabled={loading}>
                {loading ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-card">
              <div className="section-header">
                <Truck size={24} />
                <h2>Order Summary</h2>
              </div>
              <div className="order-items">
                {cart.map(item => (
                  <div key={item._id || item.id} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">x {item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-details">
                <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="summary-row"><span>Delivery Fee</span><span>${deliveryFee.toFixed(2)}</span></div>
                <div className="summary-row"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="summary-divider"></div>
                <div className="summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
