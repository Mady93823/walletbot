// src/ui/messages.ts
import { COPY } from '../constants/copy';
import { EMOJIS } from '../constants/emojis';
import { Transaction } from '../services/mockService';

export const Messages = {
  dashboard: (balance: string, symbol: string, address: string) => {
    return `${COPY.DASHBOARD.TITLE}\n` +
           `${COPY.DASHBOARD.BALANCE(balance, symbol)}\n` +
           `${COPY.DASHBOARD.ADDRESS(address)}`;
  },

  history: (transactions: Transaction[]) => {
    const list = transactions.map(tx => {
      let icon = EMOJIS.SUCCESS;
      if (tx.status === 'pending') icon = EMOJIS.PENDING;
      if (tx.status === 'failed') icon = EMOJIS.FAILED;
      
      return COPY.HISTORY.ITEM(icon, tx.type, tx.amount, tx.timestamp);
    }).join('\n');

    return `${COPY.HISTORY.TITLE}\n${list}`;
  },

  confirmTx: (to: string, amount: string, fee: string) => {
    return `${COPY.SEND.CONFIRM_TITLE}\n` +
           `${COPY.SEND.CONFIRM_DETAILS(to, amount, fee)}`;
  }
};
