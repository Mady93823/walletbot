import { Telegraf, Context, Markup } from 'telegraf';
import * as dotenv from 'dotenv';
import { COPY } from './constants/copy';
import { EMOJIS } from './constants/emojis';
import { Keyboards } from './ui/keyboards';
import { Messages } from './ui/messages';
import { WalletService } from './services/walletService';
import { TransactionService } from './services/transactionService';
import { UserService } from './services/userService';
import { generateQRCode } from './utils/qr';
import { startApiServer } from './api/server';

dotenv.config();

if (!process.env.BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is not defined in .env file');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Simple in-memory session store
interface SessionData {
  step: 'IDLE' | 'SEND_ASK_ADDRESS' | 'SEND_ASK_AMOUNT';
  txData: {
    to?: string;
    amount?: string;
  };
}

const sessions = new Map<number, SessionData>();

const getSession = (userId: number): SessionData => {
  if (!sessions.has(userId)) {
    sessions.set(userId, { step: 'IDLE', txData: {} });
  }
  return sessions.get(userId)!;
};

const resetSession = (userId: number) => {
  sessions.set(userId, { step: 'IDLE', txData: {} });
};

// --- Middleware ---
bot.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('Error handling update:', err);
    try {
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery(COPY.ERRORS.GENERIC);
        } else if (ctx.message) {
            await ctx.reply(COPY.ERRORS.GENERIC);
        }
    } catch (e) {
        // Ignore if we can't reply
    }
  }
});

// --- Commands ---

bot.start(async (ctx) => {
  resetSession(ctx.from.id);
  // Ensure user exists in DB
  await UserService.getOrCreateUser(ctx.from.id);
  
  // Send Welcome Image + Text + Web App Button
  // Using a reliable placeholder image and standard Markdown
  await ctx.replyWithPhoto(
      'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 
      {
          caption: `💼 *Your Crypto Wallet Inside Telegram*\nFast • Secure • Professional\n\nTap below to open your wallet app 👇`,
          parse_mode: 'Markdown',
          reply_markup: {
              inline_keyboard: [
                  [
                      { 
                          text: '🚀 Open Wallet App', 
                          web_app: { url: process.env.WEBAPP_URL || 'https://trae-wallet-demo.vercel.app' } 
                      }
                  ],
                  ...Keyboards.onboarding.reply_markup.inline_keyboard
              ]
          }
      }
  );
});

// --- Actions ---

// 1. Create Wallet -> Dashboard
bot.action('create_wallet', async (ctx) => {
  await ctx.answerCbQuery('Creating wallet...');
  await ctx.sendChatAction('typing'); // UX improvement
  
  try {
    const walletData = await WalletService.createWallet(ctx.from.id);
    
    // In a real app, show Private Key ONCE here!
    await ctx.reply(
        `⚠️ **SAVE YOUR PRIVATE KEY** ⚠️\n\n\`${walletData.privateKey}\`\n\nThis key is encrypted in our database, but you should keep a backup. We cannot recover it if you lose access.`,
        { parse_mode: 'Markdown' }
    );
    
    // Get wallet info for dashboard
    const wallet = await WalletService.getWallet(ctx.from.id);
    if (!wallet) throw new Error('Wallet creation failed');

    const balance = await wallet.getBalance();

    await ctx.reply(
      Messages.dashboard(balance, 'ETH', wallet.address),
      Keyboards.dashboard
    );
  } catch (e: any) {
    if (e.message === 'Wallet already exists') {
        const wallet = await WalletService.getWallet(ctx.from.id);
        if (wallet) {
            const balance = await wallet.getBalance();
            await ctx.editMessageText(
                Messages.dashboard(balance, 'ETH', wallet.address),
                Keyboards.dashboard
            );
            return;
        }
    }
    await ctx.reply(COPY.ERRORS.GENERIC);
  }
});

bot.action('restore_wallet', async (ctx) => {
    await ctx.answerCbQuery('Restore not implemented in this demo');
});

bot.action('help', async (ctx) => {
    await ctx.answerCbQuery('Help section placeholder');
});

// 2. Dashboard Actions
bot.action('receive', async (ctx) => {
  await ctx.sendChatAction('upload_photo');
  const wallet = await WalletService.getWallet(ctx.from.id);
  if (!wallet) return ctx.answerCbQuery('Please create a wallet first');
  
  const qrBuffer = await generateQRCode(wallet.address);

  await ctx.replyWithPhoto({ source: qrBuffer }, {
    caption: COPY.RECEIVE.TITLE(wallet.address),
    parse_mode: 'Markdown',
    ...Keyboards.receive
  });
  // Clean up old message if possible or just leave it
  try { await ctx.deleteMessage(); } catch (e) {}
});

bot.action('history', async (ctx) => {
  const history = await TransactionService.getHistory(ctx.from.id);
  // We need to adapt the Transaction object to match what Messages.history expects
  // The service already returns formatted objects
  await ctx.editMessageText(
    Messages.history(history),
    Keyboards.backToDashboard
  );
});

bot.action('security', async (ctx) => {
  await ctx.editMessageText(
    COPY.SECURITY.TITLE,
    Keyboards.security
  );
});

bot.action('back_to_dashboard', async (ctx) => {
  resetSession(ctx.from.id);
  const wallet = await WalletService.getWallet(ctx.from.id);
  
  if (!wallet) {
    resetSession(ctx.from.id);
    await UserService.getOrCreateUser(ctx.from.id);
    // If we can't edit, reply new
    try {
        await ctx.deleteMessage();
    } catch(e) {}
    return ctx.reply(COPY.ONBOARDING.WELCOME(ctx.from.first_name), Keyboards.onboarding);
  }

  const balance = await wallet.getBalance();
  const dashboardMsg = Messages.dashboard(balance, 'ETH', wallet.address);

  try {
      // Try to edit existing message (works if it was text)
      await ctx.editMessageText(dashboardMsg, Keyboards.dashboard);
  } catch (e) {
      // If edit fails (e.g. previous message was a photo), delete and send new
      try { await ctx.deleteMessage(); } catch (delErr) {}
      await ctx.reply(dashboardMsg, Keyboards.dashboard);
  }
});

// 3. Receive Actions
bot.action('copy_address', async (ctx) => {
  const wallet = await WalletService.getWallet(ctx.from.id);
  if (wallet) {
      // Send address as separate message for easy copying
      await ctx.reply(`\`${wallet.address}\``, { parse_mode: 'Markdown' });
      await ctx.answerCbQuery('Address sent to chat!');
  }
});

bot.action('show_qr', async (ctx) => {
    // Already showing QR in the new flow, but if called from elsewhere:
    await ctx.answerCbQuery('Refreshing QR...');
    const wallet = await WalletService.getWallet(ctx.from.id);
    if (wallet) {
        await ctx.sendChatAction('upload_photo');
        const qrBuffer = await generateQRCode(wallet.address);
        await ctx.replyWithPhoto({ source: qrBuffer }, {
             caption: `\`${wallet.address}\``,
             parse_mode: 'Markdown'
        });
    }
});

// 4. Send Flow
bot.action('send_start', async (ctx) => {
  const wallet = await WalletService.getWallet(ctx.from.id);
  if (!wallet) return ctx.answerCbQuery('No wallet found');

  const session = getSession(ctx.from.id);
  session.step = 'SEND_ASK_ADDRESS';
  
  await ctx.editMessageText(
    COPY.SEND.ASK_ADDRESS,
    Keyboards.cancelOnly
  );
});

bot.action('cancel_flow', async (ctx) => {
  resetSession(ctx.from.id);
  await ctx.answerCbQuery('Cancelled');
  
  const wallet = await WalletService.getWallet(ctx.from.id);
  if (wallet) {
    const balance = await wallet.getBalance();
    const dashboardMsg = Messages.dashboard(balance, 'ETH', wallet.address);
    
    try {
        await ctx.editMessageText(dashboardMsg, Keyboards.dashboard);
    } catch (e) {
        try { await ctx.deleteMessage(); } catch(delErr) {}
        await ctx.reply(dashboardMsg, Keyboards.dashboard);
    }
  } else {
    resetSession(ctx.from.id);
    await UserService.getOrCreateUser(ctx.from.id);
    try { await ctx.deleteMessage(); } catch(e) {}
    await ctx.reply(COPY.ONBOARDING.WELCOME(ctx.from.first_name), Keyboards.onboarding);
  }
});

bot.action('confirm_tx', async (ctx) => {
  const session = getSession(ctx.from.id);
  if (session.step !== 'SEND_ASK_AMOUNT') return;
  
  if (!session.txData.to || !session.txData.amount) {
      return ctx.answerCbQuery('Invalid transaction data');
  }

  // UX: Show pending status
  await ctx.editMessageText(`${EMOJIS.PENDING} Sending transaction...\n(This may take a few seconds)`);
  await ctx.sendChatAction('typing');
  
  const result = await TransactionService.sendTransaction(ctx.from.id, session.txData.to, session.txData.amount);
  
  resetSession(ctx.from.id);
  
  if (result.success) {
      await ctx.editMessageText(
          `${COPY.SEND.SUCCESS}\nHash: \`${result.hash}\``,
          { parse_mode: 'Markdown', ...Keyboards.backToDashboard }
      );
  } else {
      await ctx.editMessageText(
          COPY.ERRORS.GENERIC,
          Keyboards.backToDashboard
      );
  }
});

// --- Text Handler for Wizard Steps ---

bot.on('text', async (ctx) => {
  const session = getSession(ctx.from.id);
  const text = ctx.message.text;

  if (session.step === 'SEND_ASK_ADDRESS') {
    // Basic Validation
    if (!text.startsWith('0x') || text.length !== 42) {
       return ctx.reply(COPY.ERRORS.INVALID_ADDRESS, Keyboards.cancelOnly);
    }
    
    session.txData.to = text;
    session.step = 'SEND_ASK_AMOUNT';
    
    // Get real balance to show available
    const wallet = await WalletService.getWallet(ctx.from.id);
    const balance = wallet ? await wallet.getBalance() : '0.00';

    await ctx.reply(`${COPY.SEND.ASK_AMOUNT}\n(Available: ${balance} ETH)`, Keyboards.cancelOnly);
    
  } else if (session.step === 'SEND_ASK_AMOUNT') {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
          return ctx.reply(COPY.ERRORS.INVALID_AMOUNT, Keyboards.cancelOnly);
      }
      
      session.txData.amount = text;
      
      const fee = await TransactionService.estimateFee();
      
      await ctx.reply(
          Messages.confirmTx(session.txData.to!, session.txData.amount!, fee),
          Keyboards.confirmTransaction
      );
  }
});

// --- Launch ---
console.log('Starting bot...');

// Start API Server
startApiServer();

bot.launch().then(() => {
    console.log('Bot started!');
}).catch((err) => {
    console.error('Failed to start bot', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
