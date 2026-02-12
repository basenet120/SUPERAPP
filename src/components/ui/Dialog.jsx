import React, { useState } from 'react';

export function Dialog({ children, open, onOpenChange }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function DialogHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
}

export function DialogDescription({ children, className = '' }) {
  return <p className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</p>;
}

export function DialogFooter({ children, className = '' }) {
  return <div className={`flex justify-end gap-2 mt-6 ${className}`}>{children}</div>;
}