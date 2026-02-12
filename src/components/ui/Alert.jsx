import React from 'react';

export function Alert({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-900',
    destructive: 'bg-red-100 text-red-900',
    success: 'bg-green-100 text-green-900',
    warning: 'bg-yellow-100 text-yellow-900',
  };

  return (
    <div className={`p-4 rounded-lg ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function AlertTitle({ children, className = '' }) {
  return <h5 className={`font-medium mb-1 ${className}`}>{children}</h5>;
}

export function AlertDescription({ children, className = '' }) {
  return <p className={`text-sm ${className}`}>{children}</p>;
}