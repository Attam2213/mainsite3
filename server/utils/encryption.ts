import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGO = 'aes-256-gcm';
const MASTER_KEY_SALT = process.env.AI_KEYS_MASTER_SALT || 'wexa-su-ai-keys-master-salt-v1-2026';
const MASTER_PASSWORD = process.env.AI_KEYS_MASTER_PASSWORD || process.env.JWT_SECRET || 'change-this-master-password-in-prod-env-wexa-su';

function getMasterKey(): Buffer {
  return scryptSync(MASTER_PASSWORD, MASTER_KEY_SALT, 32);
}

export function encrypt(plainText: string, nonce: string): { ciphertext: string; tag: string } {
  const key = getMasterKey();
  const ivBuf = scryptSync(nonce + MASTER_KEY_SALT, 'iv', 12);
  const cipher = createCipheriv(ALGO, key, ivBuf);
  const ct = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag().toString('base64');
  return { ciphertext: ct.toString('base64'), tag };
}

export function decrypt(cipherB64: string, tagB64: string, nonce: string): string {
  const key = getMasterKey();
  const ivBuf = scryptSync(nonce + MASTER_KEY_SALT, 'iv', 12);
  const decipher = createDecipheriv(ALGO, key, ivBuf);
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const pt = Buffer.concat([decipher.update(Buffer.from(cipherB64, 'base64')), decipher.final()]);
  return pt.toString('utf8');
}

export function makeNonce(): string {
  return randomBytes(24).toString('base64url');
}

export function packEncrypted(value: string, nonce: string): string {
  if (!value) return '';
  const { ciphertext, tag } = encrypt(value, nonce);
  return `${tag}.${ciphertext}`;
}

export function unpackDecrypted(packed: string, nonce: string): string | null {
  if (!packed || !nonce) return null;
  try {
    const [tag, ct] = packed.split('.');
    if (!tag || !ct) return null;
    return decrypt(ct, tag, nonce);
  } catch {
    return null;
  }
}
