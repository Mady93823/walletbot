// src/services/walletService.ts
import { ethers } from 'ethers';
import prisma from './prisma';
import { encrypt, decrypt } from '../utils/encryption';
import { UserService } from './userService';

// Use Sepolia Testnet Public RPC
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const provider = new ethers.JsonRpcProvider(RPC_URL);

export const WalletService = {
  createWallet: async (telegramId: number) => {
    const user = await UserService.getOrCreateUser(telegramId);
    
    if (user.wallet) {
      throw new Error('Wallet already exists');
    }

    // Generate new random wallet
    const wallet = ethers.Wallet.createRandom();
    const encryptedKey = encrypt(wallet.privateKey);

    // Save to DB
    const newWallet = await prisma.wallet.create({
      data: {
        user_id: user.id,
        address: wallet.address,
        encrypted_private_key: encryptedKey,
        chain: 'ETH'
      }
    });

    return {
      address: newWallet.address,
      privateKey: wallet.privateKey // Only returned once upon creation!
    };
  },

  getWallet: async (telegramId: number) => {
    const user = await UserService.getUser(telegramId);
    if (!user || !user.wallet) return null;

    const walletAddress = user.wallet.address;

    // We usually just need the address for display
    // If we need the private key for signing, we decrypt it here
    return {
      address: walletAddress,
      chain: user.wallet.chain || 'ETH',
      getBalance: async () => {
         try {
            // --- TESTING MODE: DYNAMIC BALANCE ---
            // Base Mock Balance: 1.0 ETH
            // Actual Balance = 1.0 + Received - Sent
            
            const initialBalance = 1.0;

            // Calculate Sent Amount
            const sent = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { 
                    user_id: user.id, 
                    status: 'success',
                    to_address: { not: 'unknown' } // 'unknown' marks received txs in our schema hack
                }
            });

            // Calculate Received Amount
            const received = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: { 
                    user_id: user.id, 
                    status: 'success',
                    to_address: 'unknown'
                }
            });

            const totalSent = sent._sum.amount ? parseFloat(sent._sum.amount.toString()) : 0;
            const totalReceived = received._sum.amount ? parseFloat(received._sum.amount.toString()) : 0;
            
            const currentBalance = initialBalance + totalReceived - totalSent;

            return currentBalance.toFixed(4);
         } catch (e) {
            console.error("Error fetching balance:", e);
            return '0.000';
         }
      }
    };
  },
  
  // Internal use only - to sign transactions
  getSigner: async (telegramId: number, provider: ethers.Provider) => {
     const user = await UserService.getUser(telegramId);
     if (!user || !user.wallet) throw new Error('Wallet not found');
     
     const privateKey = decrypt(user.wallet.encrypted_private_key);
     return new ethers.Wallet(privateKey, provider);
  }
};
