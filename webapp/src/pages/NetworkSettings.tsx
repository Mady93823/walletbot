import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe, Plus, Trash2, Check, Signal, Server } from 'lucide-react';

interface Network {
    id: string;
    name: string;
    rpcUrl: string;
    chainId: number;
    symbol: string;
    isCustom?: boolean;
}

const DEFAULT_NETWORKS: Network[] = [
    { id: 'eth-sepolia', name: 'Ethereum Sepolia', rpcUrl: 'https://rpc.sepolia.org', chainId: 11155111, symbol: 'ETH' },
    { id: 'eth-mainnet', name: 'Ethereum Mainnet', rpcUrl: 'https://mainnet.infura.io/v3', chainId: 1, symbol: 'ETH' }
];

export const NetworkSettings = () => {
    const navigate = useNavigate();
    const [networks, setNetworks] = useState<Network[]>(DEFAULT_NETWORKS);
    const [activeId, setActiveId] = useState('eth-sepolia');
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newRpc, setNewRpc] = useState('');
    const [newChainId, setNewChainId] = useState('');
    const [newSymbol, setNewSymbol] = useState('');

    useEffect(() => {
        // Load custom networks
        const saved = localStorage.getItem('custom_networks');
        if (saved) {
            setNetworks([...DEFAULT_NETWORKS, ...JSON.parse(saved)]);
        }

        // Load active network preference
        const savedActive = localStorage.getItem('active_network_id');
        if (savedActive) setActiveId(savedActive);
    }, []);

    const handleAddNetwork = () => {
        if (!newName || !newRpc || !newChainId || !newSymbol) return;

        const newNetwork: Network = {
            id: `custom-${Date.now()}`,
            name: newName,
            rpcUrl: newRpc,
            chainId: parseInt(newChainId),
            symbol: newSymbol,
            isCustom: true
        };

        const updated = [...networks, newNetwork];
        setNetworks(updated);

        // Persist only custom ones
        const customOnes = updated.filter(n => n.isCustom);
        localStorage.setItem('custom_networks', JSON.stringify(customOnes));

        setIsAdding(false);
        setNewName(''); setNewRpc(''); setNewChainId(''); setNewSymbol('');
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = networks.filter(n => n.id !== id);
        setNetworks(updated);
        const customOnes = updated.filter(n => n.isCustom);
        localStorage.setItem('custom_networks', JSON.stringify(customOnes));

        if (activeId === id) setActiveId('eth-sepolia');
    };

    const handleSelect = (id: string) => {
        setActiveId(id);
        localStorage.setItem('active_network_id', id);
    };

    return (
        <div className="min-h-screen bg-[#0F172A] pb-24 text-white">
            {/* Header */}
            <div className="p-4 flex items-center gap-4 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-20 border-b border-slate-800">
                <button onClick={() => navigate('/settings')} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">Networks</h1>
                    <p className="text-xs text-slate-400">Manage RPC connections</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 space-y-4">

                {/* Active/Available List */}
                <div className="space-y-3">
                    {networks.map((net) => (
                        <motion.div
                            key={net.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleSelect(net.id)}
                            className={`relative p-4 rounded-xl border transition-all cursor-pointer ${activeId === net.id
                                    ? 'bg-blue-900/20 border-blue-500/50'
                                    : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${activeId === net.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400'}`}>
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{net.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ID: {net.chainId}</span>
                                            <span>{net.symbol}</span>
                                        </div>
                                    </div>
                                </div>

                                {activeId === net.id && (
                                    <div className="bg-blue-500 rounded-full p-1">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                {net.isCustom && activeId !== net.id && (
                                    <button
                                        onClick={(e) => handleDelete(net.id, e)}
                                        className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* RPC Status Strip */}
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 bg-black/20 p-2 rounded-md font-mono overflow-hidden">
                                <Server className="w-3 h-3" />
                                <span className="truncate">{net.rpcUrl}</span>
                                <Signal className={`w-3 h-3 ml-auto ${activeId === net.id ? 'text-green-500' : 'text-slate-600'}`} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Add Network Modal/Drawer Overlay */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[#1E293B] w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl"
                            >
                                <h2 className="text-xl font-bold mb-4">Add Custom Network</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Network Name</label>
                                        <input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder="e.g. Polygon Mainnet"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">RPC URL</label>
                                        <input
                                            value={newRpc}
                                            onChange={(e) => setNewRpc(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Chain ID</label>
                                            <input
                                                type="number"
                                                value={newChainId}
                                                onChange={(e) => setNewChainId(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 focus:outline-none"
                                                placeholder="137"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Symbol</label>
                                            <input
                                                value={newSymbol}
                                                onChange={(e) => setNewSymbol(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 focus:outline-none"
                                                placeholder="MATIC"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddNetwork}
                                        disabled={!newName || !newRpc}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors disabled:opacity-50"
                                    >
                                        Add Network
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};
