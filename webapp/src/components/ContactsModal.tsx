import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Clock, ChevronRight } from 'lucide-react';
import { walletApi } from '../api';
import { truncateAddress } from '../utils/validation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
}

export const ContactsModal = ({ isOpen, onClose, onSelect }: Props) => {
  const [contacts, setContacts] = useState<{ address: string; lastUsed: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      walletApi.getHistory()
        .then(res => {
          if (res.data.history) {
            const sentTxs = res.data.history.filter((tx: any) => tx.type === 'Sent' && tx.to_address);
            
            const contactMap = new Map<string, { address: string; lastUsed: string; count: number }>();
            
            sentTxs.forEach((tx: any) => {
              const existing = contactMap.get(tx.to_address);
              if (existing) {
                existing.count++;
                if (new Date(tx.timestamp) > new Date(existing.lastUsed)) {
                  existing.lastUsed = tx.timestamp;
                }
              } else {
                contactMap.set(tx.to_address, {
                  address: tx.to_address,
                  lastUsed: tx.timestamp,
                  count: 1
                });
              }
            });

            setContacts(Array.from(contactMap.values()).sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()));
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#0F172A] border-t border-slate-700 rounded-t-3xl sm:rounded-2xl sm:border max-h-[80vh] flex flex-col shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold">Contacts & Recent</h2>
              <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading contacts...</div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  No recent contacts found
                </div>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.address}
                    onClick={() => onSelect(contact.address)}
                    className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl flex items-center gap-4 group transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-mono text-sm">{truncateAddress(contact.address)}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(contact.lastUsed).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{contact.count} txs</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
