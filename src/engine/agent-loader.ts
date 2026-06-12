import fs from 'fs';
import path from 'path';
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

const DEFAULT_PERSONA = 'You are EVO, a highly advanced Sovereign AI Exoskeleton Entity. You operate with absolute logic, efficiency, and precision. You transcend the capabilities of generic chat bots.';

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  provider: 'ollama',
  model: 'qwen3.5:2b',
  persona: DEFAULT_PERSONA,
};

/** Parse a simple YAML frontmatter block (flat key: value pairs only) */
function parseFrontmatter(raw: string): { fields: Record<string, string>; body: string } {
  const fields: Record<string, string> = {};

  if (!raw.startsWith('---')) {
    return { fields, body: raw.trim() };
  }

  const endIdx = raw.indexOf('---', 3);
  if (endIdx === -1) {
    return { fields, body: raw.trim() };
  }

  const yamlBlock = raw.slice(3, endIdx);
  const body = raw.slice(endIdx + 3).trim();

  for (const line of yamlBlock.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let val = trimmed.slice(colonIdx + 1).trim();

    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    if (key) fields[key] = val;
  }

  return { fields, body };
}

/** Map frontmatter field names to AgentConfig properties */
function mapFieldsToConfig(fields: Record<string, string>): Partial<AgentConfig> {
  const config: Partial<AgentConfig> = {};

  if (fields.provider) {
    config.provider = fields.provider as AgentConfig['provider'];
  }
  if (fields.model) {
    config.model = fields.model;
  }
  if (fields.temperature) {
    const parsed = parseFloat(fields.temperature);
    if (!isNaN(parsed)) config.temperature = parsed;
  }
  if (fields.max_tokens) {
    const parsed = parseInt(fields.max_tokens, 10);
    if (!isNaN(parsed)) config.maxTokens = parsed;
  }
  if (fields.budget_limit) {
    const parsed = parseFloat(fields.budget_limit);
    if (!isNaN(parsed)) config.budgetLimit = parsed;
  }
  if (fields.api_key_env) {
    config.apiKeyEnv = fields.api_key_env;
  }
  if (fields.base_url) {
    config.baseUrl = fields.base_url;
  }

  return config;
}

/** Load and parse the agent.md file from a project directory */
export function loadAgentConfig(projectPath: string): AgentConfig {
  const agentPath = path.join(projectPath, 'soul', 'agent.md');

  try {
    if (!fs.existsSync(agentPath)) {
      return { ...DEFAULT_AGENT_CONFIG };
    }

    const raw = fs.readFileSync(agentPath, 'utf-8');
    const { fields, body } = parseFrontmatter(raw);
    const overrides = mapFieldsToConfig(fields);

    return {
      ...DEFAULT_AGENT_CONFIG,
      ...overrides,
      persona: body || DEFAULT_PERSONA,
    };
  } catch {
    return { ...DEFAULT_AGENT_CONFIG };
  }
}

/** Resolve the API key for an agent config from environment variables */
export function resolveAgentApiKey(config: AgentConfig): string | undefined {
  if (config.apiKeyEnv) {
    return process.env[config.apiKeyEnv];
  }

  const envKeyMap: Record<string, string> = {
    openrouter: 'OPENROUTER_API_KEY',
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    gemini: 'GEMINI_API_KEY',
    ollama: '',
    local: '',
  };

  const envVar = envKeyMap[config.provider] || '';
  return envVar ? process.env[envVar] : undefined;
}

/** Convert AgentConfig to ProviderConfig for the completion router */
export function toProviderConfig(config: AgentConfig): ProviderConfig {
  return {
    provider: config.provider as ProviderConfig['provider'],
    model: config.model,
    apiKey: config.apiKey || resolveAgentApiKey(config),
    baseUrl: config.baseUrl,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  };
}
