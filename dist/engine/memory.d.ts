/**
 * OpenEvo Memory Engine — Lightweight Vector Memory
 *
 * Provides semantic long-term memory using a local JSON-based store
 * with TF-IDF cosine similarity for retrieval.
 *
 * Design Decision: We use a JSON file instead of sqlite-vss for the V0 prototype
 * to avoid native binding issues with `npx`. This ensures zero-friction install
 * on any OS (Windows, Mac, Linux) without requiring C++ build tools.
 *
 * V1 (AliveVo) will upgrade to proper sqlite-vss or pgvector.
 *
 * ⚠️ V0 BOUNDARY: No cloud sync. Local memory only.
 */
export interface MemoryEntry {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    tokens: string[];
    timestamp: number;
}
export declare class MemoryEngine {
    private memories;
    private dbPath;
    private vocabulary;
    constructor(projectPath: string);
    private load;
    private save;
    private tokenize;
    private rebuildVocabulary;
    private toVector;
    private cosineSimilarity;
    /** Store a new conversation turn in memory */
    store(role: 'user' | 'assistant', content: string): void;
    /** Retrieve the most relevant past memories for a given query */
    recall(query: string, topK?: number): MemoryEntry[];
    /** Get the last N conversation turns for context window */
    getRecentContext(n?: number): MemoryEntry[];
    /** Get total memory count */
    get size(): number;
}
