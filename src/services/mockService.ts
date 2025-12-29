// src/services/mockService.ts
// DEPRECATED: Use WalletService, TransactionService, etc.
// Kept temporarily if types are needed elsewhere

export interface Transaction {
  id: string;
  type: string; // Changed to string to match new service
  amount: string;
  symbol: string;
  status: string;
  timestamp: string;
  hash: string;
}
