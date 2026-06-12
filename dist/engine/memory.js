import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
export class MemoryEngine {
    memories = [];
    dbPath;
    vocabulary = new Map();
    constructor(projectPath) {
        this.dbPath = path.join(projectPath, 'memory', 'conversations.json');
        this.load();
    }
    load() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const raw = fs.readFileSync(this.dbPath, 'utf-8');
                this.memories = JSON.parse(raw);
                this.rebuildVocabulary();
            }
        }
        catch {
            this.memories = [];
        }
    }
    save() {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.dbPath, JSON.stringify(this.memories, null, 2));
    }
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1);
    }
    rebuildVocabulary() {
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
    toVector(tokens) {
        const vec = new Array(this.vocabulary.size).fill(0);
        for (const token of tokens) {
            const idx = this.vocabulary.get(token);
            if (idx !== undefined) {
                vec[idx] += 1;
            }
        }
        return vec;
    }
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA === 0 || normB === 0)
            return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    /** Store a new conversation turn in memory */
    store(role, content) {
        const tokens = this.tokenize(content);
        const entry = {
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
    recall(query, topK = 5) {
        if (this.memories.length === 0)
            return [];
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
    getRecentContext(n = 10) {
        return this.memories.slice(-n);
    }
    /** Get total memory count */
    get size() {
        return this.memories.length;
    }
}
