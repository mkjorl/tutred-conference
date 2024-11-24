import React, { useState, useEffect } from 'react';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  show?: boolean;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  position = 'top',
  show = true,
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative group">
      {children}
      {isVisible && (
        <div 
          className={`absolute ${positionClasses[position]} z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg whitespace-nowrap animate-fade-in`}
        >
          {content}
          <div 
            className={`absolute ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-900' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-l-gray-900' :
              'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
            } border-8 border-transparent`}
          />
        </div>
      )}
    </div>
  );
};