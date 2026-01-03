import { Router } from 'express';
import { WalletService } from '../services/walletService';
import { getAssets, toggleAsset, addCustomAsset, initializeAssets, ensureDefaultBalances, DEFAULT_ASSETS } from '../services/assetService';
import { TransactionService } from '../services/transactionService';
import { UserService } from '../services/userService';
import { SecurityService } from '../services/securityService';
import { validateTelegramWebAppData as authMiddleware } from './middleware/auth';
import prisma from '../services/prisma';
import { createWalletLimiter } from './middleware/rateLimit';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// User & Wallet
router.post('/user/me', async (req, res) => {
  try {
    const user = req.user!;
    const wallet = await WalletService.getWallet(user.id);
    const hasPin = await SecurityService.hasPin(user.id);
    // Return structured response: { user, wallet: { ... }, hasPin }
    res.json({ user, wallet, hasPin });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Security Routes
router.post('/security/set-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4) throw new Error('Invalid PIN');
    
    // Check if PIN already exists? Logic implies setPin can update it too, 
    // but usually we want a change-pin flow. For now, we allow setting.
    await SecurityService.setPin(req.user!.id, pin);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/security/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const isValid = await SecurityService.verifyPin(req.user!.id, pin);
    res.json({ isValid });
  } catch (error: any) {
    res.status(403).json({ error: error.message }); // 403 for lockout/auth fail
  }
});

router.post('/wallet/create', createWalletLimiter, async (req, res) => {
  try {
    const wallet = await WalletService.createWallet(req.user!.id);
    res.json({ success: true, wallet });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assets Management
router.get('/assets', async (req, res) => {
  try {
    // Remove redundant WalletService call that was causing 500 error if wallet missing
    
    // Fetch user and wallet from DB to get the internal wallet ID
    const user = await prisma.user.findUnique({ 
      where: { telegram_id: BigInt(req.user!.id) },
      include: { wallet: true }
    });
    
    const dbWallet = user?.wallet;
    if (!dbWallet) {
      // If wallet not found, return empty assets list instead of crashing
      res.json({ assets: [] });
      return;
    }
    
    let assets = await getAssets(dbWallet.id);
    
    // Auto-initialize default assets if they are missing or incomplete (e.g. new coins added)
    if (assets.length < DEFAULT_ASSETS.length) {
        await initializeAssets(dbWallet.id);
        assets = await getAssets(dbWallet.id);
    }

    // Auto-repair balances for testnet (fix negative balances/missing airdrops)
    await ensureDefaultBalances(dbWallet.id);
    // Refresh assets after potential repair
    assets = await getAssets(dbWallet.id);

    res.json({ assets });
  } catch (error: any) {
    console.error('Assets Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/assets/toggle', async (req, res) => {
  try {
    const { assetId, isEnabled } = req.body;
    await toggleAsset(assetId, isEnabled);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/assets/custom', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { telegram_id: BigInt(req.user!.id) },
      include: { wallet: true }
    });
    
    const dbWallet = user?.wallet;
    if (!dbWallet) throw new Error('Wallet not found');
    
    const asset = await addCustomAsset(dbWallet.id, req.body);
    res.json({ success: true, asset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions
router.post('/wallet/history', async (req, res) => {
  try {
    const userId = req.user!.id;
    const history = await TransactionService.getHistory(userId);
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send Transaction (Draft/Estimate)
router.post('/transaction/estimate', async (req, res) => {
  try {
    const fee = await TransactionService.estimateFee();
    res.json({ fee });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send Transaction (Confirm)
router.post('/transaction/send', async (req, res) => {
  try {
    const { to, amount, pin } = req.body;
    const userId = req.user!.id;

    // Verify PIN
    const validPin = await SecurityService.verifyPin(userId, pin);
    if (!validPin) return res.status(403).json({ error: 'Invalid PIN' });

    const result = await TransactionService.sendTransaction(userId, to, amount);
    
    if (result.success) {
      res.json({ success: true, hash: result.hash });
    } else {
      res.status(400).json({ success: false, error: 'Transaction failed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
