import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Copy } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import WebApp from '@twa-dev/sdk';
import { walletApi } from '../api';
import { Skeleton } from '../components/SkeletonLoader';
import { getNetworkDisplayName } from '../utils/validation';

const TIME_PERIODS = ['1D', '1W', '1M', '1Y'];

// Mock data generator for graph
const generateData = (period: string, basePrice: number) => {
  const points = period === '1D' ? 24 : period === '1W' ? 7 : period === '1M' ? 30 : 12;
  const data = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * (basePrice * 0.05);
    currentPrice += change;
    data.push({
      time: i,
      price: currentPrice
    });
  }
  return data;
};

// Fallback prices if API doesn't provide them
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

export const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [period, setPeriod] = useState('1D');
  const [address, setAddress] = useState('');
  const [graphData, setGraphData] = useState<any[]>([]);
  const [asset, setAsset] = useState<any>(location.state?.asset || null);
  const [loading, setLoading] = useState(!asset);
  
  // Color mapping based on symbol (fallback)
  const getAssetColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'ETH': '#6366f1',
      'USDT': '#22c55e',
      'USDC': '#3b82f6',
      'BNB': '#f59e0b',
      'TRX': '#ef4444',
      'WBTC': '#f59e0b',
      'SOL': '#14b8a6',
      'MATIC': '#8b5cf6'
    };
    return colors[symbol] || '#6366f1';
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await walletApi.getUserMe();
        if (userRes.data.wallet) {
          setAddress(userRes.data.wallet.address);
        }

        if (!asset) {
          // Fetch assets if not passed in state
          const assetsRes = await walletApi.getAssets();
          const found = assetsRes.data.assets.find((a: any) => a.id === id);
          if (found) {
            setAsset(found);
          } else {
            // Asset not found, redirect or show error
            WebApp.showAlert('Asset not found');
            navigate('/');
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, asset, navigate]);

  useEffect(() => {
    if (asset) {
      const price = MOCK_PRICES[asset.symbol] || 0;
      setGraphData(generateData(period, price));
    }
  }, [period, asset]);

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
        alert('Address copied to clipboard');
      }
    } catch (e) {
       console.warn('WebApp.showPopup failed', e);
       alert('Address copied to clipboard');
    }
  };

  if (loading || !asset) {
    return (
      <div className="min-h-screen bg-[#0F172A] p-4 space-y-6">
         <Skeleton className="w-full h-12" />
         <Skeleton className="w-32 h-8" />
         <Skeleton className="w-full h-[250px]" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-lg">
          <p className="text-slate-400 text-xs">{label}</p>
          <p className="text-white font-medium">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const currentPrice = MOCK_PRICES[asset.symbol] || 0;
  const assetColor = getAssetColor(asset.symbol);

  return (
    <div className="min-h-screen bg-[#0F172A] pb-24 text-white">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-[#0F172A]/80 backdrop-blur-md z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
           <img src={asset.logo_url} className="w-6 h-6 rounded-full" onError={(e) => e.currentTarget.style.display = 'none'} />
           <h1 className="text-xl font-bold">{asset.name}</h1>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Price Header */}
        <div>
          <h2 className="text-3xl font-bold">${currentPrice.toLocaleString()}</h2>
          <p className="text-sm font-medium text-slate-400">
             Balance: {typeof asset.balance === 'number' ? asset.balance.toFixed(6) : parseFloat(asset.balance || '0').toFixed(6)} {asset.symbol}
          </p>
        </div>

        {/* Graph */}
        <div className="h-[250px] -mx-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={assetColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={assetColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={assetColor} 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Time Periods */}
        <div className="flex justify-between bg-slate-800/50 p-1 rounded-xl">
          {TIME_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                period === p ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="primary" onClick={() => navigate('/send', { state: { asset } })} className="flex items-center justify-center gap-2">
            <ArrowUpRight className="w-4 h-4" /> Send
          </Button>
          <Button variant="secondary" onClick={() => document.getElementById('receive-section')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center justify-center gap-2">
            <ArrowDownLeft className="w-4 h-4" /> Receive
          </Button>
        </div>

        {/* Receive Section */}
        <div id="receive-section" className="pt-4">
          <Card className="space-y-4">
            <h3 className="font-semibold text-lg">Receive {asset.symbol}</h3>
            <div className="bg-white p-4 rounded-xl w-fit mx-auto">
              {address ? (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${address}`} 
                  alt="Wallet QR" 
                  className="w-32 h-32"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-200 animate-pulse rounded-lg" />
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase">Your Address ({getNetworkDisplayName(asset.chain, asset.symbol)})</label>
              <div 
                onClick={copyAddress}
                className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between cursor-pointer active:bg-slate-800 transition-colors"
              >
                <span className="font-mono text-xs truncate mr-2 text-slate-300">
                  {address || 'Loading...'}
                </span>
                <Copy className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Send only {asset.name} ({asset.symbol}) on the <span className="font-semibold text-slate-400">{getNetworkDisplayName(asset.chain, asset.symbol)}</span> network to this address.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
