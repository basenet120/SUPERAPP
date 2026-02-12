import { cn } from '../../lib/utils';

const badgeVariants = {
  variant: {
    default: 'bg-brand-100 text-brand-700 border-brand-200',
    secondary: 'bg-primary-100 text-primary-700 border-primary-200',
    success: 'bg-success-100 text-success-700 border-success-200',
    warning: 'bg-warning-100 text-warning-700 border-warning-200',
    danger: 'bg-danger-100 text-danger-700 border-danger-200',
    outline: 'border border-primary-300 text-primary-700 bg-transparent',
  },
};

function Badge({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        badgeVariants.variant[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
