export const isValidAddress = (address: string, chain: string): boolean => {
  if (!address) return false;

  switch (chain.toUpperCase()) {
    case 'ETH':
    case 'BSC':
    case 'POLYGON':
    case 'ARBITRUM':
    case 'OPTIMISM':
    case 'AVALANCHE':
      // EVM compatible: 0x followed by 40 hex chars
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    
    case 'BTC':
      // Simple BTC validation (Legacy, Segwit, Native Segwit)
      // 1... (P2PKH), 3... (P2SH), bc1... (Bech32)
      return /^(1|3)[a-zA-Z0-9]{25,34}$|^bc1[a-zA-Z0-9]{25,59}$/.test(address);
    
    case 'TRON':
      // Starts with T, 34 chars, base58 (simplified check)
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    
    case 'SOL':
      // Base58, usually 32-44 chars
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);

    default:
      // Fallback: non-empty string with reasonable length
      return address.length > 10;
  }
};

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};

export const truncateAddress = (address: string, start = 6, end = 4): string => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const getNetworkDisplayName = (chain: string, symbol: string): string => {
  const c = chain.toUpperCase();
  const s = symbol.toUpperCase();

  switch (c) {
    case 'ETH':
      return s === 'ETH' ? 'Ethereum' : 'Ethereum (ERC20)';
    case 'BSC':
      return s === 'BNB' ? 'BNB Smart Chain' : 'BNB Smart Chain (BEP20)';
    case 'TRON':
      return s === 'TRX' ? 'Tron' : 'Tron (TRC20)';
    case 'SOL':
      return s === 'SOL' ? 'Solana' : 'Solana (SPL)';
    case 'MATIC':
    case 'POLYGON':
      return s === 'MATIC' ? 'Polygon' : 'Polygon (ERC20)';
    case 'BTC':
      return 'Bitcoin';
    default:
      return chain;
  }
};
