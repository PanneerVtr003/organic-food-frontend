import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, MapPin, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Checkout.css';

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // FIXED: Correct API URL without the /unit path
  const API_URL = (process.env.REACT_APP_API_URL || 'https://organic-food-backend.onrender.com/').replace(/\/$/, '');
  
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
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Pre-fill form with user data if available
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address?.street || '',
        city: currentUser.address?.city || '',
        state: currentUser.address?.state || '',
        zipCode: currentUser.address?.zipCode || '',
      }));
    }
  }, [currentUser]);

  // Format card number as user types
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] ;
    const parts = [];
    
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date as user types
  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (name === 'zipCode') {
      formattedValue = value.replace(/\D/g, '').substring(0, 5);
    } else if (name === 'phone') {
      formattedValue = value.replace(/\D/g, '').substring(0, 15);
    }
    
    setFormData({
      ...formData,
      [name]: formattedValue,
    });

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required';
    else if (formData.zipCode.length < 5) errors.zipCode = 'ZIP code must be 5 digits';
    
    if (formData.paymentMethod === 'credit-card') {
      if (!formData.cardNumber.trim()) errors.cardNumber = 'Card number is required';
      else if (formData.cardNumber.replace(/\s/g, '').length < 16) errors.cardNumber = 'Card number must be 16 digits';
      
      if (!formData.expiryDate.trim()) errors.expiryDate = 'Expiry date is required';
      else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.expiryDate)) errors.expiryDate = 'Invalid expiry date format (MM/YY)';
      
      if (!formData.cvv.trim()) errors.cvv = 'CVV is required';
      else if (formData.cvv.length < 3) errors.cvv = 'CVV must be 3-4 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to place an order.');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cart.map((item) => ({
          food: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        paymentMethod: formData.paymentMethod,
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      };

      // FIXED: Using the correct endpoint /api/orders instead of /unit/orders
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.warn('Non-JSON response:', text);
        data = { message: text || 'Unknown error occurred' };
      }

      if (response.ok) {
        clearCart();
        toast.success('Order placed successfully!');
        navigate('/order-confirmation', { state: { order: data } });
      } else {
        toast.error(data.message || `Failed to place order. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please check your connection and try again.');
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
            <button
              onClick={() => navigate('/menu')}
              className="btn btn-primary"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const deliveryFee = 2.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        <div className="checkout-content">
          {/* Checkout Form */}
          <div className="checkout-form">
            <form onSubmit={handleSubmit}>
              {/* Delivery Information */}
              <div className="form-section">
                <div className="section-header">
                  <MapPin size={24} />
                  <h2>Delivery Information</h2>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={formErrors.name ? 'error' : ''}
                      required
                    />
                    {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={formErrors.email ? 'error' : ''}
                      required
                    />
                    {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={formErrors.phone ? 'error' : ''}
                    required
                    placeholder="+1 (555) 123-4567"
                  />
                  {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="address">Delivery Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={formErrors.address ? 'error' : ''}
                    required
                    placeholder="123 Main St"
                  />
                  {formErrors.address && <span className="error-text">{formErrors.address}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={formErrors.city ? 'error' : ''}
                      required
                      placeholder="New York"
                    />
                    {formErrors.city && <span className="error-text">{formErrors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={formErrors.state ? 'error' : ''}
                      required
                      placeholder="NY"
                    />
                    {formErrors.state && <span className="error-text">{formErrors.state}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={formErrors.zipCode ? 'error' : ''}
                      required
                      placeholder="10001"
                      maxLength="5"
                    />
                    {formErrors.zipCode && <span className="error-text">{formErrors.zipCode}</span>}
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
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="credit-card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Cash on Delivery</option>
                  </select>
                </div>
                {formData.paymentMethod === 'credit-card' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="cardNumber">Card Number *</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className={formErrors.cardNumber ? 'error' : ''}
                        placeholder="1234 5678 9012 3456"
                        required={formData.paymentMethod === 'credit-card'}
                        maxLength="19"
                      />
                      {formErrors.cardNumber && <span className="error-text">{formErrors.cardNumber}</span>}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="expiryDate">Expiry Date *</label>
                        <input
                          type="text"
                          id="expiryDate"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          className={formErrors.expiryDate ? 'error' : ''}
                          placeholder="MM/YY"
                          required={formData.paymentMethod === 'credit-card'}
                          maxLength="5"
                        />
                        {formErrors.expiryDate && <span className="error-text">{formErrors.expiryDate}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="cvv">CVV *</label>
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          className={formErrors.cvv ? 'error' : ''}
                          placeholder="123"
                          required={formData.paymentMethod === 'credit-card'}
                          maxLength="4"
                        />
                        {formErrors.cvv && <span className="error-text">{formErrors.cvv}</span>}
                      </div>
                    </div>
                    <div className="security-notice">
                      <Shield size={16} />
                      <span>Your payment details are encrypted and secure</span>
                    </div>
                  </>
                )}
                {formData.paymentMethod === 'paypal' && (
                  <div className="payment-notice">
                    <p>You will be redirected to PayPal to complete your payment</p>
                  </div>
                )}
                {formData.paymentMethod === 'cash' && (
                  <div className="payment-notice">
                    <p>Please have exact change ready for the delivery driver</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary checkout-btn"
                disabled={loading}
              >
                {loading
                  ? 'Processing...'
                  : `Place Order - $${total.toFixed(2)}`}
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
                {cart.map((item) => (
                  <div key={item._id} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">x {item.quantity}</span>
                    </div>
                    <span className="item-price">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="delivery-estimate">
                <p>Estimated delivery: 30-45 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;