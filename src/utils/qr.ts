import * as QRCode from 'qrcode';
import { logger } from './logger';

export const generateQRCode = async (text: string): Promise<Buffer> => {
  try {
    return await QRCode.toBuffer(text, {
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 300,
      margin: 2
    });
  } catch (err) {
    logger.error('Error generating QR code', err);
    throw err;
  }
};
