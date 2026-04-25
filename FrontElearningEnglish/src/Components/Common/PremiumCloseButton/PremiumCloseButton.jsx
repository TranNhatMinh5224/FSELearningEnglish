import React from 'react';
import './PremiumCloseButton.css';

/**
 * PremiumCloseButton - Reusable close button for modern modals
 * Optimized for headers with centered titles.
 * @param {Function} onClick - Close handler
 * @param {string} className - Additional classes
 * @param {string} variant - Button color variant
 */
const PremiumCloseButton = ({ onClick, className = '', variant = 'light' }) => {
  return (
    <button
      type="button"
      className={`premium-close-btn-standard ${variant === 'dark' ? 'premium-close-dark' : ''} ${className}`}
      onClick={onClick}
      aria-label="Close"
    >
      <span>&times;</span>
    </button>
  );
};

export default PremiumCloseButton;
