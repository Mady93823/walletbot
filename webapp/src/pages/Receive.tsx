import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { walletApi } from '../api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AssetSelectionModal } from '../components/AssetSelectionModal';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, Copy, Share2, Search, 
  CheckCircle2, Trash2, MailOpen, Mail, 
  QrCode, ChevronDown
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { getNetworkDisplayName } from '../utils/validation';

// Types
interface Transaction {
  id: string;
  hash: string;
  amount: string;
  symbol: string;
  type: 'Received' | 'Sent';
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
  from?: string;
}

export const Receive = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (WebApp.BackButton) {
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(() => navigate('/'));
      return () => {
        WebApp.BackButton.hide();
        WebApp.BackButton.offClick(() => navigate('/'));
      };
    }
  }, [navigate]);

  const [walletAddress, setWalletAddress] = useState('');
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [showQr, setShowQr] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'high-value'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [readItems, setReadItems] = useState<Set<string>>(new Set());
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  // Asset Selection
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [userRes, historyRes, assetsRes] = await Promise.all([
          walletApi.getUserMe(),
          walletApi.getHistory(),
          walletApi.getAssets()
        ]);

        if (userRes.data.wallet) {
          setWalletAddress(userRes.data.wallet.address);
        }

        if (assetsRes.data.assets) {
          setAssets(assetsRes.data.assets);
          // Default to ETH or first enabled asset
          const defaultAsset = assetsRes.data.assets.find((a: any) => a.symbol === 'ETH') || assetsRes.data.assets[0];
          setSelectedAsset(defaultAsset);
        }

        if (historyRes.data.history) {
          // Filter only received transactions for this page
          const received = historyRes.data.history.filter(
            (tx: Transaction) => tx.type === 'Received'
          );
          setHistory(received);
        }

        // Load local state
        const savedRead = localStorage.getItem('wallet_read_txs');
        const savedHidden = localStorage.getItem('wallet_hidden_txs');
        if (savedRead) setReadItems(new Set(JSON.parse(savedRead)));
        if (savedHidden) setHiddenItems(new Set(JSON.parse(savedHidden)));

      } catch (error) {
        console.error(error);
        WebApp.showAlert('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save local state
  useEffect(() => {
    localStorage.setItem('wallet_read_txs', JSON.stringify(Array.from(readItems)));
    localStorage.setItem('wallet_hidden_txs', JSON.stringify(Array.from(hiddenItems)));
  }, [readItems, hiddenItems]);

  // Determine Display Address based on Asset
  const displayAddress = useMemo(() => {
    if (!selectedAsset || !walletAddress) return walletAddress;
    
    // MOCK: Generate consistent fake addresses for non-EVM chains
    // In a real app, the wallet would have multiple keys or derive them
    if (selectedAsset.chain === 'BTC') {
      return `bc1${walletAddress.substring(2)}mock`;
    }
    if (selectedAsset.chain === 'TRON') {
      return `T${walletAddress.substring(2)}mock`;
    }
    if (selectedAsset.chain === 'SOL') {
      return `Sol${walletAddress.substring(2)}mock`;
    }
    
    // Default to EVM address
    return walletAddress;
  }, [walletAddress, selectedAsset]);

  // Filter & Sort Logic
  const filteredHistory = useMemo(() => {
    return history
      .filter(tx => !hiddenItems.has(tx.id))
      .filter(tx => {
        if (filter === 'unread') return !readItems.has(tx.id);
        if (filter === 'high-value') return parseFloat(tx.amount) > 0.1; // Example threshold
        return true;
      })
      .filter(tx => 
        tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.amount.includes(searchQuery)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, hiddenItems, readItems, filter, searchQuery]);

  // Actions
  const copyAddress = () => {
    navigator.clipboard.writeText(displayAddress);
    if (WebApp.showPopup) {
      WebApp.showPopup({
        title: 'Copied',
        message: 'Address copied to clipboard',
        buttons: [{ type: 'ok' }]
      });
    } else {
      alert('Address copied to clipboard');
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const handleBulkRead = () => {
    const newRead = new Set(readItems);
    selectedItems.forEach(id => newRead.add(id));
    setReadItems(newRead);
    setSelectedItems(new Set());
    WebApp.HapticFeedback.notificationOccurred('success');
  };

  const handleBulkDelete = () => {
    const newHidden = new Set(hiddenItems);
    selectedItems.forEach(id => newHidden.add(id));
    setHiddenItems(newHidden);
    setSelectedItems(new Set());
    WebApp.HapticFeedback.notificationOccurred('warning');
  };

  const selectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map(tx => tx.id)));
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] pb-24 text-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 bg-[#0F172A]/95 backdrop-blur z-20 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Receive</h1>
        </div>
        <button 
          onClick={() => setShowQr(!showQr)}
          className={`p-2 rounded-lg transition-colors ${showQr ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          <QrCode className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* QR Section */}
        <AnimatePresence>
          {showQr && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              {/* Asset Selector Trigger */}
              <button
                onClick={() => setShowAssetModal(true)}
                className="w-full bg-slate-800 p-3 rounded-xl flex items-center justify-between border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {selectedAsset ? (
                    <>
                      <img src={selectedAsset.logo_url} className="w-8 h-8 rounded-full bg-slate-900 p-1" />
                      <div className="text-left">
                        <p className="font-bold text-sm">{selectedAsset.name}</p>
                        <p className="text-xs text-slate-400">{getNetworkDisplayName(selectedAsset.chain, selectedAsset.symbol)} Network</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">Select Asset</span>
                  )}
                </div>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </button>

              <Card className="bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700 p-6 flex flex-col items-center gap-6">
                <div className="bg-white p-4 rounded-2xl shadow-xl shadow-blue-500/10">
                  {displayAddress ? (
                    <QRCodeSVG 
                      value={displayAddress}
                      size={192}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-xl" />
                  )}
                </div>
                
                <div className="w-full space-y-3">
                  <div className="text-center space-y-1">
                     <p className="text-xs text-slate-500 uppercase tracking-wider">Your {selectedAsset?.symbol || 'Wallet'} Address ({selectedAsset ? getNetworkDisplayName(selectedAsset.chain, selectedAsset.symbol) : ''})</p>
                     <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-700/50 flex items-center justify-center gap-2 group cursor-pointer" onClick={copyAddress}>
                        <span className="font-mono text-xs text-slate-300 break-all">
                          {displayAddress || 'Loading...'}
                        </span>
                        <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                     </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="secondary" className="flex-1 gap-2" onClick={copyAddress}>
                      <Copy className="w-4 h-4" /> Copy Address
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => WebApp.openTelegramLink(`https://t.me/share/url?url=${displayAddress}`)}>
                      <Share2 className="w-4 h-4" /> Share
                    </Button>
                  </div>
                  
                  {selectedAsset && (
                     <p className="text-[10px] text-center text-amber-500/80 bg-amber-500/10 p-2 rounded-lg">
                       Make sure to send only {selectedAsset.symbol} on the <span className="font-bold">{getNetworkDisplayName(selectedAsset.chain, selectedAsset.symbol)}</span> network to this address.
                     </p>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inbox Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Incoming History</h2>
            <div className="flex gap-2">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="high-value">High Value {'>'} 0.1</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search hash or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
            />
          </div>

          {/* Bulk Actions Bar */}
          <AnimatePresence>
            {selectedItems.size > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="fixed bottom-20 left-4 right-4 bg-blue-600 text-white p-3 rounded-xl shadow-lg flex items-center justify-between z-30"
              >
                <span className="font-medium px-2">{selectedItems.size} selected</span>
                <div className="flex gap-2">
                  <button onClick={handleBulkRead} className="p-2 hover:bg-blue-500 rounded-lg transition-colors" title="Mark as Read">
                    <MailOpen className="w-5 h-5" />
                  </button>
                  <button onClick={handleBulkDelete} className="p-2 hover:bg-blue-500 rounded-lg transition-colors" title="Hide">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 pb-2 border-b border-slate-800">
              <button 
                onClick={selectAll}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedItems.size === filteredHistory.length && filteredHistory.length > 0 ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}
              >
                {selectedItems.size === filteredHistory.length && filteredHistory.length > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>
              <span className="text-xs text-slate-500">Select All</span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading history...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-3 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <Mail className="w-6 h-6 opacity-50" />
                </div>
                <p>No transactions found</p>
              </div>
            ) : (
              filteredHistory.map((tx) => {
                const isRead = readItems.has(tx.id);
                const isSelected = selectedItems.has(tx.id);

                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`group relative overflow-hidden rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-blue-500/10 border-blue-500/50' 
                        : isRead 
                          ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600' 
                          : 'bg-slate-800 border-slate-600 shadow-sm'
                    }`}
                  >
                    <div className="p-4 flex items-center gap-4">
                      {/* Checkbox */}
                      <button 
                        onClick={() => toggleSelection(tx.id)}
                        className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 group-hover:border-slate-500'}`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0" onClick={() => !isSelected && toggleSelection(tx.id)}>
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-mono text-xs text-slate-400 truncate max-w-[120px]" title={tx.hash}>
                            {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                          </p>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" title="Unread" />
                            )}
                            <span className={`font-semibold ${isRead ? 'text-slate-300' : 'text-white'}`}>
                              +{tx.amount} {tx.symbol}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AssetSelectionModal 
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        onSelect={(asset) => {
          setSelectedAsset(asset);
          setShowAssetModal(false);
        }}
        assets={assets.filter(a => a.is_enabled)}
      />
    </div>
  );
};
