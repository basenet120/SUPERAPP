import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-10 w-full appearance-none rounded-lg border border-primary-300 bg-white px-3 py-2 pr-8 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400 pointer-events-none" />
    </div>
  );
}

export { Select };
