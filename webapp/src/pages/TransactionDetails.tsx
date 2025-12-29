import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ExternalLink, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { walletApi } from '../api';
import { Card } from '../components/Card';
import { LoadingScreen } from '../components/LoadingScreen';
import WebApp from '@twa-dev/sdk';

export const TransactionDetails = () => {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const { data } = await walletApi.getHistory();
        const found = data.history.find((t: any) => t.hash === hash || t.tx_hash === hash);
        setTx(found);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTx();
  }, [hash]);

  const copyHash = () => {
      if (tx?.hash || tx?.tx_hash) {
          navigator.clipboard.writeText(tx.hash || tx.tx_hash);
          WebApp.showPopup({
              title: 'Copied',
              message: 'Transaction Hash copied',
              buttons: [{type: 'ok'}]
          });
      }
  };

  if (loading) return <LoadingScreen />;

  if (!tx) {
    return (
        <div className="p-4 min-h-screen">
             <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Transaction</h1>
            </div>
            <div className="text-center text-slate-500 mt-20">
                Transaction not found
            </div>
        </div>
    );
  }

  const isReceived = tx.type === 'Received';
  const isSuccess = tx.status === 'success';

  return (
    <div className="p-4 min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Details</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center mb-10"
      >
        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                isSuccess ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
            }`}
        >
            {isSuccess ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </motion.div>
        <h2 className={`text-2xl font-bold mb-1 ${isReceived ? 'text-emerald-500' : 'text-white'}`}>
            {isReceived ? '+' : '-'}{tx.amount} ETH
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isSuccess ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}>
            {isSuccess ? 'Success' : 'Failed'}
        </span>
      </motion.div>

      {/* Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4 space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Date</span>
                <span className="text-sm font-medium">
                    {new Date(tx.timestamp).toLocaleString()}
                </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Type</span>
                <span className="text-sm font-medium capitalize">{tx.type}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Network</span>
                <span className="text-sm font-medium">Sepolia Testnet</span>
            </div>

            <div className="pt-2">
                <span className="text-slate-400 text-sm block mb-1">Transaction Hash</span>
                <div className="flex items-center gap-2" onClick={copyHash}>
                    <p className="font-mono text-xs text-slate-300 break-all bg-slate-800 p-2 rounded cursor-pointer hover:bg-slate-700 transition-colors">
                        {tx.hash || tx.tx_hash}
                    </p>
                    <Copy className="w-4 h-4 text-slate-500 cursor-pointer" />
                </div>
            </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex justify-center"
      >
        <a 
            href={`https://sepolia.etherscan.io/tx/${tx.hash || tx.tx_hash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
            View on Etherscan <ExternalLink className="w-4 h-4" />
        </a>
      </motion.div>
    </div>
  );
};
