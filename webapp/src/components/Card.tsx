import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = ({ children, className, onClick }: CardProps) => {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "bg-dark-card rounded-2xl p-4 shadow-lg border border-slate-700/50",
        onClick && "cursor-pointer active:scale-98 transition-transform",
        className
      )}
    >
      {children}
    </div>
  );
};
