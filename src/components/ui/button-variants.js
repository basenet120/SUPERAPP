import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
        destructive: 'bg-danger-600 text-white shadow-sm hover:bg-danger-700',
        outline: 'border border-primary-300 bg-white text-primary-700 hover:bg-primary-50',
        secondary: 'bg-primary-100 text-primary-900 hover:bg-primary-200',
        ghost: 'text-primary-600 hover:bg-primary-100',
        link: 'text-brand-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
