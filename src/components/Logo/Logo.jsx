// src/components/Logo/Logo.jsx
import React from 'react';

function Logo({ className = "h-8 w-8" }) {
  return (
    <img 
      src="/logo.png"
      alt="Studiora Logo"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

export default Logo;