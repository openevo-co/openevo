import { OpenEvoPlugin, MessagePayload } from './base.js';

export class TelegramPlugin implements OpenEvoPlugin {
  name = 'telegram';
  private botToken?: string;
  private messageCallback?: (message: MessagePayload) => void;

  async connect(config: Record<string, any>): Promise<void> {
    this.botToken = config.botToken;
    console.log(`[Telegram] Connecting to bot with token: ${this.botToken ? '***' : 'MISSING'}`);
    // TODO: Initialize Telegram Webhook or Long Polling here
  }

  async sendMessage(targetId: string, message: string): Promise<void> {
    console.log(`[Telegram] Sending message to ${targetId}: ${message}`);
    // TODO: Use Telegram Bot API to send message
  }

  onMessage(callback: (message: MessagePayload) => void): void {
    this.messageCallback = callback;
    console.log(`[Telegram] Registered message listener.`);
  }

  async disconnect(): Promise<void> {
    console.log(`[Telegram] Disconnected.`);
  }
}
