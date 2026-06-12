import { OpenEvoPlugin, MessagePayload } from './base.js';

export class KakaoPlugin implements OpenEvoPlugin {
  name = 'kakao';
  private restApiKey?: string;
  private messageCallback?: (message: MessagePayload) => void;

  async connect(config: Record<string, any>): Promise<void> {
    this.restApiKey = config.restApiKey;
    console.log(`[KakaoTalk] Connecting with REST API Key...`);
    // TODO: Initialize Kakao REST API Webhooks
  }

  async sendMessage(targetId: string, message: string): Promise<void> {
    console.log(`[KakaoTalk] Sending message to ${targetId}: ${message}`);
    // TODO: Implement Kakao send message
  }

  onMessage(callback: (message: MessagePayload) => void): void {
    this.messageCallback = callback;
    console.log(`[KakaoTalk] Webhook listener registered.`);
  }

  async disconnect(): Promise<void> {
    console.log(`[KakaoTalk] Disconnected.`);
  }
}
