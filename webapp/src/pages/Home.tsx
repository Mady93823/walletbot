import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { walletApi } from '../api';
import { Card } from '../components/Card';
import { ArrowUpRight, ArrowDownLeft, Copy, ChevronDown, SlidersHorizontal, Wallet, History, Settings } from 'lucide-react';
import { Skeleton, SkeletonCard, SkeletonList } from '../components/SkeletonLoader';
import WebApp from '@twa-dev/sdk';
import { getNetworkDisplayName } from '../utils/validation';
import { PinSetupModal } from '../components/PinSetupModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const CURRENCIES = {
  USD: { symbol: '$', rate: 1, name: 'USD' },
  INR: { symbol: '₹', rate: 83.12, name: 'INR' },
  AED: { symbol: 'AED', rate: 3.67, name: 'AED' }
};

const MOCK_PRICES: Record<string, number> = {
  'ETH': 2600,
  'BTC': 43000,
  'USDT': 1,
  'USDC': 1,
  'BNB': 320,
  'TRX': 0.11,
  'WBTC': 43000,
  'SOL': 98,
  'MATIC': 0.85,
  'LINK': 15,
  'UNI': 6.5,
  'SHIB': 0.000009,
  'PEPE': 0.000001,
  'DAI': 1,
  'AAVE': 100,
  'LTC': 70,
  'DOGE': 0.08,
  'DOT': 7
};

export const Home = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<keyof typeof CURRENCIES>('USD');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [showPinSetup, setShowPinSetup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, assetsRes] = await Promise.allSettled([
            walletApi.getUserMe(),
            walletApi.getAssets().catch(() => ({ data: { assets: [] } }))
        ]);

        if (userRes.status === 'rejected') {
            throw userRes.reason;
        }

        const userData = userRes.value.data;

        if (!userData.wallet) {
          navigate('/onboarding');
          return;
        }

        // Check if user has PIN
        if (!userData.hasPin) {
          setShowPinSetup(true);
        }

        setAddress(userData.wallet.address);

        if (assetsRes.status === 'fulfilled' && (assetsRes.value as any).data?.assets) {
            setAssets((assetsRes.value as any).data.assets);
        }
      } catch (error: any) {
        console.error(error);
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
        try {
          if (WebApp.showAlert) {
             WebApp.showAlert(`Failed to load: ${errorMsg}`);
          } else {
             console.error('WebApp.showAlert not supported', errorMsg);
             // alert(`Failed to load: ${errorMsg}`); // Suppress alert for better UX on load
          }
        } catch (e) {
          console.warn('WebApp.showAlert failed', e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    try {
      if (WebApp.showPopup) {
        WebApp.showPopup({
          title: 'Copied',
          message: 'Address copied to clipboard',
          buttons: [{ type: 'ok' }]
        });
      } else {
        throw new Error('showPopup not available');
      }
    } catch (e) {
      console.warn('WebApp.showPopup failed', e);
      alert('Address copied to clipboard');
    }
  };

  const getTotalBalance = () => {
    // Calculate total balance from assets
    // Mock prices for demo purposes since we don't have a price feed yet
    let totalUSD = 0;
    
    assets.forEach(asset => {
      const price = MOCK_PRICES[asset.symbol] || 0;
      const balance = parseFloat(asset.balance?.toString() || '0');
      totalUSD += balance * price;
    });

    const converted = totalUSD * CURRENCIES[currency].rate;
    return converted.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  const getCurrencySymbol = () => CURRENCIES[currency].symbol;

  if (loading) {
    return (
      <div className="p-4 space-y-6 pb-24">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Skeleton className="w-8 h-8 rounded-full" />
             <Skeleton className="w-24 h-4" />
           </div>
           <Skeleton className="w-16 h-8 rounded-full" />
        </div>

        {/* Balance Card Skeleton */}
        <SkeletonCard />

        {/* Actions Skeleton */}
        <div className="grid grid-cols-4 gap-4">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="flex flex-col items-center gap-2">
               <Skeleton className="w-12 h-12 rounded-full" />
               <Skeleton className="w-10 h-3" />
             </div>
           ))}
        </div>

        {/* Assets Skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="w-20 h-6" />
            <Skeleton className="w-6 h-6" />
          </div>
          <SkeletonList />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-4 space-y-6 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo */}
      <motion.div variants={itemVariants} className="flex justify-center -mb-2">
        <img src={logo} alt="Wallet Logo" className="h-16 w-auto object-contain" />
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between relative z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {WebApp.initDataUnsafe?.user?.first_name?.[0] || 'U'}
          </div>
          <span className="font-semibold text-sm">
            Hi, {WebApp.initDataUnsafe?.user?.first_name || 'User'}
          </span>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <span>{currency}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showCurrencyDropdown && (
            <div className="absolute right-0 top-full mt-2 w-24 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
              {Object.keys(CURRENCIES).map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCurrency(c as keyof typeof CURRENCIES);
                    setShowCurrencyDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-700 transition-colors ${currency === c ? 'text-primary font-medium' : 'text-slate-400'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 border-none text-white relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-blue-100 font-medium mb-1">Total Balance</p>
              <h1 className="text-3xl font-bold">
                {getCurrencySymbol()} {getTotalBalance()}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-mono text-blue-200/80 truncate max-w-[200px]">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Create a wallet to start'}
                </p>
                {address && (
                  <button 
                    onClick={copyAddress}
                    className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-blue-200/80" />
                  </button>
                )}
              </div>
            </div>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-300" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/send')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 group-active:scale-95 transition-all">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-300">Send</span>
          </button>
          
          <button 
            onClick={() => navigate('/receive')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 group-active:scale-95 transition-all">
              <ArrowDownLeft className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-300">Receive</span>
          </button>

          <button 
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 group-active:scale-95 transition-all">
              <History className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-300">History</span>
          </button>

          <button 
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 group-active:scale-95 transition-all">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-300">Settings</span>
          </button>
        </div>
      </motion.div>

      {/* Assets List */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Assets</h2>
          <button onClick={() => navigate('/manage-crypto')} className="text-blue-400 p-1">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          {/* Render Enabled Assets */}
          {assets
            .filter(a => a.is_enabled)
            .sort((a, b) => {
              const balanceA = parseFloat(a.balance?.toString() || '0');
              const balanceB = parseFloat(b.balance?.toString() || '0');
              return balanceB - balanceA;
            })
            .map((asset) => (
            <motion.div 
              key={asset.id} 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/asset/${asset.id}`, { state: { asset } })}
              className="cursor-pointer"
            >
              <Card className="flex items-center justify-between p-4 bg-dark-card border-slate-700/50">
                <div className="flex items-center gap-3">
                  {asset.logo_url ? (
                    <img 
                      src={asset.logo_url} 
                      alt={asset.symbol} 
                      className="w-10 h-10 rounded-full bg-slate-800 p-1"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm p-1">
                      {asset.symbol[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{asset.name}</p>
                    <p className="text-xs text-slate-400">
                      {getNetworkDisplayName(asset.chain, asset.symbol)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-white">
                    {typeof asset.balance === 'number' ? asset.balance.toFixed(4) : parseFloat(asset.balance || '0').toFixed(4)} {asset.symbol}
                  </p>
                  {/* Value based on mock price */}
                  <p className="text-xs text-slate-400">
                    {getCurrencySymbol()} {(parseFloat(asset.balance?.toString() || '0') * (MOCK_PRICES[asset.symbol] || 0) * CURRENCIES[currency].rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
          
          {assets.filter(a => a.is_enabled).length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No assets enabled. Click the settings icon to add coins.
            </div>
          )}
        </div>
      </motion.div>
      
      <PinSetupModal 
        isOpen={showPinSetup} 
        onSuccess={() => setShowPinSetup(false)} 
      />
    </motion.div>
  );
};

