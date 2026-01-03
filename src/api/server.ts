import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import apiRoutes from './routes';
import { apiLimiter } from './middleware/rateLimit';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the proxy (needed for rate limiter behind proxies like ngrok/Vite)
app.set('trust proxy', 1);

// Fix BigInt serialization
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

app.use(cors());
app.use(bodyParser.json());

// Apply global rate limiter
app.use('/api', apiLimiter);

// Request Logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

export const startApiServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
  });
};
