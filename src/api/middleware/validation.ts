import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../../utils/logger';

// --- Validation Utils ---
const ethAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum Address");
const amountSchema = z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount");

// --- Schemas ---

export const schemas = {
    // Asset Management
    toggleAsset: z.object({
        assetId: z.string().uuid(),
        isEnabled: z.boolean()
    }),

    addCustomAsset: z.object({
        symbol: z.string().min(2).max(10),
        name: z.string().min(2).max(50),
        chain: z.enum(['ETH', 'BSC', 'TRON']), // Extend as needed
        contract_addr: ethAddressSchema.optional(),
        decimals: z.number().min(0).max(32),
        logo_url: z.string().url().optional()
    }),

    // Security
    setPin: z.object({
        pin: z.string().length(4).regex(/^\d+$/, "PIN must be numeric")
    }),

    verifyPin: z.object({
        pin: z.string().length(4).regex(/^\d+$/, "PIN must be numeric")
    }),

    // Transactions
    estimateFee: z.object({
        rpcUrl: z.string().url().optional()
    }),

    sendTransaction: z.object({
        to: ethAddressSchema,
        amount: amountSchema,
        pin: z.string().length(4),
        rpcUrl: z.string().url().optional(),
        chainId: z.number().int().positive().optional(),
        memo: z.string().max(100).optional(), // Max 100 chars for memo
        assetId: z.string().optional()
    })
};

// --- Middleware Factory ---

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = (error as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
                logger.warn(`Validation Failed [${req.path}]: ${errors}`);
                res.status(400).json({ error: `Validation Error: ${errors}` });
            } else {
                next(error);
            }
        }
    };
};
