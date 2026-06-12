/**
 * OpenEvo Budget Calculator — Token Cost Estimation & Smart Model Routing
 *
 * Estimates token usage, calculates API costs, and recommends the best model
 * that fits within a user's budget constraint.
 *
 * Token estimation heuristic:
 * - English/Latin: ~4 characters per token
 * - CJK (Chinese/Japanese/Korean): ~2 characters per token
 *
 * When budget is 0 or undefined, always routes to local/ollama (free).
 *
 * ⚠️ V0 BOUNDARY: Static cost table. No live pricing API.
 */

export interface CostEstimate {
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
}

export interface ModelRecommendation {
  recommended: string;
  provider: string;
  estimatedCostUSD: number;
  reason: string;
}

interface ModelPricing {
  input: number;   // USD per 1M input tokens
  output: number;  // USD per 1M output tokens
  provider: string;
}

// CJK Unicode ranges for token estimation
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;

const MODEL_COSTS: Record<string, ModelPricing> = {
  'gpt-4o':              { input: 2.50,  output: 10.00, provider: 'openai' },
  'gpt-4o-mini':         { input: 0.15,  output: 0.60,  provider: 'openai' },
  'claude-3-5-sonnet':   { input: 3.00,  output: 15.00, provider: 'openrouter' },
  'claude-3-5-haiku':    { input: 0.25,  output: 1.25,  provider: 'openrouter' },
  'gemini-1.5-pro':      { input: 1.25,  output: 5.00,  provider: 'openrouter' },
  'gemini-1.5-flash':    { input: 0.075, output: 0.30,  provider: 'openrouter' },
};

const FREE_RECOMMENDATION: ModelRecommendation = {
  recommended: 'ollama/qwen3.5:2b',
  provider: 'ollama',
  estimatedCostUSD: 0,
  reason: 'No budget set — defaulting to free local model via Ollama.',
};

/** Model ranking by capability (descending). Used for "best model within budget" selection. */
const MODEL_RANK: string[] = [
  'claude-3-5-sonnet',
  'gpt-4o',
  'gemini-1.5-pro',
  'claude-3-5-haiku',
  'gpt-4o-mini',
  'gemini-1.5-flash',
];

export class BudgetCalculator {

  /**
   * Estimate token count from a string.
   * Uses ~4 chars/token for Latin text, ~2 chars/token for CJK characters.
   */
  estimateTokens(text: string): number {
    if (!text) return 0;

    const cjkMatches = text.match(CJK_REGEX);
    const cjkCount = cjkMatches ? cjkMatches.length : 0;
    const nonCjkLength = text.length - cjkCount;

    const cjkTokens = cjkCount / 2;
    const latinTokens = nonCjkLength / 4;

    return Math.ceil(cjkTokens + latinTokens);
  }

  /** Calculate estimated cost for a given model and token counts */
  estimateCost(model: string, inputTokens: number, outputTokens: number): CostEstimate {
    if (this.isFreeModel(model)) {
      return { model, estimatedInputTokens: inputTokens, estimatedOutputTokens: outputTokens, estimatedCostUSD: 0 };
    }

    const pricing = MODEL_COSTS[model];
    if (!pricing) {
      return { model, estimatedInputTokens: inputTokens, estimatedOutputTokens: outputTokens, estimatedCostUSD: 0 };
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return {
      model,
      estimatedInputTokens: inputTokens,
      estimatedOutputTokens: outputTokens,
      estimatedCostUSD: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
    };
  }

  /**
   * Recommend the best model that fits within a budget constraint.
   * Assumes output tokens ≈ input tokens for estimation purposes.
   */
  recommendModel(budgetUSD: number, estimatedInputTokens: number): ModelRecommendation {
    if (!budgetUSD || budgetUSD <= 0) return FREE_RECOMMENDATION;

    const estimatedOutputTokens = estimatedInputTokens;

    for (const model of MODEL_RANK) {
      const pricing = MODEL_COSTS[model];
      const cost = this.estimateCost(model, estimatedInputTokens, estimatedOutputTokens);

      if (cost.estimatedCostUSD <= budgetUSD) {
        return {
          recommended: model,
          provider: pricing.provider,
          estimatedCostUSD: cost.estimatedCostUSD,
          reason: `Best capability model within $${budgetUSD} budget.`,
        };
      }
    }

    return {
      ...FREE_RECOMMENDATION,
      reason: `All cloud models exceed $${budgetUSD} budget — falling back to free local model.`,
    };
  }

  /** Get the full cost table for all known models */
  getModelCosts(): Record<string, { input: number; output: number }> {
    const costs: Record<string, { input: number; output: number }> = {};

    for (const [model, pricing] of Object.entries(MODEL_COSTS)) {
      costs[model] = { input: pricing.input, output: pricing.output };
    }

    costs['ollama/*'] = { input: 0, output: 0 };
    costs['local/*'] = { input: 0, output: 0 };

    return costs;
  }

  private isFreeModel(model: string): boolean {
    return model.startsWith('ollama/') || model.startsWith('local/');
  }
}
