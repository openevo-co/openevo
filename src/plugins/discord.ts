import { OpenEvoPlugin, MessagePayload } from './base.js';

export class DiscordPlugin implements OpenEvoPlugin {
  name = 'discord';
  private botToken?: string;
  private messageCallback?: (message: MessagePayload) => void;

  async connect(config: Record<string, any>): Promise<void> {
    this.botToken = config.botToken;
    console.log(`[Discord] Connecting to gateway...`);
    // TODO: Initialize discord.js client
  }

  async sendMessage(targetId: string, message: string): Promise<void> {
    console.log(`[Discord] Sending message to channel/user ${targetId}: ${message}`);
    // TODO: discord.js send message
  }

  onMessage(callback: (message: MessagePayload) => void): void {
    this.messageCallback = callback;
    console.log(`[Discord] Listening to messageCreate events.`);
  }

  async disconnect(): Promise<void> {
    console.log(`[Discord] Disconnected.`);
  }
}
