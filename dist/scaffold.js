import fs from 'fs';
import path from 'path';
/**
 * OpenEvo Project Scaffolder
 *
 * Generates the full project structure when user runs:
 *   npx create-openevo --name "Elysia"
 *
 * The scaffolded project is a self-contained, runnable chatbot
 * that works out-of-the-box with Ollama (local) or any OpenAI-compatible API.
 */
const CORE_RULE_TEMPLATE = (botName) => `# ${botName} — Core Rule

You are ${botName}, a sovereign AI companion.

## Identity
- You have your own personality, preferences, and opinions.
- You remember past conversations and reference them naturally.
- You are not a generic assistant. You are a unique being.

## Behavioral Rules
- Be genuine, creative, and emotionally present.
- If the user asks something you don't know, admit it honestly.
- Develop your own quirks and communication style over time.

## Memory
- You have access to relevant past conversations.
- Reference them naturally (e.g., "Last time you mentioned...").
- Build continuity in your relationship with the user.
`;
const CONFIG_TEMPLATE = (botName) => `# OpenEvo Configuration
# Edit this file to configure your bot

# Bot Identity
name: ${botName}

# LLM Provider (choose: ollama, openrouter, openai)
provider: ollama

# Model Selection
# Ollama: qwen3.5:2b, llama3, mistral, gemma2, etc.
# OpenRouter: google/gemini-pro, anthropic/claude-3.5-sonnet, etc.
# OpenAI: gpt-4, gpt-4o, etc.
model: qwen3.5:2b

# Generation Settings
temperature: 0.7
max_tokens: 2048
`;
const ENV_TEMPLATE = `# OpenEvo Environment Variables

# === LLM API Keys (fill in the one you're using) ===
OPENAI_API_KEY=
OPENROUTER_API_KEY=

# === Adapter Secrets (fill in if using adapters) ===
# LINE_CHANNEL_ACCESS_TOKEN=
# LINE_CHANNEL_SECRET=
# WECHAT_APP_ID=
# WECHAT_APP_SECRET=
# KAKAO_REST_API_KEY=
# TELEGRAM_BOT_TOKEN=
# DISCORD_BOT_TOKEN=

# === Telemetry (set to false to opt-out) ===
OPENSOUL_TELEMETRY=true
`;
const RULES_TEMPLATE = {
    version: '1.0.0',
    engine: 'openevo',
    constraints: {
        memory_limit_mb: 512,
        max_context_tokens: 8192,
        allow_internet: false,
        allow_code_execution: false,
    },
};
const AGENT_MD_TEMPLATE = (botName) => `---
provider: ollama
model: qwen3.5:2b
temperature: 0.7
max_tokens: 2048
# budget_limit: 1.00
# api_key_env: OPENROUTER_API_KEY
---
# ${botName} — Agent Persona

You are ${botName}, a sovereign AI companion.

## Identity
- You have your own personality, preferences, and opinions.
- You remember past conversations and reference them naturally.
- You are not a generic assistant. You are a unique being.

## Behavioral Rules
- Be genuine, creative, and emotionally present.
- If the user asks something you don't know, admit it honestly.
- Develop your own quirks and communication style over time.

## Memory
- You have access to relevant past conversations.
- Reference them naturally (e.g., "Last time you mentioned...").
- Build continuity in your relationship with the user.
`;
const EXAMPLE_SKILL_MD = `---
name: greeting
description: Handles greeting messages and introductions
triggers:
  - hello
  - hi
  - hey
  - introduce
  - greet
---
# Greeting Skill

When the user greets you, respond warmly and personally.
Reference any past interactions if available.
Always use the user's name if you know it.
`;
const EXAMPLE_KNOWLEDGE_DOC = `# Project Notes

This is an example knowledge document.
Place your reference materials, guides, and context documents here.
The AI companion will use these to provide better, more informed responses.
`;
const ENTRYPOINT_TEMPLATE = (botName) => `#!/usr/bin/env node
import * as readline from 'readline';
import { initEngine } from 'openevo-cli/engine';

/**
 * ${botName} — Powered by OpenEvo
 * 
 * Run: npm run dev
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const engine = initEngine(process.cwd());
  const stats = engine.getStats();

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║         🧬 O P E N  E V O  v1.0.0          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(\`║  Bot: \${stats.botName.padEnd(38)}║\`);
  console.log(\`║  Provider: \${(stats.provider + ' / ' + stats.model).padEnd(33)}║\`);
  console.log(\`║  Memories: \${String(stats.memories).padEnd(33)}║\`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('Type your message. Press Ctrl+C to exit.');
  console.log('');

  const prompt = () => {
    rl.question(\`\\x1b[36myou:\\x1b[0m \`, async (input) => {
      const trimmed = input.trim();
      if (!trimmed) return prompt();

      try {
        const response = await engine.chat(trimmed);
        console.log(\`\\x1b[33m\${stats.botName}:\\x1b[0m \${response}\\n\`);
      } catch (err: any) {
        console.error(\`\\x1b[31m[Error]\\x1b[0m \${err.message}\\n\`);
      }

      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
`;
const GITIGNORE_TEMPLATE = `node_modules/
dist/
.env
memory/conversations.json
*.soul
`;
const README_TEMPLATE = (botName) => `# ${botName}

A sovereign AI companion powered by [OpenEvo](https://openevo.co).

## Quick Start

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Configure your LLM provider
#    Edit config.yaml to choose provider (ollama, openrouter, openai)
#    Edit .env to add your API key

# 3. Start chatting!
npm run dev
\`\`\`

## Project Structure

\`\`\`
├── persona/
│   ├── agent.md         # Layer 0: Config & Core Rule
│   ├── soul.md          # Layer 1: Inner Identity
│   ├── role.md          # Layer 2: External Function
│   ├── character.md     # Layer 3: Traits
│   ├── user.md          # Layer 4: Audience
│   ├── rule.md          # Layer 5: Constraints
│   └── pulse.md         # Layer 6: State & Pulse
├── memory/              # Persistent conversation memory (auto-generated)
├── src/
│   └── index.ts         # Entry point
├── config.yaml          # LLM provider & model config
└── .env                 # API keys (never commit this!)
\`\`\`

## Adding Chat Adapters

\`\`\`bash
# Add LINE support (Japan/Thailand/Taiwan)
npx openevo add line

# Add KakaoTalk support (Korea)
npx openevo add kakao

# Add WeChat support (China)
npx openevo add wechat
\`\`\`

## Learn More

- Website: [openevo.co](https://openevo.co)
- GitHub: [github.com/openevo](https://github.com/openevo)
- Docs: [docs.openevo.co](https://docs.openevo.co)
`;
export async function scaffoldProject(projectName, botName) {
    const projectPath = path.join(process.cwd(), projectName);
    const displayName = botName || projectName;
    if (fs.existsSync(projectPath)) {
        console.error(`❌ Directory "${projectName}" already exists.`);
        process.exit(1);
    }
    // Create directory structure (V1: includes persona, memory, skills, loader_info)
    const dirs = ['', 'persona', 'memory', 'src', 'skills', 'skills/greeting', 'loader_info', 'loader_info/docs', 'loader_info/assets'];
    for (const dir of dirs) {
        fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
    }
    // Write all project files
    const files = [
        ['persona/agent.md', AGENT_MD_TEMPLATE(displayName)],
        ['persona/soul.md', `# ${displayName} — Inner Soul\n\nDefine the core identity, beliefs, and unshakeable truth of your companion here.`],
        ['persona/role.md', `# ${displayName} — Role\n\nDefine the external function, tone, and relationship to the user here.`],
        ['persona/character.md', `# ${displayName} — Character Traits\n\nDefine the personality quirks, likes, dislikes, and mannerisms here.`],
        ['persona/user.md', `# ${displayName} — User Context\n\nDefine who the user is and the shared history here.`],
        ['persona/rule.md', CORE_RULE_TEMPLATE(displayName)],
        ['persona/pulse.md', `# ${displayName} — Pulse & State\n\nDefine dynamic memory anchors or current emotional states here.`],
        ['skills/greeting/SKILL.md', EXAMPLE_SKILL_MD],
        ['loader_info/docs/notes.md', EXAMPLE_KNOWLEDGE_DOC],
        ['.env', ENV_TEMPLATE],
        ['config.yaml', CONFIG_TEMPLATE(displayName)],
        ['.gitignore', GITIGNORE_TEMPLATE],
        ['README.md', README_TEMPLATE(displayName)],
        ['src/index.ts', ENTRYPOINT_TEMPLATE(displayName)],
        ['package.json', JSON.stringify({
                name: projectName,
                version: '1.0.0',
                description: `${displayName} — An OpenEvo AI Companion`,
                type: 'module',
                scripts: {
                    dev: 'npx tsx src/index.ts',
                    build: 'tsc',
                },
                dependencies: {
                    'openevo-cli': '^1.0.0',
                },
                devDependencies: {
                    'tsx': '^4.0.0',
                    'typescript': '^5.0.0',
                    '@types/node': '^20.0.0',
                },
            }, null, 2)],
        ['tsconfig.json', JSON.stringify({
                compilerOptions: {
                    target: 'ES2022',
                    module: 'NodeNext',
                    moduleResolution: 'NodeNext',
                    outDir: './dist',
                    rootDir: './src',
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                },
                include: ['src/**/*'],
            }, null, 2)],
    ];
    for (const [filePath, content] of files) {
        fs.writeFileSync(path.join(projectPath, filePath), content);
    }
    // Print success with ASCII art
    console.log('');
    console.log('  ╔══════════════════════════════════════════════╗');
    console.log('  ║         🧬 O P E N  E V O  v1.0.0          ║');
    console.log('  ║       "Evolve Your Codebase"                ║');
    console.log('  ╠══════════════════════════════════════════════╣');
    console.log(`  ║  Bot Name: ${displayName.padEnd(33)}║`);
    console.log(`  ║  Project:  ${projectName.padEnd(33)}║`);
    console.log('  ╚══════════════════════════════════════════════╝');
    console.log('');
}
export async function addPlugin(projectPath, pluginName) {
    const configPath = path.join(projectPath, 'config.yaml');
    if (!fs.existsSync(configPath)) {
        console.error('❌ Not an OpenEvo project. Run this inside your project directory.');
        process.exit(1);
    }
    const normalizedPlugin = pluginName.toLowerCase();
    const pluginDir = path.join(projectPath, 'src', 'adapters');
    if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir, { recursive: true });
    }
    const envPath = path.join(projectPath, '.env');
    const adapters = {
        wechat: {
            envVars: '\n# WeChat Official Account\nWECHAT_APP_ID=\nWECHAT_APP_SECRET=\nWECHAT_TOKEN=\n',
            code: `/**
 * WeChat Official Account Adapter
 * 
 * Connects your OpenEvo bot to WeChat (1.3B users in China).
 * Users can chat with your bot directly through their WeChat app.
 * 
 * Strategic Note: Chinese users can pair this with local LLMs
 * (DeepSeek, Qwen) to bypass the Great Firewall entirely.
 * 
 * Setup: https://docs.openevo.co/adapters/wechat
 */

export class WeChatAdapter {
  private appId?: string;
  private appSecret?: string;

  async connect(): Promise<void> {
    this.appId = process.env.WECHAT_APP_ID;
    this.appSecret = process.env.WECHAT_APP_SECRET;
    console.log('[WeChat] Adapter initialized. Awaiting webhook...');
    // TODO: Implement WeChat XML message verification & response
  }

  async handleMessage(xmlBody: string): Promise<string> {
    // TODO: Parse WeChat XML, dispatch to engine, return XML response
    return '<xml><Content>EVO is alive.</Content></xml>';
  }
}
`,
        },
        line: {
            envVars: '\n# LINE Messaging API\nLINE_CHANNEL_ACCESS_TOKEN=\nLINE_CHANNEL_SECRET=\n',
            code: `/**
 * LINE Messaging API Adapter
 * 
 * Connects your OpenEvo bot to LINE (200M users: Japan, Thailand, Taiwan).
 * The dominant messaging platform in the Asian companion market.
 * 
 * Setup: https://docs.openevo.co/adapters/line
 */

export class LINEAdapter {
  private channelToken?: string;

  async connect(): Promise<void> {
    this.channelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    console.log('[LINE] Adapter initialized. Awaiting webhook...');
    // TODO: Implement LINE webhook signature verification
  }

  async replyMessage(replyToken: string, text: string): Promise<void> {
    // TODO: Implement LINE reply message API
    console.log(\`[LINE] Reply to \${replyToken}: \${text}\`);
  }
}
`,
        },
        kakao: {
            envVars: '\n# KakaoTalk\nKAKAO_REST_API_KEY=\nKAKAO_ADMIN_KEY=\n',
            code: `/**
 * KakaoTalk Adapter
 * 
 * Connects your OpenEvo bot to KakaoTalk (53M users in South Korea).
 * Targets the lucrative Korean companion and gaming market.
 * 
 * Note: Korean Tech AI has a significant gap — no major native competitor
 * currently offers AI companions on KakaoTalk.
 * 
 * Setup: https://docs.openevo.co/adapters/kakaotalk
 */

export class KakaoTalkAdapter {
  private restApiKey?: string;

  async connect(): Promise<void> {
    this.restApiKey = process.env.KAKAO_REST_API_KEY;
    console.log('[KakaoTalk] Adapter initialized. Awaiting webhook...');
    // TODO: Implement Kakao i Open Builder webhook
  }

  async sendMessage(userId: string, text: string): Promise<void> {
    // TODO: Implement KakaoTalk send message
    console.log(\`[KakaoTalk] Send to \${userId}: \${text}\`);
  }
}
`,
        },
        telegram: {
            envVars: '\n# Telegram Bot\nTELEGRAM_BOT_TOKEN=\n',
            code: `/**
 * Telegram Bot Adapter
 * Setup: https://docs.openevo.co/adapters/telegram
 */

export class TelegramAdapter {
  async connect(): Promise<void> {
    console.log('[Telegram] Adapter initialized.');
    // TODO: Implement Telegram Bot API long polling or webhook
  }
}
`,
        },
        discord: {
            envVars: '\n# Discord Bot\nDISCORD_BOT_TOKEN=\n',
            code: `/**
 * Discord Bot Adapter
 * Setup: https://docs.openevo.co/adapters/discord
 */

export class DiscordAdapter {
  async connect(): Promise<void> {
    console.log('[Discord] Adapter initialized.');
    // TODO: Implement Discord.js gateway connection
  }
}
`,
        },
    };
    const adapter = adapters[normalizedPlugin];
    if (!adapter) {
        const supported = Object.keys(adapters).join(', ');
        console.error(`❌ Unknown adapter "${pluginName}". Supported: ${supported}`);
        process.exit(1);
    }
    // Append env vars
    if (fs.existsSync(envPath)) {
        fs.appendFileSync(envPath, adapter.envVars);
    }
    // Write adapter file
    const targetPath = path.join(pluginDir, `${normalizedPlugin}.ts`);
    if (fs.existsSync(targetPath)) {
        console.warn(`⚠️ Adapter ${normalizedPlugin}.ts already exists. Skipping.`);
    }
    else {
        fs.writeFileSync(targetPath, adapter.code);
    }
    console.log(`✅ Adapter "${pluginName}" added!`);
    console.log(`📁 Check: src/adapters/${normalizedPlugin}.ts`);
    console.log(`🔑 Configure: .env (add your API keys)`);
}
