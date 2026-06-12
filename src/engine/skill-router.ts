import { loadAllSkills, type SkillDefinition } from './skill-loader.js';

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

interface ScoredSkill {
  skill: SkillDefinition;
  score: number;
}

export class SkillRouter {
  private projectPath: string;
  private skills: SkillDefinition[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /** Scan and load all skills from the project's skills/ directory */
  loadSkills(): SkillDefinition[] {
    this.skills = loadAllSkills(this.projectPath);
    return this.skills;
  }

  /** Match user input against skill triggers, sorted by relevance */
  matchSkills(userInput: string): SkillDefinition[] {
    if (this.skills.length === 0) return [];

    const inputTokens = this.tokenize(userInput);

    const scored: ScoredSkill[] = this.skills
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
  formatSkillContext(skills: SkillDefinition[]): string {
    if (skills.length === 0) return '';

    const blocks = skills.map(skill =>
      `### Skill: ${skill.name}\n` +
      `**Description:** ${skill.description}\n\n` +
      `${skill.content}`
    );

    return (
      `\n\n--- ACTIVE SKILLS ---\n` +
      `The following skills are relevant to this conversation. ` +
      `Follow their instructions when applicable:\n\n` +
      `${blocks.join('\n\n---\n\n')}\n` +
      `--- END SKILLS ---\n`
    );
  }

  /** Get all loaded skills */
  get loadedSkills(): SkillDefinition[] {
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
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  /** Score a skill by counting how many triggers match the input tokens */
  private scoreSkill(skill: SkillDefinition, inputTokens: string[]): number {
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
