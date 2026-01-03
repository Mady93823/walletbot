import { motion } from 'framer-motion';
import { Wallet, ArrowLeft } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

export const Onboarding = () => {
  const handleClose = () => {
    WebApp.close();
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15),_transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md space-y-8 text-center"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full" />
            <div className="relative bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-2xl">
              <Wallet className="w-16 h-16 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Wallet Required</h1>
          <p className="text-slate-400">
            For security reasons, please create your wallet directly in the Telegram Bot chat.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 text-left space-y-3">
          <h3 className="font-medium text-blue-400">How to create a wallet:</h3>
          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2">
            <li>Close this Mini App.</li>
            <li>Click the <b>"Start Here"</b> or <b>"Create Wallet"</b> button in the bot chat.</li>
            <li>Once created, open this app again!</li>
          </ol>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClose}
          className="w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Close App
        </motion.button>
      </motion.div>
    </div>
  );
};
