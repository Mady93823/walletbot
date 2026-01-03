import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { walletApi } from '../api';
import WebApp from '@twa-dev/sdk';

interface Props {
  isOpen: boolean;
  onSuccess: () => void;
}

export const PinSetupModal = ({ isOpen, onSuccess }: Props) => {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNumberClick = (num: number) => {
    setError('');
    if (step === 'create') {
      if (pin.length < 4) setPin(prev => prev + num);
    } else {
      if (confirmPin.length < 4) {
        const newConfirm = confirmPin + num;
        setConfirmPin(newConfirm);
      }
    }
  };

  const handleDelete = () => {
    setError('');
    if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleNext = () => {
    if (pin.length !== 4) return;
    setStep('confirm');
    setConfirmPin('');
  };

  const handleConfirm = () => {
    if (confirmPin.length !== 4) return;
    
    if (confirmPin === pin) {
      submitPin(pin);
    } else {
      setError('PINs do not match. Try again.');
      setConfirmPin('');
      WebApp.HapticFeedback.notificationOccurred('error');
    }
  };

  const submitPin = async (finalPin: string) => {
    setIsLoading(true);
    try {
      await walletApi.setPin(finalPin);
      WebApp.HapticFeedback.notificationOccurred('success');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set PIN');
      WebApp.HapticFeedback.notificationOccurred('error');
      // Reset
      setStep('create');
      setPin('');
      setConfirmPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const currentInput = step === 'create' ? pin : confirmPin;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Full Screen Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-md"
          />

          {/* Modal Content - Centered & Responsive */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] flex flex-col items-center justify-center p-6 overflow-y-auto"
          >
            <div className="w-full max-w-[320px] flex flex-col items-center gap-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-blue-500/20">
                  <Lock className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {step === 'create' ? 'Create PIN' : 'Confirm PIN'}
                  </h2>
                  <p className="text-slate-400 text-sm mt-2 font-medium">
                    {step === 'create' 
                      ? 'Secure your wallet with a 4-digit code' 
                      : 'Please re-enter your PIN to confirm'}
                  </p>
                </div>
              </div>

              {/* Dots Display */}
              <div className="flex justify-center gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div 
                    key={i}
                    animate={{
                      scale: i < currentInput.length ? 1.1 : 1,
                      backgroundColor: i < currentInput.length ? '#3b82f6' : '#334155'
                    }}
                    className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-slate-950 ring-transparent transition-colors duration-200"
                  />
                ))}
              </div>

              {/* Error Message */}
              <div className="h-6 flex items-center justify-center w-full">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm font-medium flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                  </motion.div>
                )}
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    disabled={isLoading}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-2xl font-medium text-white transition-all active:scale-95 disabled:opacity-50 mx-auto flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handleNumberClick(0)}
                  disabled={isLoading}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-2xl font-medium text-white transition-all active:scale-95 disabled:opacity-50 mx-auto flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/30 transition-all active:scale-95 disabled:opacity-50 mx-auto focus:outline-none"
                >
                  <span className="text-xl">⌫</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="w-full pt-4">
                {step === 'create' ? (
                  <button
                    onClick={handleNext}
                    disabled={pin.length !== 4}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      pin.length === 4 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleConfirm}
                    disabled={confirmPin.length !== 4 || isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      confirmPin.length === 4 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Confirm & Set PIN
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
