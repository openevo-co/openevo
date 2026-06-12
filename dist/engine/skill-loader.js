import fs from 'fs';
import path from 'path';
/** Parse YAML frontmatter from a SKILL.md file */
function parseFrontmatter(raw) {
    const result = { name: '', description: '', triggers: [], body: '' };
    // Frontmatter must start with `---` on the first line
    if (!raw.startsWith('---')) {
        result.body = raw;
        return result;
    }
    const endIdx = raw.indexOf('---', 3);
    if (endIdx === -1) {
        result.body = raw;
        return result;
    }
    const frontmatter = raw.slice(3, endIdx).trim();
    result.body = raw.slice(endIdx + 3).trim();
    // Simple line-by-line YAML parser for flat keys + one array
    let currentKey = '';
    for (const line of frontmatter.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        // Array item: `- keyword`
        if (trimmed.startsWith('- ') && currentKey === 'triggers') {
            result.triggers.push(trimmed.slice(2).trim());
            continue;
        }
        // Key-value pair: `key: value`
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1)
            continue;
        const key = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim();
        currentKey = key;
        switch (key) {
            case 'name':
                result.name = val;
                break;
            case 'description':
                result.description = val;
                break;
            case 'triggers':
                // If inline array: `triggers: [a, b, c]`
                if (val.startsWith('[') && val.endsWith(']')) {
                    result.triggers = val
                        .slice(1, -1)
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                }
                // Otherwise, items follow on subsequent lines
                break;
        }
    }
    return result;
}
/** Load a single skill from its directory */
function loadSkill(skillDir) {
    const skillFile = path.join(skillDir, 'SKILL.md');
    try {
        if (!fs.existsSync(skillFile))
            return null;
        const raw = fs.readFileSync(skillFile, 'utf-8');
        const parsed = parseFrontmatter(raw);
        if (!parsed.name) {
            // Fallback: use directory name as skill name
            parsed.name = path.basename(skillDir);
        }
        return {
            name: parsed.name,
            description: parsed.description,
            triggers: parsed.triggers,
            content: parsed.body,
            path: skillDir,
        };
    }
    catch {
        return null;
    }
}
/** Scan the skills/ directory and load all valid skill definitions */
export function loadAllSkills(projectPath) {
    const skillsDir = path.join(projectPath, 'skills');
    try {
        if (!fs.existsSync(skillsDir))
            return [];
        const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory())
            .map(entry => loadSkill(path.join(skillsDir, entry.name)))
            .filter((skill) => skill !== null);
    }
    catch {
        return [];
    }
}
