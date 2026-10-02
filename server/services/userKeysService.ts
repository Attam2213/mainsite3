import User from '../models/User';
import { makeNonce, packEncrypted, unpackDecrypted } from '../utils/encryption';

export interface UserKeys {
  openai: string | null;
  anthropic: string | null;
  gemini: string | null;
  nonce: string;
}

export async function saveUserKeys(
  userId: string,
  input: { openAI?: string; anthropic?: string; gemini?: string }
): Promise<void> {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  let nonce = user.aiKeyNonce;
  if (!nonce) {
    nonce = makeNonce();
    user.aiKeyNonce = nonce;
  }
  if (typeof input.openAI === 'string') {
    user.aiOpenAIEnc = input.openAI.trim() ? packEncrypted(input.openAI.trim(), nonce) : null;
  }
  if (typeof input.anthropic === 'string') {
    user.aiAnthropicEnc = input.anthropic.trim() ? packEncrypted(input.anthropic.trim(), nonce) : null;
  }
  if (typeof input.gemini === 'string') {
    user.aiGeminiEnc = input.gemini.trim() ? packEncrypted(input.gemini.trim(), nonce) : null;
  }
  await user.save();
}

export async function getUserKeysStatus(userId: string): Promise<{
  openAI: boolean;
  anthropic: boolean;
  gemini: boolean;
}> {
  const u = await User.findByPk(userId, { attributes: ['id', 'aiOpenAIEnc', 'aiAnthropicEnc', 'aiGeminiEnc'] });
  return {
    openAI: !!u?.aiOpenAIEnc,
    anthropic: !!u?.aiAnthropicEnc,
    gemini: !!u?.aiGeminiEnc,
  };
}

export async function resolveKeysForUser(userId: string): Promise<{
  keys: UserKeys;
  usedOwnKey: boolean;
  preferredProvider: 'openai' | 'anthropic' | 'gemini';
}> {
  const u = await User.findByPk(userId);
  if (!u) throw new Error('User not found');
  const nonce = u.aiKeyNonce || makeNonce();
  const keys: UserKeys = {
    openai: u.aiOpenAIEnc ? unpackDecrypted(u.aiOpenAIEnc, nonce) : null,
    anthropic: u.aiAnthropicEnc ? unpackDecrypted(u.aiAnthropicEnc, nonce) : null,
    gemini: u.aiGeminiEnc ? unpackDecrypted(u.aiGeminiEnc, nonce) : null,
    nonce,
  };
  const usedOwnKey = !!(keys.openai || keys.anthropic || keys.gemini);
  let preferredProvider: 'openai' | 'anthropic' | 'gemini' = 'openai';
  if (keys.openai) preferredProvider = 'openai';
  else if (keys.anthropic) preferredProvider = 'anthropic';
  else if (keys.gemini) preferredProvider = 'gemini';
  else {
    if (process.env.ANTHROPIC_API_KEY) preferredProvider = 'anthropic';
    else if (process.env.GOOGLE_API_KEY) preferredProvider = 'gemini';
    else preferredProvider = 'openai';
  }
  return { keys, usedOwnKey, preferredProvider };
}

export function getOurKey(provider: 'openai' | 'anthropic' | 'gemini'): string | null {
  if (provider === 'openai') return process.env.OPENAI_API_KEY || null;
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY || null;
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null;
}

export async function getApiKeyForCall(
  userId: string,
  provider: 'openai' | 'anthropic' | 'gemini'
): Promise<{ key: string; usedOwnKey: boolean } | null> {
  const r = await resolveKeysForUser(userId);
  const userKey =
    provider === 'openai' ? r.keys.openai :
    provider === 'anthropic' ? r.keys.anthropic :
    r.keys.gemini;
  if (userKey) return { key: userKey, usedOwnKey: true };
  const our = getOurKey(provider);
  if (our) return { key: our, usedOwnKey: false };
  return null;
}
