// src/services/userService.ts
import prisma from './prisma';
import { User, Wallet, Security } from '@prisma/client';

type UserWithRelations = User & {
  wallet: Wallet | null;
  security: Security | null;
};

export const UserService = {
  getOrCreateUser: async (telegramId: number, username?: string): Promise<UserWithRelations> => {
    let user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(telegramId) },
      include: { wallet: true, security: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegram_id: BigInt(telegramId),
          username: username,
          security: {
            create: {
              daily_limit: 1000,
              failed_attempts: 0
            }
          }
        } as any,
        include: { wallet: true, security: true }
      });
    } else if (username && (user as any).username !== username) {
        // Update username if changed
        user = await prisma.user.update({
            where: { id: user.id },
            data: { username } as any,
            include: { wallet: true, security: true }
        });
    }

    return user as unknown as UserWithRelations;
  },

  getUser: async (telegramId: number) => {
    return prisma.user.findUnique({
      where: { telegram_id: BigInt(telegramId) },
      include: { wallet: true, security: true }
    });
  },

  getAllUsers: async () => {
    return prisma.user.findMany({
      orderBy: { created_at: 'desc' }
    });
  },

  deleteUser: async (telegramId: number) => {
    const user = await prisma.user.findUnique({
        where: { telegram_id: BigInt(telegramId) },
        include: { wallet: true }
    });

    if (!user) return false;

    // Delete related data manually to ensure clean removal
    // 1. Delete Transactions
    await prisma.transaction.deleteMany({
        where: { user_id: user.id }
    });

    // 2. Delete Security
    await prisma.security.delete({
        where: { user_id: user.id }
    }).catch(() => {}); // Ignore if not exists

    // 3. Delete Wallet and Assets
    if (user.wallet) {
        await prisma.asset.deleteMany({
            where: { wallet_id: user.wallet.id }
        });
        await prisma.wallet.delete({
            where: { id: user.wallet.id }
        });
    }

    // 4. Delete User
    await prisma.user.delete({
        where: { id: user.id }
    });

    return true;
  }
};
