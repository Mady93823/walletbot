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
import { fetchTokenMetadata } from './utils/tokenUtils';
import * as AssetService from './services/assetService';
import { ethers } from 'ethers';
import { HttpsProxyAgent } from 'https-proxy-agent';

dotenv.config();

if (!process.env.BOT_TOKEN) {
  logger.error('Error: BOT_TOKEN is not defined in .env file');
  process.exit(1);
}

import { SessionService } from './services/sessionService';
import { logger } from './utils/logger'; // [NEW]

const options: any = {};
if (process.env.PROXY_URL) {
  logger.info(`Using proxy: ${process.env.PROXY_URL}`);
  options.telegram = { agent: new HttpsProxyAgent(process.env.PROXY_URL) };
}

const bot = new Telegraf(process.env.BOT_TOKEN, options);

// --- Middleware ---
bot.use(async (ctx, next) => {
  try {
  } catch (err) {
    logger.error('Error handling update:', err);
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

bot.command('del', async (ctx) => {
  // Format: /del <userid>
  const args = ctx.message.text.split(' ');
  if (args.length !== 2) {
    return ctx.reply('Usage: /del <userid>');
  }

  const targetId = parseInt(args[1]);
  if (isNaN(targetId)) {
    return ctx.reply('Invalid User ID. Must be a number.');
  }

  try {
    const success = await UserService.deleteUser(targetId);
    if (success) {
      await ctx.reply(`✅ User ${targetId} deleted successfully.`);
    } else {
      await ctx.reply(`❌ User ${targetId} not found.`);
    }
  } catch (error: any) {
    logger.error('Delete error:', error);
    await ctx.reply(`❌ Error deleting user: ${error.message}`);
  }
});

bot.command('user', async (ctx) => {
  try {
    const users = await UserService.getAllUsers();
    if (users.length === 0) {
      return ctx.reply('No users found.');
    }

    let message = '👥 *User List*\n\n';
    users.forEach(user => {
      // Cast to any to handle potential missing type definition for username
      const u = user as any;
      const username = u.username ? `@${u.username}` : 'No username';
      message += `User: ${username}\nID: \`${user.telegram_id.toString()}\`\n\n`;
    });

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error: any) {
    logger.error('List users error:', error);
    await ctx.reply(`❌ Error listing users: ${error.message}`);
  }
});

bot.start(async (ctx) => {
  await SessionService.clearSession(ctx.from.id); // [MODIFIED] Async clear
  // Ensure user exists in DB
  const user = await UserService.getOrCreateUser(ctx.from.id, ctx.from.username);

  // Check if wallet exists
  if (user && user.wallet) {
    // Wallet EXISTS: Show Welcome + Open App Button
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
            // Include other options like Help/Restore if needed, but Dashboard is inside the App
            ...Keyboards.onboarding.reply_markup.inline_keyboard
          ]
        }
      }
    );
  } else {
    // Wallet DOES NOT EXIST: Prompt to Create
    await ctx.replyWithPhoto(
      'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      {
        caption: `👋 *Welcome to MyEWallet!*\n\nIt looks like you don't have a wallet yet.\nCreate a new wallet to start sending and receiving crypto securely.\n\n👇 **Start Here**`,
        parse_mode: 'Markdown',
        reply_markup: Keyboards.onboarding.reply_markup
      }
    );
  }
});

// --- Actions ---

bot.action('create_wallet', async (ctx) => {
  try {
    await ctx.answerCbQuery('Creating your wallet...');
    await ctx.editMessageCaption('⏳ Creating your wallet, please wait...');

    // Check if wallet already exists to avoid errors
    const user = await UserService.getOrCreateUser(ctx.from.id, ctx.from.username);
    if (user && user.wallet) {
      await ctx.editMessageCaption('✅ You already have a wallet!');
      return;
    }

    const wallet = await WalletService.createWallet(ctx.from.id);

    await ctx.replyWithPhoto(
      'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      {
        caption: `🎉 *Wallet Created Successfully!*\n\nAddress: \`${wallet.address}\`\n\nYour wallet is now ready to use. Tap below to access it!`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Open Wallet App',
                web_app: { url: process.env.WEBAPP_URL || 'https://trae-wallet-demo.vercel.app' }
              }
            ]
          ]
        }
      }
    );
  } catch (error: any) {
    logger.error('Wallet creation error:', error);
    await ctx.reply(`❌ Failed to create wallet: ${error.message}`);
  }
});

bot.action('restore_wallet', async (ctx) => {
  await ctx.answerCbQuery('Restore feature coming soon!');
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Need help? Contact our support team at @MyEWalletSupport');
});

// --- Actions ---

// 1. Create Wallet -> Dashboard
// Already handled above in the first create_wallet action, removing duplicate code
// bot.action('create_wallet', ...);

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
  try { await ctx.deleteMessage(); } catch (e) { }
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
  await SessionService.clearSession(ctx.from.id);
  const wallet = await WalletService.getWallet(ctx.from.id);

  if (!wallet) {
    await SessionService.clearSession(ctx.from.id);
    await UserService.getOrCreateUser(ctx.from.id);
    // If we can't edit, reply new
    try {
      await ctx.deleteMessage();
    } catch (e) { }
    return ctx.reply(COPY.ONBOARDING.WELCOME(ctx.from.first_name), Keyboards.onboarding);
  }

  const balance = await wallet.getBalance();
  const dashboardMsg = Messages.dashboard(balance, 'ETH', wallet.address);

  try {
    // Try to edit existing message (works if it was text)
    await ctx.editMessageText(dashboardMsg, Keyboards.dashboard);
  } catch (e) {
    // If edit fails (e.g. previous message was a photo), delete and send new
    try { await ctx.deleteMessage(); } catch (delErr) { }
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

  // [MODIFIED] Update session DB
  await SessionService.updateSession(ctx.from.id, { step: 'SEND_ASK_ADDRESS' });

  await ctx.editMessageText(
    COPY.SEND.ASK_ADDRESS,
    Keyboards.cancelOnly
  );
});

bot.action('add_token', async (ctx) => {
  // [MODIFIED] Update session DB
  await SessionService.updateSession(ctx.from.id, {
    step: 'ADD_TOKEN_ASK_ADDRESS',
    addTokenData: { chain: 'ETH' }
  });

  await ctx.editMessageText(
    'Please send the **Token Contract Address** you want to add.\n(Currently strictly supporting Ethereum Mainnet/Sepolia ERC-20)',
    { parse_mode: 'Markdown', ...Keyboards.cancelOnly }
  );
});

bot.action('confirm_add_token', async (ctx) => {
  const session = await SessionService.getSession(ctx.from.id); // [MODIFIED] Async get
  if (!session.addTokenData || !session.addTokenData.address || !session.addTokenData.symbol) {
    return ctx.answerCbQuery('Invalid token data');
  }

  try {
    await ctx.editMessageText(`${EMOJIS.PENDING} Adding token...`);

    // Check if wallet exists
    const user = await UserService.getOrCreateUser(ctx.from.id);
    if (!user.wallet) throw new Error('No wallet found');

    await AssetService.addCustomAsset(user.wallet.id, {
      symbol: session.addTokenData.symbol,
      name: session.addTokenData.name || session.addTokenData.symbol,
      chain: session.addTokenData.chain || 'ETH',
      contract_addr: session.addTokenData.address,
      decimals: session.addTokenData.decimals,
      logo_url: 'https://cryptologos.cc/logos/question-mark.png' // Placeholder
    });

    await ctx.editMessageText(
      `${EMOJIS.SUCCESS} **${session.addTokenData.symbol}** added successfully!`,
      { parse_mode: 'Markdown', ...Keyboards.backToDashboard }
    );
    await SessionService.clearSession(ctx.from.id); // [MODIFIED]

  } catch (error: any) {
    logger.error('Add token error:', error);
    if (error.code === 'P2002') {
      await ctx.editMessageText(`⚠️ **${session.addTokenData.symbol}** is already in your wallet!`, { parse_mode: 'Markdown', ...Keyboards.backToDashboard });
    } else {
      await ctx.editMessageText(`❌ Error adding token: ${error.message}`, Keyboards.backToDashboard);
    }
  }
});

bot.action('cancel_flow', async (ctx) => {
  await SessionService.clearSession(ctx.from.id); // [MODIFIED]
  await ctx.answerCbQuery('Cancelled');

  const wallet = await WalletService.getWallet(ctx.from.id);
  if (wallet) {
    const balance = await wallet.getBalance();
    const dashboardMsg = Messages.dashboard(balance, 'ETH', wallet.address);

    try {
      await ctx.editMessageText(dashboardMsg, Keyboards.dashboard);
    } catch (e) {
      try { await ctx.deleteMessage(); } catch (delErr) { }
      await ctx.reply(dashboardMsg, Keyboards.dashboard);
    }
  } else {
    await SessionService.clearSession(ctx.from.id); // [MODIFIED]
    await UserService.getOrCreateUser(ctx.from.id);
    try { await ctx.deleteMessage(); } catch (e) { }
    await ctx.reply(COPY.ONBOARDING.WELCOME(ctx.from.first_name), Keyboards.onboarding);
  }
});

bot.action('confirm_tx', async (ctx) => {
  const session = await SessionService.getSession(ctx.from.id);
  if (session.step !== 'SEND_ASK_AMOUNT') return;

  if (!session.txData.to || !session.txData.amount) {
    return ctx.answerCbQuery('Invalid transaction data');
  }

  // UX: Show pending status
  await ctx.editMessageText(`${EMOJIS.PENDING} Sending transaction...\n(This may take a few seconds)`);
  await ctx.sendChatAction('typing');

  const result = await TransactionService.sendTransaction(ctx.from.id, session.txData.to, session.txData.amount);

  await SessionService.clearSession(ctx.from.id);

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
  const session = await SessionService.getSession(ctx.from.id); // [MODIFIED]
  const text = ctx.message.text;

  if (session.step === 'SEND_ASK_ADDRESS') {
    // Basic Validation
    if (!text.startsWith('0x') || text.length !== 42) {
      return ctx.reply(COPY.ERRORS.INVALID_ADDRESS, Keyboards.cancelOnly);
    }

    // [MODIFIED] Update session
    await SessionService.updateSession(ctx.from.id, {
      step: 'SEND_ASK_AMOUNT',
      txData: { ...session.txData, to: text }
    });

    // Get real balance to show available
    const wallet = await WalletService.getWallet(ctx.from.id);
    const balance = wallet ? await wallet.getBalance() : '0.00';

    await ctx.reply(`${COPY.SEND.ASK_AMOUNT}\n(Available: ${balance} ETH)`, Keyboards.cancelOnly);

  } else if (session.step === 'SEND_ASK_AMOUNT') {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply(COPY.ERRORS.INVALID_AMOUNT, Keyboards.cancelOnly);
    }

    // [MODIFIED] Update session
    await SessionService.updateSession(ctx.from.id, {
      txData: { ...session.txData, amount: text }
    });

    const fee = await TransactionService.estimateFee();

    await ctx.reply(
      Messages.confirmTx(session.txData.to!, text, fee), // use text directly as amount
      Keyboards.confirmTransaction
    );
  } else if (session.step === 'ADD_TOKEN_ASK_ADDRESS') {
    // Validator
    if (!text.startsWith('0x') || text.length !== 42) {
      return ctx.reply('❌ Invalid contract address. Please start with 0x...', Keyboards.cancelOnly);
    }

    await ctx.reply(`${EMOJIS.PENDING} Fetching token details...`);
    await ctx.sendChatAction('typing');

    // Use provider from env
    const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const metadata = await fetchTokenMetadata(text, provider);

    if (metadata) {
      // [MODIFIED] Update session
      await SessionService.updateSession(ctx.from.id, {
        addTokenData: {
          ...session.addTokenData,
          address: text,
          symbol: metadata.symbol,
          name: metadata.name,
          decimals: metadata.decimals
        }
      });

      await ctx.reply(
        `🔍 **Token Found**\n\nName: ${metadata.name}\nSymbol: ${metadata.symbol}\nDecimals: ${metadata.decimals}\n\nAdd this token to your wallet?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('✅ Yes, Add Token', 'confirm_add_token')],
              [Markup.button.callback('❌ Cancel', 'cancel_flow')]
            ]
          }
        }
      );
    } else {
      await ctx.reply('❌ Could not fetch token details. Is this a valid ERC-20 contract?', Keyboards.cancelOnly);
    }
  }
});

// --- Launch ---
logger.info('Starting bot...');

// Start API Server
startApiServer();

// Add global error handler
bot.catch((err: any, ctx: Context) => {
  logger.error(`Global Bot Error for ${ctx.updateType}`, err);
});

bot.launch().then(() => {
  logger.info('Bot started!');
}).catch((err) => {
  logger.error('Failed to start bot', err);
});

// Enable graceful stop
process.once('SIGINT', () => { logger.info('SIGINT received'); bot.stop('SIGINT') });
process.once('SIGTERM', () => { logger.info('SIGTERM received'); bot.stop('SIGTERM') });
