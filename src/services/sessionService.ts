import prisma from './prisma';
import { Prisma } from '@prisma/client';

export interface SessionData {
    step: 'IDLE' | 'SEND_ASK_ADDRESS' | 'SEND_ASK_AMOUNT' | 'ADD_TOKEN_ASK_ADDRESS';
    txData: {
        to?: string;
        amount?: string;
    };
    addTokenData?: {
        chain?: string;
        address?: string;
        symbol?: string;
        name?: string;
        decimals?: number;
    };
}

const DEFAULT_SESSION: SessionData = { step: 'IDLE', txData: {} };

export const SessionService = {
    getSession: async (telegramId: number): Promise<SessionData> => {
        // We query by telegramId, so we need to find the user first or join
        // But since session is linked to user_id (UUID), it's cleaner to query User with Session include
        const user = await prisma.user.findUnique({
            where: { telegram_id: BigInt(telegramId) },
            include: { session: true }
        });

        if (!user) {
            // User might not exist yet if they haven't started, but usually bot.start handles this.
            // Return default memory object just in case
            return DEFAULT_SESSION;
        }

        if (!user.session) {
            // Lazy create session if it doesn't exist
            await prisma.session.create({
                data: {
                    user_id: user.id,
                    step: 'IDLE',
                    data: {}
                }
            });
            return DEFAULT_SESSION;
        }

        // Cast JSON to typed interface
        // Prisma JSON type is 'any', so we need careful casting or validation if critical
        const sessionData = user.session.data as unknown as Partial<SessionData>;

        return {
            step: (user.session.step as SessionData['step']) || 'IDLE',
            txData: sessionData.txData || {},
            addTokenData: sessionData.addTokenData
        };
    },

    updateSession: async (telegramId: number, partialData: Partial<SessionData>) => {
        const user = await prisma.user.findUnique({ where: { telegram_id: BigInt(telegramId) } });
        if (!user) return;

        const existing = await prisma.session.findUnique({ where: { user_id: user.id } });

        // Prepare new data structure
        let stepsToSave = partialData.step || 'IDLE';
        let txDataToSave = partialData.txData || {};
        let addTokenDataToSave = partialData.addTokenData;

        // If session exists, merge with existing data
        if (existing) {
            stepsToSave = partialData.step || (existing.step as SessionData['step']);
            const existingData = existing.data as unknown as SessionData; // Safe cast
            txDataToSave = { ...existingData.txData, ...partialData.txData };
            addTokenDataToSave = partialData.addTokenData !== undefined ? partialData.addTokenData : existingData.addTokenData;
        }

        const finalData = {
            txData: txDataToSave,
            addTokenData: addTokenDataToSave
        };

        // Upsert handles both Create and Update cases cleanly
        await prisma.session.upsert({
            where: { user_id: user.id },
            create: {
                user_id: user.id,
                step: stepsToSave,
                data: finalData as unknown as Prisma.InputJsonValue
            },
            update: {
                step: stepsToSave,
                data: finalData as unknown as Prisma.InputJsonValue
            }
        });
    },

    clearSession: async (telegramId: number) => {
        const user = await prisma.user.findUnique({ where: { telegram_id: BigInt(telegramId) } });
        if (!user) return;

        // Upsert to ensure it exists and reset it
        await prisma.session.upsert({
            where: { user_id: user.id },
            create: {
                user_id: user.id,
                step: 'IDLE',
                data: {}
            },
            update: {
                step: 'IDLE',
                data: {}
            }
        });
    }
};
