import { OpenEvoPlugin, MessagePayload } from './base.js';

export class WhatsAppPlugin implements OpenEvoPlugin {
  name = 'whatsapp';
  private accessToken?: string;
  private phoneNumberId?: string;
  private messageCallback?: (message: MessagePayload) => void;

  async connect(config: Record<string, any>): Promise<void> {
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
    console.log(`[WhatsApp] Connecting to Meta Cloud API...`);
    // TODO: Initialize WhatsApp Webhook
  }

  async sendMessage(targetId: string, message: string): Promise<void> {
    console.log(`[WhatsApp] Sending message to ${targetId}: ${message}`);
    // TODO: Implement Meta Graph API send message
  }

  onMessage(callback: (message: MessagePayload) => void): void {
    this.messageCallback = callback;
    console.log(`[WhatsApp] Webhook listener registered.`);
  }

  async disconnect(): Promise<void> {
    console.log(`[WhatsApp] Disconnected.`);
  }
}
