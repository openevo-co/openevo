import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

export class MemoryEngine {
  private memories: MemoryEntry[] = [];
  private dbPath: string;
  private vocabulary: Map<string, number> = new Map();

  constructor(projectPath: string) {
    this.dbPath = path.join(projectPath, 'memory', 'conversations.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        this.memories = JSON.parse(raw);
        this.rebuildVocabulary();
      }
    } catch {
      this.memories = [];
    }
  }

  private save(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dbPath, JSON.stringify(this.memories, null, 2));
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  private rebuildVocabulary(): void {
    this.vocabulary.clear();
    let idx = 0;
    for (const mem of this.memories) {
      for (const token of mem.tokens) {
        if (!this.vocabulary.has(token)) {
          this.vocabulary.set(token, idx++);
        }
      }
    }
  }

  private toVector(tokens: string[]): number[] {
    const vec = new Array(this.vocabulary.size).fill(0);
    for (const token of tokens) {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        vec[idx] += 1;
      }
    }
    return vec;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /** Store a new conversation turn in memory */
  store(role: 'user' | 'assistant', content: string): void {
    const tokens = this.tokenize(content);
    const entry: MemoryEntry = {
      id: crypto.randomUUID(),
      role,
      content,
      tokens,
      timestamp: Date.now(),
    };
    this.memories.push(entry);

    // Add new tokens to vocabulary
    for (const token of tokens) {
      if (!this.vocabulary.has(token)) {
        this.vocabulary.set(token, this.vocabulary.size);
      }
    }

    this.save();
  }

  /** Retrieve the most relevant past memories for a given query */
  recall(query: string, topK: number = 5): MemoryEntry[] {
    if (this.memories.length === 0) return [];

    const queryTokens = this.tokenize(query);

    // Temporarily add query tokens to vocabulary for vector comparison
    for (const token of queryTokens) {
      if (!this.vocabulary.has(token)) {
        this.vocabulary.set(token, this.vocabulary.size);
      }
    }

    const queryVec = this.toVector(queryTokens);

    const scored = this.memories.map(mem => ({
      memory: mem,
      score: this.cosineSimilarity(queryVec, this.toVector(mem.tokens)),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(s => s.score > 0.05)
      .map(s => s.memory);
  }

  /** Get the last N conversation turns for context window */
  getRecentContext(n: number = 10): MemoryEntry[] {
    return this.memories.slice(-n);
  }

  /** Get total memory count */
  get size(): number {
    return this.memories.length;
  }
}
