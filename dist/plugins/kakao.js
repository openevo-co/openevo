export class KakaoPlugin {
    name = 'kakao';
    restApiKey;
    messageCallback;
    async connect(config) {
        this.restApiKey = config.restApiKey;
        console.log(`[KakaoTalk] Connecting with REST API Key...`);
        // TODO: Initialize Kakao REST API Webhooks
    }
    async sendMessage(targetId, message) {
        console.log(`[KakaoTalk] Sending message to ${targetId}: ${message}`);
        // TODO: Implement Kakao send message
    }
    onMessage(callback) {
        this.messageCallback = callback;
        console.log(`[KakaoTalk] Webhook listener registered.`);
    }
    async disconnect() {
        console.log(`[KakaoTalk] Disconnected.`);
    }
}
