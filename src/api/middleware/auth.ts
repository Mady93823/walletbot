import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

// Add user to request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        first_name: string;
        username?: string;
        language_code?: string;
      };
    }
  }
}

export const validateTelegramWebAppData = (req: Request, res: Response, next: NextFunction) => {
  // Try to get initData from Header (Preferred) or Body (Fallback)
  const initData = req.header('X-Telegram-Init-Data') || req.body?.initData;

  // Development Bypass (Optional: Remove in production)
  // If no initData is provided and we are in dev mode, we can mock a user
  // This helps with browser testing where Telegram initData is missing
  if (!initData && process.env.NODE_ENV !== 'production') {
    logger.warn('Auth Warning: Missing initData in Dev Mode. Using Mock User.');
    req.user = {
      id: 123456789, // Mock Telegram ID
      first_name: 'DevUser',
      username: 'dev_user',
      language_code: 'en'
    };
    return next();
  }

  if (!initData) {
    logger.error('Auth Error: Missing initData');
    return res.status(401).json({ error: 'Missing initData' });
  }

  const token = process.env.BOT_TOKEN;
  if (!token) {
    logger.error('Auth Error: Token missing');
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Sort keys alphabetically
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // HMAC-SHA256 signature
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    logger.debug(`Auth Check - Computed: ${computedHash} Received: ${hash}`); // DEBUG LOG

    if (computedHash !== hash) {
      logger.error('Auth Error: Invalid signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Parse user data
    const userStr = urlParams.get('user');
    if (userStr) {
      req.user = JSON.parse(userStr);
      logger.info(`Auth Success - User: ${req.user?.id}`);
    }

    next();
  } catch (error) {
    logger.error('Auth Error Exception:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
