import { cn } from '../../lib/utils';
import { useState } from 'react';

function Tooltip({ children, content, side = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn(
          'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-primary-900 rounded shadow-lg whitespace-nowrap',
          sideClasses[side]
        )}>
          {content}
        </div>
      )}
    </div>
  );
}

export { Tooltip };
