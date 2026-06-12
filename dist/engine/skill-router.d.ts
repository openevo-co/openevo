import { type SkillDefinition } from './skill-loader.js';
/**
 * OpenEvo Skill Router — Intelligent Requirement Analyzer
 *
 * Matches user input against loaded skill triggers to determine
 * which skills are relevant, then formats them into injectable
 * LLM context blocks.
 *
 * Matching Strategy:
 * - Case-insensitive partial keyword matching against triggers
 * - Scored by number of trigger hits (more matches = more relevant)
 * - Skills with zero matches are excluded
 *
 * ⚠️ V0 BOUNDARY:
 * ❌ No web search enrichment (V1 — searchWeb placeholder)
 * ❌ No self-adaptation / skill generation (V1 — generateSkill placeholder)
 */
export { type SkillDefinition } from './skill-loader.js';
export declare class SkillRouter {
    private projectPath;
    private skills;
    constructor(projectPath: string);
    /** Scan and load all skills from the project's skills/ directory */
    loadSkills(): SkillDefinition[];
    /** Match user input against skill triggers, sorted by relevance */
    matchSkills(userInput: string): SkillDefinition[];
    /** Format matched skills into a context block for LLM system prompt injection */
    formatSkillContext(skills: SkillDefinition[]): string;
    /** Get all loaded skills */
    get loadedSkills(): SkillDefinition[];
    /** Tokenize input into lowercase words for matching */
    private tokenize;
    /** Score a skill by counting how many triggers match the input tokens */
    private scoreSkill;
}
