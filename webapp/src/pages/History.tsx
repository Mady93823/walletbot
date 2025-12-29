import { useEffect, useState } from 'react';
import { walletApi } from '../api';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { Card } from '../components/Card';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoadingScreen } from '../components/LoadingScreen';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export const History = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        walletApi.getHistory()
            .then(res => setHistory(res.data.history))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="p-4 min-h-screen pb-24">
             <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Transaction History</h1>
            </div>

            <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {history.length === 0 ? (
                    <div className="text-center text-slate-500 mt-10 flex flex-col items-center">
                        <Clock className="w-12 h-12 mb-4 opacity-20" />
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    history.map((tx) => (
                        <motion.div key={tx.id} variants={itemVariants}>
                            <Card className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => navigate(`/transaction/${tx.hash}`)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'Received' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {tx.type === 'Received' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm capitalize">{tx.type}</p>
                                        <p className="text-xs text-slate-500 font-mono truncate max-w-[100px]">{tx.hash}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-medium text-sm ${tx.type === 'Received' ? 'text-emerald-500' : 'text-slate-200'}`}>
                                        {tx.type === 'Received' ? '+' : '-'}{tx.amount} ETH
                                    </p>
                                    <p className={`text-xs ${tx.status === 'success' ? 'text-slate-500' : 'text-orange-500'}`}>
                                        {tx.status}
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </div>
    );
};
