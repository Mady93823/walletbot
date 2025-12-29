import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { walletApi } from '../api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

export const Send = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; hash?: string; error?: string } | null>(null);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd ask for PIN here via a modal
      const res = await walletApi.sendTransaction(to, amount, '0000'); // Mock PIN
      if (res.data.success) {
        setResult({ success: true, hash: res.data.hash });
        setStep(3);
        WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (error: any) {
      setResult({ success: false, error: error.response?.data?.error || 'Transaction failed' });
      setStep(3);
      WebApp.HapticFeedback.notificationOccurred('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 min-h-screen flex flex-col pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Send ETH</h1>
      </div>

      {step === 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 flex-1"
        >
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Recipient Address</label>
            <input 
              type="text" 
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              className="w-full bg-dark-card border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Amount (ETH)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-dark-card border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-2xl font-bold"
            />
          </div>
          
          <div className="flex-1"></div>
          
          <Button 
            fullWidth 
            disabled={!to || !amount} 
            onClick={() => setStep(2)}
          >
            Review Transaction
          </Button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6 flex-1 flex flex-col"
        >
          <Card className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
              <span className="text-slate-400">Asset</span>
              <span className="font-semibold">Ethereum (ETH)</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
              <span className="text-slate-400">To</span>
              <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded max-w-[150px] truncate">{to}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
              <span className="text-slate-400">Network Fee</span>
              <span className="font-medium">~0.00042 ETH</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-400">Total Amount</span>
              <span className="text-2xl font-bold text-primary">{amount} ETH</span>
            </div>
          </Card>

          <div className="flex-1"></div>

          <Button 
            fullWidth 
            onClick={handleSend}
            disabled={isLoading}
            variant="primary"
          >
            {isLoading ? 'Sending...' : 'Confirm & Send'}
          </Button>
        </motion.div>
      )}

      {step === 3 && result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center space-y-6 text-center"
        >
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${result.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
            {result.success ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{result.success ? 'Transaction Sent!' : 'Failed'}</h2>
            <p className="text-slate-400 max-w-xs mx-auto">
              {result.success 
                ? 'Your transaction has been broadcast to the network.' 
                : result.error}
            </p>
          </div>

          {result.success && result.hash && (
             <div className="bg-dark-card p-3 rounded-xl border border-slate-700/50 max-w-full">
                <p className="text-xs text-slate-500 mb-1 uppercase">Transaction Hash</p>
                <p className="font-mono text-xs break-all">{result.hash}</p>
             </div>
          )}

          <div className="w-full pt-8">
            <Button fullWidth onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
