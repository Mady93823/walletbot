import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { walletApi } from '../api';
import { ArrowLeft, Search, Plus } from 'lucide-react';
import { Button } from '../components/Button';
import WebApp from '@twa-dev/sdk';

export const ManageCrypto = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom Token Form
  const [customToken, setCustomToken] = useState({
    contract_addr: '',
    symbol: '',
    name: '',
    chain: 'ETH',
    decimals: 18
  });

  const loadAssets = async () => {
    try {
      const res = await walletApi.getAssets();
      setAssets(res.data.assets);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const toggleAsset = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setAssets(assets.map(a => a.id === id ? { ...a, is_enabled: !currentStatus } : a));
      await walletApi.toggleAsset(id, !currentStatus);
      try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e) {}
    } catch (error) {
      loadAssets(); // Revert on error
      try { WebApp.showAlert('Failed to update asset visibility'); } catch(e) { console.warn(e); }
    }
  };

  const isValidAddress = (address: string, chain: string) => {
    // Simple regex validation
    if (chain === 'TRON') {
      return address.startsWith('T') && address.length === 34;
    }
    // ETH/BSC (EVM)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleAddCustom = async () => {
    try {
      if (!customToken.contract_addr || !customToken.symbol) {
        try { WebApp.showAlert('Please fill required fields'); } catch(e) { alert('Please fill required fields'); }
        return;
      }

      if (!isValidAddress(customToken.contract_addr, customToken.chain)) {
        try { WebApp.showAlert(`Invalid ${customToken.chain} address format`); } catch(e) { alert('Invalid address format'); }
        return;
      }
      
      await walletApi.addCustomAsset(customToken);
      setShowCustomModal(false);
      loadAssets();
      try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e) {}
      setCustomToken({ contract_addr: '', symbol: '', name: '', chain: 'ETH', decimals: 18 });
    } catch (error: any) {
      try { WebApp.showAlert('Failed to add token: ' + error.message); } catch(e) { console.warn(e); }
    }
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F172A] pb-24 text-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-[#0F172A]/95 backdrop-blur z-20 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Manage Crypto</h1>
        </div>
        <button 
          onClick={() => setShowCustomModal(true)}
          className="p-2 text-blue-400 hover:bg-slate-800 rounded-lg"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
          />
        </div>

        {/* List */}
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <div 
              key={asset.id}
              className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {asset.logo_url ? (
                  <img src={asset.logo_url} className="w-10 h-10 rounded-full bg-slate-700" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                    {asset.symbol[0]}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm">{asset.symbol}</p>
                  <p className="text-xs text-slate-400">{asset.name} • {asset.chain}</p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={asset.is_enabled} 
                  onChange={() => toggleAsset(asset.id, asset.is_enabled)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Token Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCustomModal(false)}
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-sm bg-[#1E293B] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border-t border-slate-700 space-y-4"
            >
              <h2 className="text-xl font-bold mb-4">Add Custom Token</h2>
              
              <div className="space-y-3">
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm"
                  value={customToken.chain}
                  onChange={(e) => setCustomToken({ ...customToken, chain: e.target.value })}
                >
                  <option value="ETH">Ethereum (ERC20)</option>
                  <option value="BSC">BNB Chain (BEP20)</option>
                  <option value="TRON">Tron (TRC20)</option>
                </select>

                <input 
                  placeholder="Contract Address"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm"
                  value={customToken.contract_addr}
                  onChange={(e) => setCustomToken({ ...customToken, contract_addr: e.target.value })}
                />
                
                <input 
                  placeholder="Symbol (e.g. PEPE)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm"
                  value={customToken.symbol}
                  onChange={(e) => setCustomToken({ ...customToken, symbol: e.target.value })}
                />

                <input 
                  placeholder="Name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm"
                  value={customToken.name}
                  onChange={(e) => setCustomToken({ ...customToken, name: e.target.value })}
                />

                <input 
                  type="number"
                  placeholder="Decimals (default 18)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm"
                  value={customToken.decimals}
                  onChange={(e) => setCustomToken({ ...customToken, decimals: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" fullWidth onClick={() => setShowCustomModal(false)}>Cancel</Button>
                <Button variant="primary" fullWidth onClick={handleAddCustom}>Add Token</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
