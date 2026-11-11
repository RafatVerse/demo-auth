import { HashAlgorithm, TOTPAccount } from '../types';

/**
 * Base32 character set per RFC 4648
 */
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a base32 string into a Uint8Array
 */
export function base32ToUint8Array(base32: string): Uint8Array {
  const sanitized = base32.toUpperCase().replace(/[\s=-]/g, '');
  if (!sanitized) {
    throw new Error('Secret is empty');
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: "${char}"`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Validates whether a string is valid Base32 secret
 */
export function isValidBase32(secret: string): boolean {
  try {
    const clean = secret.toUpperCase().replace(/[\s=-]/g, '');
    if (clean.length < 4) return false;
    for (let i = 0; i < clean.length; i++) {
      if (BASE32_CHARS.indexOf(clean[i]) === -1) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates an RFC 6238 TOTP code using Web Crypto API
 */
export async function generateTOTP(
  secret: string,
  algorithm: HashAlgorithm = 'SHA-1',
  digits: number = 6,
  period: number = 30,
  epochMs: number = Date.now()
): Promise<string> {
  try {
    const keyBytes = base32ToUint8Array(secret);
    const counter = Math.floor(epochMs / 1000 / period);

    // Convert counter to 8-byte big-endian buffer
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    // Upper 4 bytes
    view.setUint32(0, Math.floor(counter / 0x100000000));
    // Lower 4 bytes
    view.setUint32(4, counter >>> 0);

    // Web Crypto hash name mapping
    let hashName: string = 'SHA-1';
    if (algorithm === 'SHA-256') hashName = 'SHA-256';
    if (algorithm === 'SHA-512') hashName = 'SHA-512';

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes as unknown as ArrayBuffer,
      { name: 'HMAC', hash: { name: hashName } },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, buffer);
    const hmac = new Uint8Array(signature);

    // Dynamic truncation per RFC 4226
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const token = binary % Math.pow(10, digits);
    return token.toString().padStart(digits, '0');
  } catch (error) {
    console.error('TOTP generation error:', error);
    return '------';
  }
}

/**
 * Parses an otpauth://totp URI
 */
export function parseOtpAuthUri(uri: string): Partial<TOTPAccount> | null {
  try {
    const cleanUri = uri.trim();
    if (!cleanUri.startsWith('otpauth://totp/')) {
      return null;
    }

    const url = new URL(cleanUri);
    // Path holds [Issuer:]Account
    let label = decodeURIComponent(url.pathname.replace(/^\/totp\//, '').replace(/^\//, ''));
    let issuer = '';
    let account = '';

    if (label.includes(':')) {
      const parts = label.split(':');
      issuer = parts[0].trim();
      account = parts.slice(1).join(':').trim();
    } else {
      account = label;
    }

    const params = url.searchParams;
    const secret = (params.get('secret') || '').toUpperCase().replace(/\s+/g, '');
    const issuerParam = params.get('issuer');
    if (issuerParam) {
      issuer = issuerParam.trim();
    }

    const algoParam = (params.get('algorithm') || 'SHA-1').toUpperCase();
    let algorithm: HashAlgorithm = 'SHA-1';
    if (algoParam === 'SHA256' || algoParam === 'SHA-256') algorithm = 'SHA-256';
    if (algoParam === 'SHA512' || algoParam === 'SHA-512') algorithm = 'SHA-512';

    const digits = parseInt(params.get('digits') || '6', 10);
    const period = parseInt(params.get('period') || '30', 10);

    if (!secret) return null;

    return {
      issuer: issuer || 'Authentication',
      account: account || 'Account',
      secret,
      algorithm,
      digits: digits === 8 ? 8 : 6,
      period: period > 0 ? period : 30,
    };
  } catch (err) {
    console.error('Failed to parse otpauth URI:', err);
    return null;
  }
}

/**
 * Returns remaining seconds and progress percentage (0 - 100) for a given period
 */
export function getRemainingPeriodInfo(period: number = 30): { remaining: number; progress: number } {
  const currentSec = Math.floor(Date.now() / 1000) % period;
  const remaining = period - currentSec;
  const progress = (remaining / period) * 100;
  return { remaining, progress };
}

/**
 * Format TOTP code with spaces for easier reading e.g. "482 913"
 */
export function formatCode(code: string): string {
  if (!code || code.length <= 4) return code;
  const mid = Math.ceil(code.length / 2);
  return `${code.slice(0, mid)} ${code.slice(mid)}`;
}
