# Wallet Bot & WebApp

A Telegram Mini App Wallet built with React, Node.js, and Prisma.

## 🚀 Features
- **Crypto Wallet**: Send/Receive ETH, USDT, and other tokens.
- **Real-time Balance**: View balances with mock/real-time pricing.
- **Secure**: PIN protection and encrypted private keys.
- **Bot Integration**: Telegram bot for easy access.

## 🛠 Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL
- Telegram Bot Token

### Local Development
1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd walletbot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd webapp && npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` and `BOT_TOKEN`.
   - Set `RPC_URL` for blockchain connection (Default: Sepolia).

4. **Run Locally**
   ```bash
   # Terminal 1: Backend & Bot
   npm run dev

   # Terminal 2: Frontend
   cd webapp && npm run dev
   ```

## 🚀 Production Deployment (aaPanel / VPS)

### Step 1: Backend Deployment (PM2)
We use **PM2** to keep the bot running 24/7.

1.  **Install PM2**:
    ```bash
    npm install -g pm2
    ```

2.  **Build & Start**:
    ```bash
    npm run build
    npm run db:push
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    ```

### Step 2: Frontend Deployment (Nginx)
1.  **Build the Frontend**:
    ```bash
    cd webapp
    npm install
    npm run build
    ```
    This creates a `dist` folder.

2.  **Configure Nginx (aaPanel)**:
    - Go to **Website** -> **Add Site**.
    - **Domain**: Your domain (e.g., `wallet.example.com`).
    - **Root Directory**: Point to `/www/wwwroot/wallet/walletbot/webapp/dist`.
    - **Vite Config**:
      In "Config" or "URL Rewrite" / "ConfigFile":
      Ensure it serves `index.html` for SPA routing.
      ```nginx
      location / {
        try_files $uri $uri/ /index.html;
      }
      ```

### Step 3: Mainnet Configuration
To switch to Mainnet:
1.  Edit `.env` file:
    ```bash
    nano .env
    ```
2.  Add/Update:
    ```
    RPC_URL=https://ethereum-rpc.publicnode.com
    ```
3.  Restart Bot:
    ```bash
    pm2 restart wallet-bot
    ```

## 📝 Recent Updates
- **Mainnet Ready**: Removed testnet airdrops, set default balances to 0.0.
- **Logo Added**: Custom logo on Home screen.
- **Proxy Support**: Cloudflare Worker script included for Telegram API proxy.
