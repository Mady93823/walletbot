import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { walletApi } from '../api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PinModal } from '../components/PinModal';
import { AssetSelectionModal } from '../components/AssetSelectionModal';
import { ContactsModal } from '../components/ContactsModal';
import { isValidAddress, truncateAddress } from '../utils/validation';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, 
  Wallet, Zap, FileText, AlertTriangle, 
  ScanLine, ChevronDown, History
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const FEE_OPTIONS = {
  low: { label: 'Slow', time: '~5 mins', value: 0.00021, price: '$0.54' },
  medium: { label: 'Average', time: '~2 mins', value: 0.00042, price: '$1.08' },
  high: { label: 'Fast', time: '~30 secs', value: 0.00084, price: '$2.16' }
};

export const Send = () => {
  const navigate = useNavigate();
  // Steps: 0 = Asset Selection, 1 = Input, 2 = Review, 3 = Result
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);

  // Form State
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [feeLevel, setFeeLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock assets for now - in real app, fetch from API
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    walletApi.getAssets().then(res => {
      setAssets(res.data.assets);
      // Don't auto-select, force user to choose (Requirement 2: "Implement a selection mechanism")
      // But if we have initial state passed (e.g. from AssetDetails), use it
      // For now, start at step 0 (Selection)
      setShowAssetModal(true);
    });
  }, []);

  const [result, setResult] = useState<{ success: boolean; hash?: string; error?: string } | null>(null);

  // Validation Logic
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!to) {
      newErrors.to = 'Recipient address is required';
    } else if (selectedAsset && !isValidAddress(to, selectedAsset.chain)) {
      newErrors.to = `Invalid ${selectedAsset.chain} address`;
    }

    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Invalid amount';
    } else if (selectedAsset && Number(amount) > selectedAsset.balance) {
      newErrors.amount = 'Insufficient balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReview = () => {
    if (validateForm()) {
      setStep(2);
    } else {
      WebApp.HapticFeedback.notificationOccurred('error');
    }
  };

  const handleScanQr = () => {
    if (WebApp.showScanQrPopup) {
      WebApp.showScanQrPopup({
        text: 'Scan Wallet Address'
      }, (text) => {
        if (text) {
          setTo(text);
          WebApp.closeScanQrPopup();
        }
        return true;
      });
    } else {
      alert('QR Scanner not available in this environment');
    }
  };

  const handleAssetSelect = (asset: any) => {
    setSelectedAsset(asset);
    setShowAssetModal(false);
    setStep(1);
  };

  const handleSend = async (pin: string) => {
    setShowPin(false);
    setIsLoading(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await walletApi.sendTransaction(to, amount, pin, memo, feeLevel, selectedAsset?.id);
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
    <div className="min-h-screen bg-[#0F172A] pb-24 text-white">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-20">
        <button 
          onClick={() => {
            if (step === 1) {
              setStep(0);
              setShowAssetModal(true);
            } else if (step === 0) {
              navigate('/');
            } else {
              setStep(step - 1);
            }
          }} 
          className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
          disabled={isLoading || step === 3}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">
          {step === 0 ? 'Select Asset' : step === 1 ? 'Send' : step === 2 ? 'Review' : 'Result'}
        </h1>
      </div>

      <div className="p-4">
        {/* Step 0: Asset Selection (Modal managed separately, but this step acts as placeholder) */}
        {step === 0 && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Choose Asset</h2>
              <p className="text-slate-400 text-sm">Select an asset to start sending</p>
            </div>
            <Button onClick={() => setShowAssetModal(true)}>
              Select Asset
            </Button>
          </div>
        )}

        {/* Step 1: Input */}
        {step === 1 && selectedAsset && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Selected Asset Header */}
            <div 
              onClick={() => setShowAssetModal(true)}
              className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img src={selectedAsset.logo_url} className="w-10 h-10 rounded-full bg-slate-900 p-1" />
                <div>
                  <p className="font-bold">{selectedAsset.name}</p>
                  <p className="text-xs text-slate-400">Balance: {selectedAsset.balance} {selectedAsset.symbol}</p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-500" />
            </div>

            {/* Recipient */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2"><Wallet className="w-3 h-3" /> Recipient Address</span>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {selectedAsset.chain} Network
                </span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    if (errors.to) setErrors({ ...errors, to: '' });
                  }}
                  placeholder={`Enter ${selectedAsset.chain} address...`}
                  className={`w-full bg-slate-800 border ${errors.to ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 pr-24 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <button 
                    onClick={() => setShowContactsModal(true)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Contacts"
                  >
                    <History className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleScanQr}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Scan QR"
                  >
                    <ScanLine className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {errors.to && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.to}</p>}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors({ ...errors, amount: '' });
                  }}
                  placeholder="0.00"
                  className={`w-full bg-slate-800 border ${errors.amount ? 'border-red-500' : 'border-slate-700'} rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors text-2xl font-bold`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">{selectedAsset.symbol}</span>
                  <button 
                    className="text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500/20"
                    onClick={() => setAmount(selectedAsset.balance.toString())}
                  >
                    MAX
                  </button>
                </div>
              </div>
              {errors.amount && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.amount}</p>}
            </div>

            {/* Fee Selection */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3 h-3" /> Network Fee
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(FEE_OPTIONS) as [keyof typeof FEE_OPTIONS, typeof FEE_OPTIONS['medium']][]).map(([key, option]) => (
                  <button
                    key={key}
                    onClick={() => setFeeLevel(key)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      feeLevel === key 
                        ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xs font-medium">{option.label}</span>
                    <span className="text-xs opacity-70">{option.time}</span>
                    <span className="text-xs font-bold">{option.value} ETH</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Memo */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3 h-3" /> Memo (Optional)
              </label>
              <input 
                type="text" 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Add a note..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <Button fullWidth onClick={handleReview} className="mt-4">
              Continue
            </Button>
          </motion.div>
        )}

        {/* Step 2: Review */}
        {step === 2 && selectedAsset && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="space-y-4 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Amount</span>
                <span className="text-xl font-bold">{amount} {selectedAsset.symbol}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Network Fee</span>
                <div className="text-right">
                  <p className="font-medium">{FEE_OPTIONS[feeLevel].value} ETH</p>
                  <p className="text-xs text-slate-500">{FEE_OPTIONS[feeLevel].label}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400 text-sm">Total Debit</span>
                <span className="text-xl font-bold text-blue-400">
                  {amount} {selectedAsset.symbol} + Fee
                </span>
              </div>
            </Card>

            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
              <div>
                <span className="text-xs text-slate-500 uppercase">To</span>
                <p className="font-mono text-sm break-all">{to}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase">Network</span>
                <p className="text-sm">{selectedAsset.chain}</p>
              </div>
              {memo && (
                <div>
                  <span className="text-xs text-slate-500 uppercase">Memo</span>
                  <p className="text-sm">{memo}</p>
                </div>
              )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Transactions are irreversible. Please double-check the recipient address ({truncateAddress(to)}) and amount before confirming.
              </p>
            </div>

            <Button 
              fullWidth 
              variant="primary"
              onClick={() => setShowPin(true)}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm & Send'}
            </Button>
          </motion.div>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-6 text-center py-8"
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${result.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
              {result.success ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{result.success ? 'Transaction Sent!' : 'Failed'}</h2>
              <p className="text-slate-400 max-w-xs mx-auto text-sm">
                {result.success 
                  ? 'Your transaction has been broadcast to the network successfully.' 
                  : result.error}
              </p>
            </div>

            {result.success && result.hash && (
              <div className="w-full space-y-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1 uppercase">Transaction Hash</p>
                  <p className="font-mono text-xs break-all text-blue-400">{result.hash}</p>
                </div>
                
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={() => {
                    if (result.hash && result.hash.startsWith('0x') && result.hash.length === 66) {
                      WebApp.openLink(`https://sepolia.etherscan.io/tx/${result.hash}`);
                    } else {
                      WebApp.showAlert('Transaction details unavailable in test mode');
                    }
                  }}
                >
                  View on Explorer
                </Button>
              </div>
            )}

            <div className="w-full pt-4 space-y-3">
              <Button fullWidth onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => {
                  setStep(0);
                  setTo('');
                  setAmount('');
                  setMemo('');
                  setResult(null);
                  setShowAssetModal(true);
                }}
              >
                Send Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Asset Selection Modal */}
      <AssetSelectionModal 
        isOpen={showAssetModal} 
        onClose={() => {
            if (step === 0 && !selectedAsset) {
                // If closing on initial step without selection, go back
                navigate('/');
            } else {
                setShowAssetModal(false);
            }
        }}
        onSelect={handleAssetSelect}
        assets={assets.filter(a => a.is_enabled)}
      />

      <ContactsModal 
        isOpen={showContactsModal} 
        onClose={() => setShowContactsModal(false)}
        onSelect={(address) => {
          setTo(address);
          setShowContactsModal(false);
        }}
      />

      {/* PIN Modal */}
      <PinModal 
        isOpen={showPin} 
        onClose={() => setShowPin(false)} 
        onConfirm={handleSend}
        title="Enter PIN to Confirm"
      />
    </div>
  );
};
