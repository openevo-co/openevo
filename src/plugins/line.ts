import { OpenEvoPlugin, MessagePayload } from './base.js';

export class LinePlugin implements OpenEvoPlugin {
  name = 'line';
  private channelAccessToken?: string;
  private channelSecret?: string;
  private messageCallback?: (message: MessagePayload) => void;

  async connect(config: Record<string, any>): Promise<void> {
    this.channelAccessToken = config.channelAccessToken;
    this.channelSecret = config.channelSecret;
    console.log(`[LINE] Connecting to LINE Messaging API...`);
    // TODO: Initialize LINE SDK
  }

  async sendMessage(targetId: string, message: string): Promise<void> {
    console.log(`[LINE] Sending push message to ${targetId}: ${message}`);
    // TODO: Implement LINE Messaging API push message
  }

  onMessage(callback: (message: MessagePayload) => void): void {
    this.messageCallback = callback;
    console.log(`[LINE] Registered message listener (Webhook ready).`);
  }

  async disconnect(): Promise<void> {
    console.log(`[LINE] Disconnected.`);
  }
}
