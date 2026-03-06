import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_change_me_32_chars'; // Must be 32 chars
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
  if (!text) return text;
  // Ensure key is 32 bytes
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return text;
  // Check if text is encrypted format (iv:content)
  const textParts = text.split(':');
  if (textParts.length < 2) return text; // Return as is if not encrypted (migration path)

  try {
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
      const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
  } catch (e) {
      console.error('Decryption failed:', e);
      return text; // Fallback
  }
}
