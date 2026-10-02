import type { AIProvider } from '../models/AITransaction';

export const AI_PRICING: Record<AIProvider, {
  inputPer1M: number;
  outputPer1M: number;
  defaultModel: string;
  currency: 'USD' | 'RUB';
  minBilledRub: number;
}> = {
  openai: {
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    defaultModel: 'gpt-4o-mini',
    currency: 'USD',
    minBilledRub: 5,
  },
  anthropic: {
    inputPer1M: 0.8,
    outputPer1M: 4.0,
    defaultModel: 'claude-3-haiku-20240307',
    currency: 'USD',
    minBilledRub: 15,
  },
  gemini: {
    inputPer1M: 0.075,
    outputPer1M: 0.3,
    defaultModel: 'gemini-1.5-flash',
    currency: 'USD',
    minBilledRub: 4,
  },
};

export const USD_TO_RUB = parseFloat(process.env.USD_TO_RUB || '100');
export const MARKUP_PERCENT = parseFloat(process.env.AI_PROFIT_MARKUP_PERCENT || '200');

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export interface CostBreakdown {
  provider: AIProvider;
  inputTokens: number;
  outputTokensEstimated: number;
  ourCostUSD: number;
  ourCostRUB: number;
  markupMultiplier: number;
  userBilledRUB: number;
  profitRUB: number;
  minBilledApplied: boolean;
}

export function calcCost(
  provider: AIProvider,
  inputText: string,
  estimatedOutMult = 2.5,
  overProvision = 1.5,
): CostBreakdown {
  const cfg = AI_PRICING[provider];
  const inputTokens = estimateTokens(inputText);
  const outputTokensEstimated = Math.ceil(inputTokens * estimatedOutMult * overProvision);
  const ourCostUSD =
    (inputTokens / 1_000_000) * cfg.inputPer1M +
    (outputTokensEstimated / 1_000_000) * cfg.outputPer1M;
  const ourCostRUB = ourCostUSD * USD_TO_RUB;
  const markupMultiplier = 1 + MARKUP_PERCENT / 100;
  const billedBeforeMin = Math.max(0.01, ourCostRUB * markupMultiplier);
  const minBilledApplied = billedBeforeMin < cfg.minBilledRub;
  const userBilledRUB = minBilledApplied ? cfg.minBilledRub : parseFloat(billedBeforeMin.toFixed(2));
  const profitRUB = parseFloat((userBilledRUB - ourCostRUB).toFixed(2));
  return {
    provider,
    inputTokens,
    outputTokensEstimated,
    ourCostUSD,
    ourCostRUB: parseFloat(ourCostRUB.toFixed(4)),
    markupMultiplier,
    userBilledRUB,
    profitRUB,
    minBilledApplied,
  };
}
