/**
 * OpenEvo Knowledge Loader — Document & Vision Asset Loader
 *
 * Scans `loader_info/` in the project directory for:
 * - `docs/`   → .md, .txt, .json text files (loaded into memory)
 * - `assets/` → image files (cataloged by path + MIME type)
 *
 * Documents are formatted into a context block for LLM system prompt injection.
 * Image assets are cataloged for providers that support vision input.
 *
 * ⚠️ V0 BOUNDARY: No chunking or embedding. Full documents injected as context.
 */
export interface DocumentEntry {
    filename: string;
    content: string;
    path: string;
}
export interface AssetEntry {
    filename: string;
    path: string;
    mimeType: string;
}
export interface KnowledgeBase {
    documents: DocumentEntry[];
    assets: AssetEntry[];
}
export declare class KnowledgeLoader {
    private projectPath;
    private knowledge;
    private loaded;
    constructor(projectPath: string);
    /** Scan loader_info/ and load all documents + catalog assets */
    load(): KnowledgeBase;
    /** Format all loaded documents into a single context string for LLM injection */
    formatContext(): string;
    /** Check if a specific document exists by filename (case-insensitive) */
    hasDocument(filename: string): boolean;
    /** Get a specific document by filename (case-insensitive) */
    getDocument(filename: string): DocumentEntry | undefined;
    /** Get the full knowledge base */
    getKnowledge(): KnowledgeBase;
    private ensureLoaded;
    private loadDocuments;
    private catalogAssets;
}
