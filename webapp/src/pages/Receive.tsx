import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { walletApi } from '../api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

export const Receive = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');

  useEffect(() => {
    walletApi.getUserMe().then(res => {
      if (res.data.wallet) setAddress(res.data.wallet.address);
    });
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    WebApp.showPopup({
      title: 'Copied',
      message: 'Address copied to clipboard',
      buttons: [{ type: 'ok' }]
    });
  };

  return (
    <div className="p-4 min-h-screen flex flex-col pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Receive ETH</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col items-center justify-center space-y-8 -mt-20"
      >
        <Card className="bg-white p-6 rounded-3xl w-64 h-64 flex items-center justify-center shadow-2xl shadow-blue-500/10">
            {address ? (
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`} 
                    alt="Wallet QR" 
                    className="w-full h-full object-contain"
                />
            ) : (
                <div className="w-full h-full bg-slate-200 animate-pulse rounded-xl"></div>
            )}
        </Card>

        <div className="text-center space-y-2">
            <p className="text-slate-400 text-sm">Your Address</p>
            <p className="font-mono text-sm bg-dark-card px-4 py-2 rounded-xl border border-slate-700/50 break-all max-w-[300px] text-center">
                {address || 'Loading...'}
            </p>
        </div>

        <div className="flex gap-4 w-full max-w-[300px]">
            <Button variant="secondary" className="flex-1" onClick={copyAddress}>
                <Copy className="w-4 h-4" /> Copy
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => WebApp.openTelegramLink(`https://t.me/share/url?url=${address}`)}>
                <Share2 className="w-4 h-4" /> Share
            </Button>
        </div>
      </motion.div>
    </div>
  );
};
