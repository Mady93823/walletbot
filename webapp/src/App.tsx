import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import { BottomNav } from './components/BottomNav';
import { AnimatedBackground } from './components/AnimatedBackground';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PerformanceMonitor } from './components/PerformanceMonitor';

// Lazy load pages
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(module => ({ default: module.Onboarding })));
const Send = lazy(() => import('./pages/Send').then(module => ({ default: module.Send })));
const Receive = lazy(() => import('./pages/Receive').then(module => ({ default: module.Receive })));
const History = lazy(() => import('./pages/History').then(module => ({ default: module.History })));
const TransactionDetails = lazy(() => import('./pages/TransactionDetails').then(module => ({ default: module.TransactionDetails })));
const AssetDetails = lazy(() => import('./pages/AssetDetails').then(module => ({ default: module.AssetDetails })));
const ManageCrypto = lazy(() => import('./pages/ManageCrypto').then(module => ({ default: module.ManageCrypto })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const SecuritySettings = lazy(() => import('./pages/SecuritySettings').then(module => ({ default: module.SecuritySettings })));
const NetworkSettings = lazy(() => import('./pages/NetworkSettings').then(module => ({ default: module.NetworkSettings })));

function App() {
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.setHeaderColor('#0F172A');
    WebApp.setBackgroundColor('#0F172A');
  }, []);

  return (
    <ErrorBoundary>
      <PerformanceMonitor />
      <BrowserRouter>
        <div className="min-h-screen bg-[#0F172A] text-white font-sans selection:bg-blue-500/30 pb-20 overflow-x-hidden">
          <AnimatedBackground />
          <Suspense fallback={<LoadingScreen />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/send" element={<Send />} />
                <Route path="/receive" element={<Receive />} />
                <Route path="/history" element={<History />} />
                <Route path="/transaction/:hash" element={<TransactionDetails />} />
                <Route path="/asset/:id" element={<AssetDetails />} />
                <Route path="/manage-crypto" element={<ManageCrypto />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/security" element={<SecuritySettings />} />
                <Route path="/settings/networks" element={<NetworkSettings />} />
              </Routes>
            </AnimatePresence>
          </Suspense>

          <BottomNav />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
