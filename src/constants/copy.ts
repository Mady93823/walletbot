// src/constants/copy.ts
import { EMOJIS } from './emojis';

export const COPY = {
  ONBOARDING: {
    WELCOME: (name: string) => `${EMOJIS.WAVE} Welcome, ${name}!\nYour crypto wallet inside Telegram.\nFast • Simple • Secure ${EMOJIS.LOCK}`,
    BUTTON_CREATE: `${EMOJIS.CREATE} Create Wallet`,
    BUTTON_RESTORE: `${EMOJIS.RESTORE} Restore Wallet`,
    BUTTON_HELP: `${EMOJIS.HELP} Help`,
  },
  DASHBOARD: {
    TITLE: `💼 Wallet Overview\n${EMOJIS.SEPARATOR}`,
    BALANCE: (amount: string, symbol: string) => `${EMOJIS.BALANCE} Balance: ${amount} ${symbol}`,
    ADDRESS: (addr: string) => `${EMOJIS.ADDRESS} Address: ${addr}`,
    BUTTON_RECEIVE: `${EMOJIS.RECEIVE} Receive`,
    BUTTON_SEND: `${EMOJIS.SEND} Send`,
    BUTTON_HISTORY: `${EMOJIS.HISTORY} History`,
    BUTTON_SECURITY: `${EMOJIS.SETTINGS} Security`,
  },
  RECEIVE: {
    TITLE: (addr: string) => `Scan to receive funds:\n\n\`${addr}\``,
    BUTTON_COPY: `${EMOJIS.COPY} Copy Address`,
    BUTTON_QR: `${EMOJIS.QR} Show QR`,
    BUTTON_BACK: `${EMOJIS.BACK} Back`,
  },
  SEND: {
    ASK_ADDRESS: `Please reply with the destination address.\nOr click ${EMOJIS.BACK} to cancel.`,
    ASK_AMOUNT: `How much do you want to send?\n(Available: 0.523 ETH)`, // Mocked available
    CONFIRM_TITLE: `${EMOJIS.WARNING} Confirm Transaction\n${EMOJIS.SEPARATOR}`,
    CONFIRM_DETAILS: (to: string, amount: string, fee: string) => 
      `${EMOJIS.SEND} To: ${to}\n${EMOJIS.AMOUNT} Amount: ${amount}\n${EMOJIS.FEE} Fee: ${fee}`,
    BUTTON_CONFIRM: `${EMOJIS.CONFIRM} Confirm`,
    BUTTON_CANCEL: `${EMOJIS.CLOSE} Cancel`,
    SUCCESS: `${EMOJIS.SUCCESS} Transaction Sent!`,
    CANCELLED: `${EMOJIS.CLOSE} Transaction Cancelled.`,
  },
  SECURITY: {
    TITLE: `Security Settings\n${EMOJIS.SEPARATOR}`,
    BUTTON_PIN: `${EMOJIS.PIN} Change PIN`,
    BUTTON_LIMIT: `${EMOJIS.LIMIT} Daily Limit`,
    BUTTON_LOCK: `${EMOJIS.LOCK} Lock Wallet`,
  },
  HISTORY: {
    TITLE: `Recent Transactions\n${EMOJIS.SEPARATOR}`,
    ITEM: (status: string, type: string, amount: string, time: string) => 
      `${status} ${type} ${amount} • ${time}`,
  },
  ERRORS: {
    INVALID_ADDRESS: `${EMOJIS.FAILED} Invalid address. Please try again.`,
    INVALID_AMOUNT: `${EMOJIS.FAILED} Invalid amount. Please try again.`,
    GENERIC: `${EMOJIS.FAILED} Something went wrong.`,
  }
};
