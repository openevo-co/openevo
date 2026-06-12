import type { ProviderConfig } from './providers.js';
/**
 * OpenEvo Agent Loader
 *
 * Parses `soul/agent.md` to extract:
 * - YAML Frontmatter → Model config (provider, model, temperature, etc.)
 * - Markdown Body → 7-Layer Persona / System Prompt text
 *
 * The agent.md file format:
 * ```
 * ---
 * provider: openrouter
 * model: anthropic/claude-sonnet-4-20250514
 * temperature: 0.8
 * max_tokens: 4096
 * budget_limit: 10.00
 * api_key_env: OPENROUTER_API_KEY
 * ---
 * # My Companion
 * You are a creative writing partner...
 * ```
 */
export interface AgentConfig extends Omit<ProviderConfig, 'provider'> {
    provider: ProviderConfig['provider'] | 'anthropic' | 'gemini' | 'local';
    persona: string;
    budgetLimit?: number;
    apiKeyEnv?: string;
}
/** Load and parse the agent.md file from a project directory */
export declare function loadAgentConfig(projectPath: string): AgentConfig;
/** Resolve the API key for an agent config from environment variables */
export declare function resolveAgentApiKey(config: AgentConfig): string | undefined;
/** Convert AgentConfig to ProviderConfig for the completion router */
export declare function toProviderConfig(config: AgentConfig): ProviderConfig;
