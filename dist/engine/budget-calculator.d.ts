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
export declare class BudgetCalculator {
    /**
     * Estimate token count from a string.
     * Uses ~4 chars/token for Latin text, ~2 chars/token for CJK characters.
     */
    estimateTokens(text: string): number;
    /** Calculate estimated cost for a given model and token counts */
    estimateCost(model: string, inputTokens: number, outputTokens: number): CostEstimate;
    /**
     * Recommend the best model that fits within a budget constraint.
     * Assumes output tokens ≈ input tokens for estimation purposes.
     */
    recommendModel(budgetUSD: number, estimatedInputTokens: number): ModelRecommendation;
    /** Get the full cost table for all known models */
    getModelCosts(): Record<string, {
        input: number;
        output: number;
    }>;
    private isFreeModel;
}
