import { Home, Send, History, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Send, label: 'Send', path: '/send' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A]/90 backdrop-blur-xl border-t border-slate-800 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                "relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg",
                isActive ? "text-blue-500" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute -top-[1px] w-12 h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className={clsx("transition-transform duration-300", isActive && "-translate-y-0.5")}>
                <item.icon className={clsx("w-6 h-6", isActive && "fill-blue-500/20")} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              <span className={clsx(
                "text-[10px] font-medium transition-all duration-300",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
