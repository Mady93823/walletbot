import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, SlidersHorizontal, LogOut, Info, ChevronRight, Globe } from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();

  const settingsItems = [
    {
      icon: <SlidersHorizontal className="w-5 h-5 text-blue-400" />,
      title: 'Manage Assets',
      description: 'Toggle visibility and add custom tokens',
      onClick: () => navigate('/manage-crypto')
    },
    {
      icon: <Globe className="w-5 h-5 text-orange-400" />,
      title: 'Networks',
      description: 'Manage RPC connections & chains',
      onClick: () => navigate('/settings/networks')
    },
    {
      icon: <Shield className="w-5 h-5 text-green-400" />,
      title: 'Security',
      description: 'PIN, Biometrics, and Recovery',
      onClick: () => navigate('/settings/security')
    },
    {
      icon: <Info className="w-5 h-5 text-purple-400" />,
      title: 'About',
      description: 'Version 1.0.0',
      onClick: () => { }
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] pb-24 text-white">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 sticky top-0 bg-[#0F172A]/95 backdrop-blur z-20 border-b border-slate-800">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="p-4 space-y-4">
        {settingsItems.map((item, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={item.onClick}
            className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-700/50 rounded-lg">
                {item.icon}
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </motion.button>
        ))}

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full flex items-center justify-center gap-2 p-4 mt-8 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Disconnect Wallet</span>
        </motion.button>
      </div>
    </div>
  );
};
