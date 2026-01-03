import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete } from 'lucide-react';
import { useState } from 'react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  title?: string;
}

export const PinModal = ({ isOpen, onClose, onConfirm, title = "Enter PIN" }: PinModalProps) => {
  const [pin, setPin] = useState('');

  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin.length === 4) {
      onConfirm(pin);
      setPin('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-[#1E293B] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border-t border-slate-700"
          >
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <div className="flex justify-center gap-4 mt-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      i < pin.length 
                        ? 'bg-blue-500 scale-110' 
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="h-16 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600/20 text-2xl font-semibold text-white transition-colors"
                >
                  {num}
                </button>
              ))}
              <div /> {/* Spacer */}
              <button
                onClick={() => handleNumberClick(0)}
                className="h-16 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600/20 text-2xl font-semibold text-white transition-colors"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="h-16 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-red-500/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={pin.length !== 4}
              className="w-full py-4 bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold text-lg transition-all active:scale-[0.98]"
            >
              Confirm
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
