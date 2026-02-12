import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function AvatarImage({ className, src, alt, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-brand-100 text-brand-700 font-medium',
        className
      )}
      {...props}
    >
      {children || <User className="h-5 w-5" />}
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
