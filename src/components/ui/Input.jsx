import { cn } from '../../lib/utils';

function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-primary-300 bg-white px-3 py-2 text-sm',
        'placeholder:text-primary-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Input };
