# Telegram Crypto Wallet Bot & Web App

A professional, hybrid Telegram Wallet that combines a native bot with a high-performance React Web App (Mini App).

## Features

- **Hybrid Architecture**:
  - **Bot**: Entry point, notifications, quick alerts.
  - **Web App**: Full DeFi dashboard, sending, receiving, history.
- **Security**:
  - **Private Proxy**: Includes a Cloudflare Worker script (`CLOUDFLARE_WORKER.js`) to bypass 403 blocks from Telegram in restricted regions.
  - AES-256 encryption for private keys.
  - Telegram Web App signature validation for API requests.
  - PIN protection (backend verification).
- **Tech Stack**:
  - **Backend**: Node.js, Telegraf, Express, Prisma (PostgreSQL).
  - **Frontend**: React, Vite, Tailwind CSS, Telegram Web App SDK.

## Recent Updates

- **Production Deployment Config**: Added `ecosystem.config.js` for PM2 and `NGINX_CONFIG.txt` for easy aaPanel deployment.
- **Wallet Balance Auto-Repair**: Implemented logic to automatically detect and fix negative balances (resetting to default 1.0 ETH for testnet) ensuring data integrity between mock and real database values.
- **Enhanced Token Management**:
  - Added strict contract address validation for custom tokens (ERC-20, TRC-20, BEP-20).
  - Implemented automatic fallback logo generation for tokens with broken or missing icons.
- **UI/UX Refinements**:
  - Fixed Asset Selection Modal z-index issues preventing overlap with navigation bars.
  - Assets in the "Send" screen are now sorted by balance (descending) for easier access.

## Project Structure

- `src/`: Backend bot and API logic.
  - `bot.ts`: Main bot entry point.
  - `api/`: Express server and routes.
  - `services/`: Business logic (Wallet, User, Transaction).
- `webapp/`: Frontend React application.
  - `src/pages/`: UI Screens (Home, Send, Receive, History).
  - `src/api.ts`: API client with auto-auth.

## Setup & Development

### 1. Prerequisites

- Node.js & npm
- PostgreSQL Database
- Telegram Bot Token (from @BotFather)

### 2. Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/wallet_db"
BOT_TOKEN="your_telegram_bot_token"
ENCRYPTION_KEY="your_32_byte_hex_key"
RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
PORT=3000
# Optional: Proxy URL (if running in restricted regions like China/Russia/Hetzner)
# PROXY_URL="http://user:pass@host:port"
# Optional: Custom Telegram API Root (Reverse Proxy)
# TELEGRAM_API_ROOT="https://api.telegram-proxy.org"
# URL where your Web App is hosted (for production)
WEBAPP_URL="https://your-app-url.vercel.app"
```

In `webapp/.env` (optional for local dev if using proxy, but Vite default is 5173):
```env
VITE_API_URL="http://localhost:3000/api"
```

### 3. Installation

```bash
# Install root dependencies (Backend)
npm install

# Install frontend dependencies
cd webapp
npm install
cd ..
```

### 4. Running Locally

To run both the Bot/API and the Frontend simultaneously:

```bash
npm run dev:all
```

- **Backend/Bot**: Runs on `http://localhost:3000`
- **Frontend**: Runs on `http://localhost:5173`

### 5. Connecting Telegram to Localhost

Since Telegram Apps require HTTPS, you need to expose your local frontend:

1. Use **ngrok** or **localtunnel**:
   ```bash
   npx ngrok http 5173
   ```
2. Copy the HTTPS URL (e.g., `https://random-id.ngrok-free.app`).

---

## 🚀 Production Deployment (aaPanel / VPS)

### Option 1: The "Easy" Method (Recommended)
This method runs both backend and frontend as Node.js processes. It's easier to configure in aaPanel.

1.  **Start Everything with PM2**:
    ```bash
    git pull
    npm install
    cd webapp && npm install && npm run build && cd ..
    npm run build
    npx pm2 start ecosystem.config.js
    npx pm2 save
    ```
    *This starts the Backend on port 3000 and the Frontend on port 3001.*

2.  **Configure aaPanel**:
    - Go to **Websites** -> **Add Site** (e.g., `wallet.yourdomain.com`).
    - Go to **Site Config** -> **Reverse Proxy**.
    - Click **Add Reverse Proxy**:
      - **Target URL**: `http://127.0.0.1:3001`
      - **Sent Domain**: `$host`
      - **Save**.

That's it! Your site `wallet.yourdomain.com` will now serve the frontend, and the frontend will automatically talk to the backend.

### Option 2: The "Performance" Method (Nginx Static)
Use this if you want Nginx to serve static files directly (faster, but harder config).

1.  **Start Backend Only**:
    ```bash
    npx pm2 start ecosystem.config.js --only wallet-bot
    ```

2.  **Build Frontend**:
    ```bash
    cd webapp && npm run build
    ```

3.  **Configure aaPanel**:
    - Set **Site Directory** to: `/www/wwwroot/wallet/walletbot/webapp/dist`
    - Copy content from `NGINX_CONFIG.txt` into the **Config (Nginx)** section.

