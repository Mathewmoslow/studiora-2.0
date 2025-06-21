// src/components/Logo/Logo.jsx
import React from 'react';

// Option 1: Using an image file
function Logo({ className = "h-8 w-8" }) {
  return (
    <img 
      src="/logo.svg" // or "/logo.png" - place in public folder
      alt="Studiora Logo"
      className={className}
    />
  );
}

// Option 2: Using inline SVG
function LogoSVG({ className = "h-8 w-8" }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Replace this with your actual SVG content */}
      <path 
        d="M16 2L2 9V23L16 30L30 23V9L16 2Z" 
        className="fill-blue-600"
      />
      <path 
        d="M16 8L8 12V20L16 24L24 20V12L16 8Z" 
        className="fill-purple-600"
      />
    </svg>
  );
}

// Option 3: Using an icon font or imported image
function LogoImage({ className = "h-8 w-8", darkMode = false }) {
  return (
    <div className={`${className} studiora-gradient rounded-lg flex items-center justify-center`}>
      <span className="text-white font-bold text-lg">S</span>
    </div>
  );
}

export default Logo;
export { LogoSVG, LogoImage };