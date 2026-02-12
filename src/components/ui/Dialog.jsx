import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto animate-fade-in">
        {children}
      </div>
    </div>
  );
}

function DialogContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

function DialogHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 mb-6', className)} {...props}>
      {children}
    </div>
  );
}

function DialogTitle({ className, children, ...props }) {
  return (
    <h2 className={cn('text-xl font-semibold text-primary-900', className)} {...props}>
      {children}
    </h2>
  );
}

function DialogDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-primary-500', className)} {...props}>
      {children}
    </p>
  );
}

function DialogFooter({ className, children, ...props }) {
  return (
    <div className={cn('flex justify-end gap-3 mt-6 pt-6 border-t border-primary-200', className)} {...props}>
      {children}
    </div>
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
