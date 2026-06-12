import fs from 'fs';
import path from 'path';
const DOCUMENT_EXTENSIONS = new Set(['.md', '.txt', '.json']);
const IMAGE_MIME_MAP = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
};
const IMAGE_EXTENSIONS = new Set(Object.keys(IMAGE_MIME_MAP));
export class KnowledgeLoader {
    projectPath;
    knowledge = { documents: [], assets: [] };
    loaded = false;
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    /** Scan loader_info/ and load all documents + catalog assets */
    load() {
        if (this.loaded)
            return this.knowledge;
        const basePath = path.join(this.projectPath, 'loader_info');
        if (!fs.existsSync(basePath)) {
            this.loaded = true;
            return this.knowledge;
        }
        this.knowledge.documents = this.loadDocuments(path.join(basePath, 'docs'));
        this.knowledge.assets = this.catalogAssets(path.join(basePath, 'assets'));
        this.loaded = true;
        return this.knowledge;
    }
    /** Format all loaded documents into a single context string for LLM injection */
    formatContext() {
        this.ensureLoaded();
        if (this.knowledge.documents.length === 0)
            return '';
        const blocks = this.knowledge.documents.map(doc => `### ${doc.filename}\n${doc.content}`);
        return (`\n\n--- KNOWLEDGE BASE ---\n` +
            `The following documents provide reference knowledge. ` +
            `Use them to inform your responses when relevant:\n\n` +
            `${blocks.join('\n\n')}\n` +
            `--- END KNOWLEDGE BASE ---\n`);
    }
    /** Check if a specific document exists by filename (case-insensitive) */
    hasDocument(filename) {
        this.ensureLoaded();
        const lower = filename.toLowerCase();
        return this.knowledge.documents.some(d => d.filename.toLowerCase() === lower);
    }
    /** Get a specific document by filename (case-insensitive) */
    getDocument(filename) {
        this.ensureLoaded();
        const lower = filename.toLowerCase();
        return this.knowledge.documents.find(d => d.filename.toLowerCase() === lower);
    }
    /** Get the full knowledge base */
    getKnowledge() {
        this.ensureLoaded();
        return this.knowledge;
    }
    ensureLoaded() {
        if (!this.loaded)
            this.load();
    }
    loadDocuments(docsDir) {
        if (!fs.existsSync(docsDir))
            return [];
        const entries = [];
        try {
            const files = fs.readdirSync(docsDir);
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (!DOCUMENT_EXTENSIONS.has(ext))
                    continue;
                const filePath = path.join(docsDir, file);
                const stat = fs.statSync(filePath);
                if (!stat.isFile())
                    continue;
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    entries.push({ filename: file, content, path: filePath });
                }
                catch {
                    // Skip unreadable files silently
                }
            }
        }
        catch {
            return [];
        }
        return entries;
    }
    catalogAssets(assetsDir) {
        if (!fs.existsSync(assetsDir))
            return [];
        const entries = [];
        try {
            const files = fs.readdirSync(assetsDir);
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (!IMAGE_EXTENSIONS.has(ext))
                    continue;
                const filePath = path.join(assetsDir, file);
                const stat = fs.statSync(filePath);
                if (!stat.isFile())
                    continue;
                entries.push({
                    filename: file,
                    path: filePath,
                    mimeType: IMAGE_MIME_MAP[ext],
                });
            }
        }
        catch {
            return [];
        }
        return entries;
    }
}
