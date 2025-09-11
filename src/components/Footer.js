import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Organic Food Store</h3>
          <p>Fresh, organic food delivered to your doorstep.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            {/* Replace # with actual paths */}
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Legal</h4>
          <ul>
            {/* Replace # with actual paths */}
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/refund">Refund Policy</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Connect With Us</h4>
          <div className="social-links">
            {/* Use actual social media URLs */}
            <a href="https://facebook.com/yourpage" target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
            <a href="https://twitter.com/yourpage" target="_blank" rel="noopener noreferrer">
              Twitter
            </a>
            <a href="https://instagram.com/yourpage" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Organic Food Store. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;