// src/services/userService.ts
import prisma from './prisma';

export const UserService = {
  getOrCreateUser: async (telegramId: number) => {
    let user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(telegramId) },
      include: { wallet: true, security: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegram_id: BigInt(telegramId),
          security: {
            create: {
              daily_limit: 1000,
              failed_attempts: 0
            }
          }
        },
        include: { wallet: true, security: true }
      });
    }

    return user;
  },

  getUser: async (telegramId: number) => {
    return prisma.user.findUnique({
      where: { telegram_id: BigInt(telegramId) },
      include: { wallet: true, security: true }
    });
  }
};
