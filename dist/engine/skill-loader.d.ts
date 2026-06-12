/**
 * OpenEvo Skill Loader — SKILL.md Discovery & Parser
 *
 * Scans a project's `skills/` directory for skill definitions.
 * Each skill is a subfolder containing a `SKILL.md` with YAML frontmatter
 * (name, description, triggers) and markdown body (instructions).
 *
 * Zero-dependency YAML frontmatter parser — no gray-matter needed.
 */
export interface SkillDefinition {
    name: string;
    description: string;
    triggers: string[];
    content: string;
    path: string;
}
/** Scan the skills/ directory and load all valid skill definitions */
export declare function loadAllSkills(projectPath: string): SkillDefinition[];
