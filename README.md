# Telegram Crypto Wallet Bot & Web App

A professional, hybrid Telegram Wallet that combines a native bot with a high-performance React Web App (Mini App).

## Features

- **Hybrid Architecture**:
  - **Bot**: Entry point, notifications, quick alerts.
  - **Web App**: Full DeFi dashboard, sending, receiving, history.
- **Security**:
  - AES-256 encryption for private keys.
  - Telegram Web App signature validation for API requests.
  - PIN protection (backend verification).
- **Tech Stack**:
  - **Backend**: Node.js, Telegraf, Express, Prisma (PostgreSQL).
  - **Frontend**: React, Vite, Tailwind CSS, Telegram Web App SDK.

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
3. Set this URL as the **Menu Button URL** in @BotFather or use it in `WEBAPP_URL` env var.
4. **Important**: You also need to expose the Backend API if testing on a real device, or ensure `VITE_API_URL` points to the public API URL.

## Deployment

1. **Backend**: Deploy to a VPS (DigitalOcean, Hetzner) or PaaS (Render, Railway).
2. **Frontend**: Deploy `webapp/dist` to Vercel, Netlify, or GitHub Pages.
3. Update `WEBAPP_URL` in backend `.env` to point to the production frontend.
4. Update `VITE_API_URL` in frontend build settings to point to the production backend.
