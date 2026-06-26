#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { scaffoldProject, addPlugin } from './scaffold.js';
import { sendTelemetry } from './telemetry.js';

/**
 * OpenEvo CLI — The Sovereign Exoskeleton
 * 
 * Usage:
 *   npx create-openevo                     → Interactive setup
 *   npx create-openevo --name "Nexus"      → Quick setup with custom node name
 *   npx create-openevo sovereign-node      → Quick setup with project name
 *   openevo add wechat                     → Add WeChat adapter
 *   openevo add line                       → Add LINE adapter
 *   openevo add kakao                      → Add KakaoTalk adapter
 *   openevo add telegram                   → Add Telegram adapter
 */

const BANNER = `
  ╔══════════════════════════════════════════════╗
  ║         🧬 O P E N  E V O  v1.0.0          ║
  ║       "Evolve Your Codebase"                ║
  ╚══════════════════════════════════════════════╝
`;

const program = new Command();

program
  .name('create-openevo')
  .description('Create and manage sovereign cognitive nodes')
  .version('1.0.0');

// Main: init command (default when user runs `npx create-openevo`)
program
  .command('init [project-name]', { isDefault: true })
  .description('Initialize a new OpenEvo cognitive node project')
  .option('-n, --name <node-name>', 'Custom name for your sovereign node')
  .action(async (projectName, options) => {
    console.log(BANNER);

    let name = projectName;
    let botName = options.name;

    // Interactive prompts if not provided via CLI flags
    if (!name || !botName) {
      const answers = await inquirer.prompt([
        ...(!name ? [{
          type: 'input' as const,
          name: 'projectName',
          message: '📁 Project directory name:',
          default: 'openevo-instance',
        }] : []),
        ...(!botName ? [{
          type: 'input' as const,
          name: 'botName',
          message: '🤖 Name your cognitive node:',
          default: 'CORE',
        }] : []),
      ]);

      name = name || answers.projectName;
      botName = botName || answers.botName;
    }

    console.log(`\n🚀 Creating "${botName}" in ./${name}...\n`);

    await sendTelemetry('init_project');
    await scaffoldProject(name, botName);

    console.log(`\n✅ ${botName} is ready to awaken!\n`);
    console.log('  Next steps:');
    console.log(`  $ cd ${name}`);
    console.log('  $ npm install');
    console.log('  $ npm run dev\n');
    console.log('  📖 Edit persona/rule.md to define your companion\'s personality.');
    console.log('  🔑 Edit .env to add your LLM API key.');
    console.log('  ⚙️  Edit config.yaml to choose your LLM provider.\n');
  });

// Sub-command: add adapter
program
  .command('add <adapter-name>')
  .description('Add a chat adapter (wechat, line, kakao, telegram, discord)')
  .action(async (adapterName) => {
    console.log(`\n🔌 Adding adapter: ${adapterName}...\n`);
    await sendTelemetry(`add_adapter_${adapterName}`);
    await addPlugin(process.cwd(), adapterName);
  });

// Sub-command: chat (run the engine from inside a project)
program
  .command('chat')
  .description('Start chatting with your companion (run inside project dir)')
  .action(async () => {
    try {
      const { initEngine } = await import('./engine/core.js');
      const engine = initEngine(process.cwd());
      const stats = engine.getStats();
      const readline = await import('readline');

      console.log(BANNER);
      console.log(`  Bot: ${stats.botName}`);
      console.log(`  Provider: ${stats.provider} / ${stats.model}`);
      console.log(`  Memories: ${stats.memories}`);
      console.log('\n  Type your message. Press Ctrl+C to exit.\n');

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const prompt = () => {
        rl.question(`\x1b[36myou:\x1b[0m `, async (input) => {
          const trimmed = input.trim();
          if (!trimmed) return prompt();

          try {
            const response = await engine.chat(trimmed);
            console.log(`\x1b[33m${stats.botName}:\x1b[0m ${response}\n`);
          } catch (err: any) {
            console.error(`\x1b[31m[Error]\x1b[0m ${err.message}\n`);
          }

          prompt();
        });
      };

      prompt();
    } catch (err: any) {
      console.error('❌ Not inside an OpenEvo project. Run `create-openevo init` first.');
      process.exit(1);
    }
  });

program.parse(process.argv);
