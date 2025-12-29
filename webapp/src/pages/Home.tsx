import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { walletApi } from '../api';
import { Card } from '../components/Card';
import { ArrowUpRight, ArrowDownLeft, Copy } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import WebApp from '@twa-dev/sdk';

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

export const Home = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<string>('0.00');
  const [address, setAddress] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, historyRes] = await Promise.all([
            walletApi.getUserMe(),
            walletApi.getHistory()
        ]);

        if (userRes.data.wallet) {
          setBalance(userRes.data.balance);
          setAddress(userRes.data.wallet.address);
        }

        if (historyRes.data.history) {
            setHistory(historyRes.data.history);
        }

      } catch (error: any) {
        console.error(error);
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
        WebApp.showAlert(`Failed to load: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    WebApp.showPopup({
      title: 'Copied',
      message: 'Address copied to clipboard',
      buttons: [{ type: 'ok' }]
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <motion.div 
      className="p-4 space-y-6 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {WebApp.initDataUnsafe?.user?.first_name?.[0] || 'U'}
          </div>
          <span className="font-semibold text-sm">
            Hi, {WebApp.initDataUnsafe?.user?.first_name || 'User'}
          </span>
        </div>
        <div className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
          Sepolia Testnet
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/20 transform transition-transform hover:scale-[1.02]">
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">Total Balance</p>
            <h1 className="text-4xl font-bold mb-6">{balance} <span className="text-xl font-normal opacity-80">ETH</span></h1>
            
            <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm cursor-pointer active:bg-white/20 transition-colors" onClick={copyAddress}>
              <span className="text-xs font-mono opacity-90 truncate max-w-[120px]">
                {address}
              </span>
              <Copy className="w-3 h-3 opacity-70" />
            </div>
          </div>
          
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 rounded-full bg-black/10 blur-2xl"></div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <Card onClick={() => navigate('/send')} className="flex flex-col items-center justify-center py-6 gap-2 bg-dark-card border-slate-700/50 hover:bg-slate-800/80 transition-colors">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-1">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <span className="font-medium text-sm">Send</span>
        </Card>
        <Card onClick={() => navigate('/receive')} className="flex flex-col items-center justify-center py-6 gap-2 bg-dark-card border-slate-700/50 hover:bg-slate-800/80 transition-colors">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-1">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <span className="font-medium text-sm">Receive</span>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Recent Activity</h2>
          <span className="text-sm text-primary cursor-pointer" onClick={() => navigate('/history')}>View All</span>
        </div>
        
        <div className="space-y-3">
          {history.length > 0 ? (
            history.slice(0, 3).map((tx) => (
              <motion.div 
                key={tx.id} 
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/transaction/${tx.tx_hash}`)}
              >
                <Card className="flex items-center justify-between p-4 bg-dark-card border-slate-700/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'Received' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {tx.type === 'Received' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.type}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium text-sm ${tx.type === 'Received' ? 'text-emerald-500' : 'text-white'}`}>
                      {tx.type === 'Received' ? '+' : '-'}{tx.amount} {tx.symbol}
                    </p>
                    <p className={`text-xs capitalize ${tx.status === 'success' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {tx.status}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No transactions yet
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
