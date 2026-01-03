import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronRight } from 'lucide-react';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  logo_url?: string;
  chain: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  assets: Asset[];
}

export const AssetSelectionModal = ({ isOpen, onClose, onSelect, assets }: Props) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ETH' | 'BTC' | 'STABLE'>('ALL');

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = 
        asset.symbol.toLowerCase().includes(search.toLowerCase()) || 
        asset.name.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = 
        filter === 'ALL' ? true :
        filter === 'STABLE' ? ['USDT', 'USDC', 'DAI'].includes(asset.symbol) :
        asset.chain === filter;

      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        // Sort by balance (descending) so available assets appear first
        const balanceA = typeof a.balance === 'number' ? a.balance : parseFloat(a.balance || '0');
        const balanceB = typeof b.balance === 'number' ? b.balance : parseFloat(b.balance || '0');
        return balanceB - balanceA;
    });
  }, [assets, search, filter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#0F172A] border-t border-slate-700 rounded-t-3xl sm:rounded-2xl sm:border max-h-[85vh] flex flex-col shadow-2xl pb-safe"
          >
            {/* Handle Bar (Mobile) */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold">Select Asset</h2>
              <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['ALL', 'ETH', 'BTC', 'STABLE'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      filter === f 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2 min-h-[300px]">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No assets found
                </div>
              ) : (
                filteredAssets.map((asset) => (
                  <motion.button
                    key={asset.id}
                    layout
                    onClick={() => onSelect(asset)}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl flex items-center gap-4 group transition-all"
                  >
                    <img 
                      src={asset.logo_url || 'https://via.placeholder.com/32'} 
                      alt={asset.symbol} 
                      className="w-10 h-10 rounded-full bg-slate-900 p-1" 
                    />
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm group-hover:text-blue-400 transition-colors">
                        {asset.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {asset.chain} Network
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {typeof asset.balance === 'number' ? asset.balance.toFixed(4) : parseFloat(asset.balance || '0').toFixed(4)} {asset.symbol}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
