import { cn } from '../../lib/utils';

function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-primary-200 shadow-card transition-all duration-200',
        'hover:shadow-card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-primary-900', className)} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-primary-500', className)} {...props}>
      {children}
    </p>
  );
}

function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
