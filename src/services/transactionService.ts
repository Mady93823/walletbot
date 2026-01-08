// src/services/transactionService.ts
import prisma from './prisma';
import { WalletService } from './walletService';
import { ethers } from 'ethers';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// Use Sepolia Testnet Public RPC
// Use Sepolia Testnet Public RPC
const DEFAULT_RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const defaultProvider = new ethers.JsonRpcProvider(DEFAULT_RPC_URL);

export const TransactionService = {
  getHistory: async (telegramId: number) => {
    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(telegramId) }
    });

    if (!user) return [];

    const txs = await prisma.transaction.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    const history = txs.map(tx => ({
      id: tx.id,
      type: tx.to_address === 'unknown' ? 'Received' : 'Sent',
      amount: tx.amount.toString(),
      symbol: 'ETH',
      status: tx.status,
      timestamp: tx.created_at.toISOString(),
      hash: tx.tx_hash || 'Pending'
    }));

    // --- TESTING MODE: INJECT FAKE DEPOSIT ---
    if (history.length === 0) {
      history.push({
        id: '999999',
        type: 'Received',
        amount: '1.0',
        symbol: 'ETH',
        status: 'success',
        timestamp: new Date().toISOString(),
        hash: '0xTestnetFaucetDeposit...'
      });
    }

    return history;
  },

  sendTransaction: async (telegramId: number, to: string, amount: string, rpcUrl?: string, chainId?: number) => {
    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(telegramId) },
      include: { wallet: true }
    });

    if (!user || !user.wallet) throw new Error('User or wallet not found');

    // 0. Balance Check (Precise)
    const walletData = await WalletService.getWallet(telegramId);
    if (!walletData) throw new Error('Wallet data unavailable');

    // Use correct provider
    const activeProvider = rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : defaultProvider;

    // Default to ETH for now, but scalable to other assets
    // FUTURE: Use activeProvider for balance check if we want real-time network balance
    // For now, we check local DB balance which tracks all supported chains
    const currentBalanceStr = await walletData.getBalance('ETH', 'ETH');

    // Use Prisma.Decimal for precise comparison
    const currentBalance = new Prisma.Decimal(currentBalanceStr);
    const amountDec = new Prisma.Decimal(amount);
    const feeDec = new Prisma.Decimal('0.001'); // Fixed buffer

    if (currentBalance.lessThan(amountDec.add(feeDec))) {
      throw new Error(`Insufficient funds. Balance: ${currentBalance}, Required: ${amountDec.add(feeDec)}`);
    }

    // 1. Create Pending Transaction Record
    // Prisma Decimal field expects number, string or Decimal. 
    // Passing string is safest for precision.
    const txRecord = await prisma.transaction.create({
      data: {
        user_id: user.id,
        to_address: to,
        amount: amount,
        status: 'pending',
        chain: chainId ? `CHAIN-${chainId}` : 'ETH'
      }
    });

    try {
      // 2. Perform Blockchain Transaction
      // Note: This needs the decryption logic
      const signer = await WalletService.getSigner(telegramId, activeProvider);

      // --- TESTING MODE: MOCK SEND ---
      // Skip actual blockchain call to avoid INSUFFICIENT_FUNDS error
      // Remove this block to go live
      const isTestMode = true;

      let txHash;

      if (isTestMode && !rpcUrl) {
        logger.info(`[TEST MODE] Mocking send transaction to ${to} for ${amount} ETH`);
        // Use a realistic looking hash for UX testing (valid hex, 64 chars)
        const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        txHash = '0x' + randomHex;
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        if (rpcUrl) logger.info(`Sending transaction via custom RPC: ${rpcUrl}`);

        const txResponse = await signer.sendTransaction({
          to: to,
          value: ethers.parseEther(amount)
        });
        txHash = txResponse.hash;
      }

      // 3. Update Record with Hash
      await prisma.transaction.update({
        where: { id: txRecord.id },
        data: {
          tx_hash: txHash,
          status: 'success' // In reality, we should wait for .wait() but for UX speed we return hash
        }
      });

      // --- INTERNAL TRANSFER SIMULATION ---
      // If the recipient is also a user in our DB, create a "Received" record for them
      try {
        const recipientWallet = await prisma.wallet.findFirst({
          where: { address: to }
        });

        if (recipientWallet) {
          logger.info(`[TEST MODE] Recipient found (User ID: ${recipientWallet.user_id}). Creating receive record.`);
          await prisma.transaction.create({
            data: {
              user_id: recipientWallet.user_id,
              to_address: 'unknown', // Marks it as 'Received' based on current getHistory logic
              amount: amount,
              status: 'success',
              chain: 'ETH',
              tx_hash: txHash
            }
          });

          // UPDATE ASSET BALANCES (Precise)
          // 1. Deduct from Sender
          const amountDec = new Prisma.Decimal(amount);
          const senderAsset = await prisma.asset.findFirst({
            where: { wallet_id: user.wallet.id, symbol: 'ETH' } // Assuming ETH for now
          });
          if (senderAsset) {
            await prisma.asset.update({
              where: { id: senderAsset.id },
              data: { balance: { decrement: amountDec } }
            });
          }

          // 2. Add to Recipient
          const recipientAsset = await prisma.asset.findFirst({
            where: { wallet_id: recipientWallet.id, symbol: 'ETH' }
          });
          if (recipientAsset) {
            await prisma.asset.update({
              where: { id: recipientAsset.id },
              data: { balance: { increment: amountDec } }
            });
          }
        }
      } catch (internalErr) {
        logger.error('[TEST MODE] Failed to create recipient record:', internalErr);
      }

      return { success: true, hash: txHash };

    } catch (error) {
      logger.error('Tx Failed:', error);
      await prisma.transaction.update({
        where: { id: txRecord.id },
        data: { status: 'failed' }
      });
      return { success: false, hash: null };
    }
  },

  estimateFee: async (rpcUrl?: string) => {
    const activeProvider = rpcUrl ? new ethers.JsonRpcProvider(rpcUrl) : defaultProvider;
    const feeData = await activeProvider.getFeeData();
    // Simple estimation for standard transfer (21000 gas)
    if (feeData.gasPrice) {
      const fee = 21000n * feeData.gasPrice;
      return ethers.formatEther(fee);
    }
    return '0.001'; // Fallback
  }
};
