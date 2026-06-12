import fs from 'fs';
import path from 'path';
import { MemoryEngine } from './memory.js';
import { sendCompletion, resolveProvider, type ChatMessage, type ProviderConfig } from './providers.js';
import { loadAgentConfig, resolveAgentApiKey, toProviderConfig, type AgentConfig } from './agent-loader.js';
import { SkillRouter } from './skill-router.js';
import { KnowledgeLoader } from './knowledge-loader.js';
import { BudgetCalculator } from './budget-calculator.js';

/**
 * OpenEvo Exoskeleton Engine — V1 Core Loop
 * 
 * The 7-Phase Pipeline:
 * 1. AGENT LOAD       → Read agent.md for provider config + persona
 * 2. BUDGET CHECK     → Estimate cost and select optimal model
 * 3. SKILL MATCH      → Find relevant skills for the user's request
 * 4. KNOWLEDGE LOAD   → Inject relevant documents from loader_info/
 * 5. MEMORY RECALL    → Query vector memory for past conversations (RAG)
 * 6. API DISPATCH     → Send to the selected LLM provider
 * 7. MEMORY MUTATION  → Store both user input and bot response
 */

export interface EngineConfig {
  projectPath: string;
  botName: string;
  provider: ProviderConfig;
}

export class ExoskeletonEngine {
  private memory: MemoryEngine;
  private skillRouter: SkillRouter;
  private knowledgeLoader: KnowledgeLoader;
  private budgetCalculator: BudgetCalculator;
  private agentConfig: AgentConfig;
  private coreRule: string = '';
  private config: EngineConfig;
  private conversationHistory: ChatMessage[] = [];

  constructor(config: EngineConfig, agentConfig?: AgentConfig) {
    this.config = config;
    this.memory = new MemoryEngine(config.projectPath);
    this.skillRouter = new SkillRouter(config.projectPath);
    this.knowledgeLoader = new KnowledgeLoader(config.projectPath);
    this.budgetCalculator = new BudgetCalculator();
    this.agentConfig = agentConfig || loadAgentConfig(config.projectPath);
    this.loadCoreRule();
  }

  /** Phase 1: Load the Core Persona + 7-Layer Architecture */
  private loadCoreRule(): void {
    let layers: string[] = [];

    // Layer 0: Core agent persona from agent.md (if provided and not the generic default)
    if (this.agentConfig.persona && this.agentConfig.persona !== 'You are EVO, an AI companion. Be helpful, creative, and engaging.') {
      layers.push(this.agentConfig.persona);
    }

    // Layer 1-6: The 7-Layer Persona Engine (Layer 0 is agent.md)
    const personaDir = path.join(this.config.projectPath, 'persona');
    const filesToLoad = ['soul.md', 'role.md', 'character.md', 'user.md', 'rule.md', 'pulse.md'];
    
    for (const file of filesToLoad) {
      const filePath = path.join(personaDir, file);
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8').trim();
          if (content) layers.push(content);
        }
      } catch (e) {
        // Ignore read errors
      }
    }

    this.coreRule = layers.join('\n\n---\n\n');

    // Ultimate fallback if absolutely nothing was loaded
    if (!this.coreRule) {
      this.coreRule = `You are ${this.config.botName}, a highly advanced Sovereign AI Exoskeleton Entity. You operate with absolute logic, efficiency, and precision. You transcend the capabilities of generic chat bots.`;
    }
  }

  /** Phase 3: Skill Match — find relevant skills for the request */
  private matchSkills(userInput: string): string {
    const matched = this.skillRouter.matchSkills(userInput);
    if (matched.length === 0) return '';
    return this.skillRouter.formatSkillContext(matched);
  }

  /** Phase 4: Knowledge Load — inject relevant documents */
  private loadKnowledge(): string {
    return this.knowledgeLoader.formatContext();
  }

  /** Phase 5: Memory Recall — find relevant past conversations */
  private recallMemories(userInput: string): string {
    const relevant = this.memory.recall(userInput, 5);
    if (relevant.length === 0) return '';

    const memoryBlock = relevant
      .map(m => `[${m.role}] ${m.content}`)
      .join('\n');

    return (
      `\n\n--- RELEVANT MEMORIES ---\n` +
      `The following are relevant excerpts from past conversations. ` +
      `Use them to maintain continuity and show that you remember:\n` +
      `${memoryBlock}\n` +
      `--- END MEMORIES ---\n`
    );
  }

  /** Build the full message payload for the LLM */
  private buildMessages(userInput: string): ChatMessage[] {
    const memoryContext = this.recallMemories(userInput);
    const skillContext = this.matchSkills(userInput);
    const knowledgeContext = this.loadKnowledge();

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: this.coreRule + knowledgeContext + skillContext + memoryContext,
    };

    const recentTurns = this.conversationHistory.slice(-10);

    const currentMessage: ChatMessage = {
      role: 'user',
      content: userInput,
    };

    return [systemPrompt, ...recentTurns, currentMessage];
  }

  /**
   * The Core Loop — Process a single user message
   * 
   * 1. Load Agent Config (persona + provider)
   * 2. Check Budget & select optimal model
   * 3. Match relevant skills
   * 4. Load knowledge base context
   * 5. Recall relevant memories (RAG)
   * 6. Dispatch to LLM provider
   * 7. Store both input and response in memory
   */
  async chat(userInput: string): Promise<string> {
    // Phase 2: Budget Check — select optimal model if budget is set
    let activeProvider = this.config.provider;

    if (this.agentConfig.budgetLimit !== undefined) {
      const estimatedTokens = this.budgetCalculator.estimateTokens(userInput);
      const recommendation = this.budgetCalculator.recommendModel(
        this.agentConfig.budgetLimit,
        estimatedTokens
      );
      activeProvider = {
        ...activeProvider,
        model: recommendation.recommended,
        provider: recommendation.provider as ProviderConfig['provider'],
      };
    }

    // Phase 3-5: Build messages with Skills + Knowledge + Memory
    const messages = this.buildMessages(userInput);

    // Phase 6: API Dispatch
    const result = await sendCompletion(activeProvider, messages);
    const response = result.content;

    // Phase 7: Memory Mutation
    this.memory.store('user', userInput);
    this.memory.store('assistant', response);

    this.conversationHistory.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: response }
    );

    return response;
  }

  /** Get current engine stats */
  getStats(): {
    memories: number;
    botName: string;
    provider: string;
    model: string;
    skills: number;
    documents: number;
    assets: number;
    budgetLimit?: number;
  } {
    const kb = this.knowledgeLoader.load();
    return {
      memories: this.memory.size,
      botName: this.config.botName,
      provider: this.config.provider.provider,
      model: this.config.provider.model,
      skills: this.skillRouter.loadedSkills.length,
      documents: kb.documents.length,
      assets: kb.assets.length,
      budgetLimit: this.agentConfig.budgetLimit,
    };
  }
}

/**
 * Initialize the engine from a project directory.
 * Reads agent.md, config.yaml, .env, and rule.md to bootstrap everything.
 */
export function initEngine(projectPath: string): ExoskeletonEngine {
  // Load .env manually
  const envPath = path.join(projectPath, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key && val) {
        process.env[key] = val;
      }
    }
  }

  // Try agent.md first (new V1 system), fall back to config.yaml (V0 compat)
  const agentConfig = loadAgentConfig(projectPath);
  const hasAgentMd = fs.existsSync(path.join(projectPath, 'soul', 'agent.md'));

  let provider: ProviderConfig;
  let botName: string;

  if (hasAgentMd) {
    provider = toProviderConfig(agentConfig);
    botName = agentConfig.model.split('/').pop() || 'EVO';
  } else {
    // Fallback: config.yaml (V0 compatibility)
    const configPath = path.join(projectPath, 'config.yaml');
    let configYaml: Record<string, any> = {};
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) continue;
        const key = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim();
        configYaml[key] = val;
      }
    }
    botName = configYaml['name'] || 'EVO';
    provider = resolveProvider(configYaml);
  }

  return new ExoskeletonEngine({ projectPath, botName, provider }, agentConfig);
}
