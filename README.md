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

Follow these steps to permanently deploy your bot and frontend on a VPS.

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
    *(Run the command `pm2 startup` gives you to ensure auto-start on reboot)*

### Step 2: Frontend Deployment (Nginx)
We will serve the compiled React app directly via Nginx for maximum performance.

1.  **Build the Frontend**:
    ```bash
    cd webapp
    npm install
    npm run build
    ```
    *(This creates a `dist` folder in `webapp/`)*

2.  **Configure aaPanel**:
    - Go to **Websites** -> **Add Site** (e.g., `wallet.yourdomain.com`).
    - Go to **Site Config** -> **Site Directory**.
    - Set **Site Directory** to: `/www/wwwroot/wallet/walletbot/webapp/dist` (adjust path to match your actual path).
    - **Save**.

3.  **Configure Nginx Proxy**:
    - Open the file `NGINX_CONFIG.txt` in your project root.
    - Copy the content.
    - Go to **aaPanel** -> **Site Config** -> **Config (Nginx)**.
    - Paste the content inside the `server { ... }` block.
    - **Save** and **Restart Nginx**.

### Step 3: Connect Frontend to Backend
The `NGINX_CONFIG.txt` automatically forwards any request to `yourdomain.com/api` -> `localhost:3000/api`. No extra config needed in the frontend code!
