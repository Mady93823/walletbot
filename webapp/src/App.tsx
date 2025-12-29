import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { Home } from './pages/Home';
import { Send } from './pages/Send';
import { Receive } from './pages/Receive';
import { History } from './pages/History';
import { TransactionDetails } from './pages/TransactionDetails';
import { BottomNav } from './components/BottomNav';
import { AnimatedBackground } from './components/AnimatedBackground';

function App() {
  useEffect(() => {
    WebApp.ready();
    WebApp.expand(); // Make the app take full height
    // Setup theme based on Telegram params
    if (WebApp.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-transparent text-dark-text antialiased relative">
        <AnimatedBackground />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/send" element={<Send />} />
          <Route path="/receive" element={<Receive />} />
          <Route path="/history" element={<History />} />
          <Route path="/transaction/:hash" element={<TransactionDetails />} />
          <Route path="/settings" element={<div className="p-10 text-center">Settings Placeholder</div>} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
