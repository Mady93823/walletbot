// src/services/walletService.ts
import { ethers } from 'ethers';
import prisma from './prisma';
import { encrypt, decrypt } from '../utils/encryption';
import { UserService } from './userService';
import { initializeAssets } from './assetService';

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

    // Initialize default assets
    await initializeAssets(newWallet.id);

    return {
      address: newWallet.address,
      privateKey: wallet.privateKey // Only returned once upon creation!
    };
  },

  getWallet: async (telegramId: number) => {
    const user = await UserService.getUser(telegramId);
    if (!user || !user.wallet) return null;

    // Capture wallet to a local variable to satisfy TS inside the closure
    const wallet = user.wallet;
    const walletAddress = wallet.address;

    // We usually just need the address for display
    // If we need the private key for signing, we decrypt it here
    return {
      address: walletAddress,
      chain: wallet.chain || 'ETH',
      getBalance: async (assetSymbol = 'ETH', chain = 'ETH') => {
        // New Logic: Single Source of Truth = Asset Table
        // This now returns the PRECISE decimal balance stored in the DB
        const asset = await prisma.asset.findFirst({
          where: { 
            wallet_id: wallet.id,
            symbol: assetSymbol,
            chain: chain
          }
        });

        if (!asset) return '0.0';
        
        // Prisma Decimal returns as object or string depending on config, 
        // but .toString() is safest
        return asset.balance.toString();
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
