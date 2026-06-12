/**
 * OpenEvo LLM Provider Router
 *
 * Routes chat completions to the user's chosen LLM backend.
 * Supported: OpenRouter, Ollama (local), OpenAI-compatible APIs.
 *
 * The user pays for their own API calls. We pay nothing.
 * "Give away the razor to sell the blades."
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ProviderConfig {
    provider: 'openrouter' | 'ollama' | 'openai' | 'anthropic' | 'gemini' | 'local';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface CompletionResult {
    content: string;
    model: string;
    tokensUsed?: number;
}
/** Send a chat completion request to the configured LLM provider */
export declare function sendCompletion(config: ProviderConfig, messages: ChatMessage[]): Promise<CompletionResult>;
/** Build a ProviderConfig from environment variables and config.yaml values */
export declare function resolveProvider(configYaml: any): ProviderConfig;
