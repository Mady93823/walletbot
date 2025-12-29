// src/services/securityService.ts
import prisma from './prisma';
import * as bcrypt from 'bcrypt';

export const SecurityService = {
  setPin: async (telegramId: number, pin: string) => {
    const hash = await bcrypt.hash(pin, 10);
    const user = await prisma.user.findUnique({ where: { telegram_id: BigInt(telegramId) } });
    if (!user) throw new Error('User not found');

    await prisma.security.update({
      where: { user_id: user.id },
      data: { pin_hash: hash }
    });
  },

  verifyPin: async (telegramId: number, pin: string) => {
    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(telegramId) },
      include: { security: true }
    });

    if (!user || !user.security || !user.security.pin_hash) return false;

    // Check Lockout
    if (user.security.locked_until && user.security.locked_until > new Date()) {
      throw new Error('Wallet locked. Try again later.');
    }

    const match = await bcrypt.compare(pin, user.security.pin_hash);
    
    if (match) {
      // Reset failures
      if (user.security.failed_attempts > 0) {
        await prisma.security.update({
          where: { user_id: user.id },
          data: { failed_attempts: 0, locked_until: null }
        });
      }
      return true;
    } else {
      // Increment failures
      const failures = user.security.failed_attempts + 1;
      let lockedUntil = null;
      if (failures >= 3) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }

      await prisma.security.update({
        where: { user_id: user.id },
        data: { 
          failed_attempts: failures,
          locked_until: lockedUntil 
        }
      });
      return false;
    }
  },
  
  hasPin: async (telegramId: number) => {
      const user = await prisma.user.findUnique({
          where: { telegram_id: BigInt(telegramId) },
          include: { security: true }
      });
      return !!(user && user.security && user.security.pin_hash);
  }
};
