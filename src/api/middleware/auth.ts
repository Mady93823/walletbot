import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

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
  console.log('Auth Middleware - Body:', req.body); // DEBUG LOG
  const { initData } = req.body;

  if (!initData) {
    console.error('Auth Error: Missing initData');
    return res.status(401).json({ error: 'Missing initData' });
  }

  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('Auth Error: Token missing');
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
    
    console.log('Auth Check - Computed:', computedHash, 'Received:', hash); // DEBUG LOG

    if (computedHash !== hash) {
      console.error('Auth Error: Invalid signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Parse user data
    const userStr = urlParams.get('user');
    if (userStr) {
      req.user = JSON.parse(userStr);
      console.log('Auth Success - User:', req.user?.id);
    }
    
    next();
  } catch (error) {
    console.error('Auth Error Exception:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
