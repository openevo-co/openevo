import { loadAllSkills } from './skill-loader.js';
export class SkillRouter {
    projectPath;
    skills = [];
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    /** Scan and load all skills from the project's skills/ directory */
    loadSkills() {
        this.skills = loadAllSkills(this.projectPath);
        return this.skills;
    }
    /** Match user input against skill triggers, sorted by relevance */
    matchSkills(userInput) {
        if (this.skills.length === 0)
            return [];
        const inputTokens = this.tokenize(userInput);
        const scored = this.skills
            .map(skill => ({
            skill,
            score: this.scoreSkill(skill, inputTokens),
        }))
            .filter(s => s.score > 0);
        return scored
            .sort((a, b) => b.score - a.score)
            .map(s => s.skill);
    }
    /** Format matched skills into a context block for LLM system prompt injection */
    formatSkillContext(skills) {
        if (skills.length === 0)
            return '';
        const blocks = skills.map(skill => `### Skill: ${skill.name}\n` +
            `**Description:** ${skill.description}\n\n` +
            `${skill.content}`);
        return (`\n\n--- ACTIVE SKILLS ---\n` +
            `The following skills are relevant to this conversation. ` +
            `Follow their instructions when applicable:\n\n` +
            `${blocks.join('\n\n---\n\n')}\n` +
            `--- END SKILLS ---\n`);
    }
    /** Get all loaded skills */
    get loadedSkills() {
        return this.skills;
    }
    // TODO [V1]: Web search integration for dynamic knowledge retrieval
    // async searchWeb(query: string): Promise<string> {
    //   throw new Error('searchWeb is not yet implemented — planned for V1.');
    // }
    // TODO [V1]: Self-adaptation — generate new skills from raw information
    // generateSkill(name: string, rawData: string): SkillDefinition {
    //   throw new Error('generateSkill is not yet implemented — planned for V1.');
    // }
    /** Tokenize input into lowercase words for matching */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1);
    }
    /** Score a skill by counting how many triggers match the input tokens */
    scoreSkill(skill, inputTokens) {
        let score = 0;
        for (const trigger of skill.triggers) {
            const triggerLower = trigger.toLowerCase();
            // Exact token match
            if (inputTokens.includes(triggerLower)) {
                score += 2;
                continue;
            }
            // Partial match: input contains the trigger as a substring
            const inputJoined = inputTokens.join(' ');
            if (inputJoined.includes(triggerLower)) {
                score += 1;
            }
        }
        return score;
    }
}
