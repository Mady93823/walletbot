import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  isLoading,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";

  const variants = {
    primary: "bg-primary text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20",
    secondary: "bg-secondary text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20",
    outline: "border-2 border-slate-600 text-slate-200 hover:bg-slate-800",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50"
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};
