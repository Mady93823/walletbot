import { ethers } from 'ethers';
import { logger } from './logger';

// Minimal ERC-20 ABI to fetch metadata
const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)'
];

export interface TokenMetadata {
    name: string;
    symbol: string;
    decimals: number;
}

export const fetchTokenMetadata = async (
    contractAddress: string,
    provider: ethers.Provider
): Promise<TokenMetadata | null> => {
    try {
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

        // Fetch in parallel for speed
        const [name, symbol, decimals] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.decimals()
        ]);

        return {
            name,
            symbol,
            decimals: Number(decimals) // Ensure it's a number
        };
    } catch (error) {
        logger.error(`Error fetching token metadata for ${contractAddress}:`, error);
        return null;
    }
};
