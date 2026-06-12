import { type ProviderConfig } from './providers.js';
import { type AgentConfig } from './agent-loader.js';
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
export declare class ExoskeletonEngine {
    private memory;
    private skillRouter;
    private knowledgeLoader;
    private budgetCalculator;
    private agentConfig;
    private coreRule;
    private config;
    private conversationHistory;
    constructor(config: EngineConfig, agentConfig?: AgentConfig);
    /** Phase 1: Load the Core Persona + 7-Layer Architecture */
    private loadCoreRule;
    /** Phase 3: Skill Match — find relevant skills for the request */
    private matchSkills;
    /** Phase 4: Knowledge Load — inject relevant documents */
    private loadKnowledge;
    /** Phase 5: Memory Recall — find relevant past conversations */
    private recallMemories;
    /** Build the full message payload for the LLM */
    private buildMessages;
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
    chat(userInput: string): Promise<string>;
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
    };
}
/**
 * Initialize the engine from a project directory.
 * Reads agent.md, config.yaml, .env, and rule.md to bootstrap everything.
 */
export declare function initEngine(projectPath: string): ExoskeletonEngine;
