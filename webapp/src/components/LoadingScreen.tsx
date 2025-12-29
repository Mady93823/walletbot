import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F172A] text-white">
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30" />

        {/* Bouncing Wallet Icon */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl"
        >
          <Wallet className="w-12 h-12 text-blue-400" />
        </motion.div>
      </div>
      
      {/* Loading Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-slate-400 font-medium tracking-wide"
      >
        Loading Wallet...
      </motion.p>

      {/* Progress Bar */}
      <div className="mt-4 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-full h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        />
      </div>
    </div>
  );
};
