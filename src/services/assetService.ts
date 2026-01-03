import { Prisma } from '@prisma/client';
import prisma from './prisma';

export interface AssetInput {
  symbol: string;
  name: string;
  chain: string;
  contract_addr?: string;
  decimals?: number;
  logo_url?: string;
  defaultEnabled?: boolean;
}

export const DEFAULT_ASSETS: AssetInput[] = [
  // Enabled by default
  { symbol: 'ETH', name: 'Ethereum', chain: 'ETH', logo_url: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', defaultEnabled: true },
  { symbol: 'USDT', name: 'Tether USD', chain: 'ETH', contract_addr: '0xdac17f958d2ee523a2206206994597c13d831ec7', logo_url: 'https://cryptologos.cc/logos/tether-usdt-logo.png', defaultEnabled: true },
  { symbol: 'USDC', name: 'USD Coin', chain: 'ETH', contract_addr: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', logo_url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', defaultEnabled: true },
  { symbol: 'BNB', name: 'BNB', chain: 'BSC', logo_url: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', defaultEnabled: true },
  { symbol: 'TRX', name: 'TRON', chain: 'TRON', logo_url: 'https://cryptologos.cc/logos/tron-trx-logo.png', defaultEnabled: true },

  // Disabled by default (Major Coins)
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', chain: 'ETH', contract_addr: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', logo_url: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', defaultEnabled: false },
  { symbol: 'SOL', name: 'Solana (Wormhole)', chain: 'ETH', contract_addr: '0xd31a59c85ae9d8edefec411d448f90841571b89c', logo_url: 'https://cryptologos.cc/logos/solana-sol-logo.png', defaultEnabled: false },
  { symbol: 'MATIC', name: 'Polygon', chain: 'ETH', contract_addr: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', logo_url: 'https://cryptologos.cc/logos/polygon-matic-logo.png', defaultEnabled: false },
  { symbol: 'LINK', name: 'Chainlink', chain: 'ETH', contract_addr: '0x514910771af9ca656af840dff83e8264ecf986ca', logo_url: 'https://cryptologos.cc/logos/chainlink-link-logo.png', defaultEnabled: false },
  { symbol: 'UNI', name: 'Uniswap', chain: 'ETH', contract_addr: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', logo_url: 'https://cryptologos.cc/logos/uniswap-uni-logo.png', defaultEnabled: false },
  { symbol: 'SHIB', name: 'Shiba Inu', chain: 'ETH', contract_addr: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', logo_url: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png', defaultEnabled: false },
  { symbol: 'PEPE', name: 'Pepe', chain: 'ETH', contract_addr: '0x6982508145454ce325ddbe47a25d4ec3d2311933', logo_url: 'https://cryptologos.cc/logos/pepe-pepe-logo.png', defaultEnabled: false },
  { symbol: 'DAI', name: 'Dai Stablecoin', chain: 'ETH', contract_addr: '0x6b175474e89094c44da98b954eedeac495271d0f', logo_url: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', defaultEnabled: false },
  { symbol: 'AAVE', name: 'Aave', chain: 'ETH', contract_addr: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', logo_url: 'https://cryptologos.cc/logos/aave-aave-logo.png', defaultEnabled: false },
  { symbol: 'LTC', name: 'Litecoin (Binance-Peg)', chain: 'BSC', contract_addr: '0x4338665cbb7b2485a8855a139b75d5e34ab0db94', logo_url: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png', defaultEnabled: false },
  { symbol: 'DOGE', name: 'Dogecoin (Binance-Peg)', chain: 'BSC', contract_addr: '0xba2ae424d960c26247dd6c32edc70b295c744c43', logo_url: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png', defaultEnabled: false },
  { symbol: 'DOT', name: 'Polkadot (Binance-Peg)', chain: 'BSC', contract_addr: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402', logo_url: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png', defaultEnabled: false },
];

export const initializeAssets = async (walletId: string) => {
  for (const asset of DEFAULT_ASSETS) {
    const { defaultEnabled, ...assetData } = asset;
    
    await prisma.asset.upsert({
      where: {
        wallet_id_symbol_chain: {
          wallet_id: walletId,
          symbol: asset.symbol,
          chain: asset.chain
        }
      },
      update: {
        // We can optionally update metadata like contract_addr or logo_url if they change in code
        contract_addr: asset.contract_addr,
        logo_url: asset.logo_url
      },
      create: {
        wallet_id: walletId,
        ...assetData,
        is_enabled: defaultEnabled ?? true, // Default to true if not specified
        // Airdrop 1.0 ETH and 1.0 USDT for testing purposes
        balance: (asset.symbol === 'USDT' || asset.symbol === 'ETH') ? 1.0 : 0.0
      }
    });
  }
};

export const ensureDefaultBalances = async (walletId: string) => {
  // Fix for negative balances or missing initial testnet airdrops
  // This ensures users always have at least 0 (no debt) and re-applies airdrop if needed
  
  const assets = await prisma.asset.findMany({
    where: { 
      wallet_id: walletId,
      symbol: { in: ['ETH', 'USDT'] }
    }
  });

  for (const asset of assets) {
    // Check if balance is negative (due to migration issue)
    if (asset.balance.isNegative()) {
       console.log(`[Auto-Repair] Resetting negative balance for ${asset.symbol} (Wallet: ${walletId})`);
       await prisma.asset.update({
         where: { id: asset.id },
         data: { balance: 1.0 } // Reset to default airdrop amount
       });
    }
  }
};

export const getAssets = async (walletId: string) => {
  return prisma.asset.findMany({
    where: { wallet_id: walletId },
    orderBy: { symbol: 'asc' }
  });
};

export const toggleAsset = async (assetId: string, isEnabled: boolean) => {
  return prisma.asset.update({
    where: { id: assetId },
    data: { is_enabled: isEnabled }
  });
};

export const addCustomAsset = async (walletId: string, asset: AssetInput) => {
  return prisma.asset.create({
    data: {
      wallet_id: walletId,
      symbol: asset.symbol,
      name: asset.name,
      chain: asset.chain,
      contract_addr: asset.contract_addr,
      decimals: asset.decimals,
      logo_url: asset.logo_url,
      is_custom: true,
      is_enabled: true
    }
  });
};
