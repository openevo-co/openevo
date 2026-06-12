/**
 * OpenEvo LLM Provider Router
 *
 * Routes chat completions to the user's chosen LLM backend.
 * Supported: OpenRouter, Ollama (local), OpenAI-compatible APIs.
 *
 * The user pays for their own API calls. We pay nothing.
 * "Give away the razor to sell the blades."
 */
const DEFAULT_ENDPOINTS = {
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    ollama: 'http://localhost:11434/api/chat',
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
    local: 'http://localhost:11434/api/chat',
};
/** Send a chat completion request to the configured LLM provider */
export async function sendCompletion(config, messages) {
    const baseUrl = config.baseUrl || DEFAULT_ENDPOINTS[config.provider];
    switch (config.provider) {
        case 'ollama':
        case 'local':
            return sendOllama(baseUrl, config, messages);
        case 'anthropic':
            return sendAnthropic(baseUrl, config, messages);
        case 'gemini':
            return sendGemini(baseUrl, config, messages);
        default:
            return sendOpenAICompatible(baseUrl, config, messages);
    }
}
/** OpenAI-compatible API (works for OpenRouter & OpenAI) */
async function sendOpenAICompatible(baseUrl, config, messages) {
    if (!config.apiKey) {
        throw new Error(`[OpenEvo] No API key found for provider "${config.provider}". ` +
            `Set it in your .env file.`);
    }
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
    };
    // OpenRouter requires extra headers
    if (config.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://openevo.co';
        headers['X-Title'] = 'OpenEvo';
    }
    const body = {
        model: config.model,
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2048,
    };
    const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`[OpenEvo] LLM API error (${response.status}): ${errText}`);
    }
    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
        throw new Error('[OpenEvo] LLM returned empty response.');
    }
    return {
        content: choice.message.content,
        model: data.model || config.model,
        tokensUsed: data.usage?.total_tokens,
    };
}
/** Ollama local API (different payload format) */
async function sendOllama(baseUrl, config, messages) {
    const body = {
        model: config.model,
        messages,
        stream: false,
        options: {
            temperature: config.temperature ?? 0.7,
            num_predict: config.maxTokens ?? 2048,
        },
    };
    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`[OpenEvo] Ollama error (${response.status}): ${errText}`);
    }
    const data = await response.json();
    if (!data.message?.content) {
        throw new Error('[OpenEvo] Ollama returned empty response.');
    }
    return {
        content: data.message.content,
        model: data.model || config.model,
        tokensUsed: data.eval_count,
    };
}
/** Anthropic Messages API */
async function sendAnthropic(baseUrl, config, messages) {
    if (!config.apiKey) {
        throw new Error(`[OpenEvo] No API key found for provider "anthropic". ` +
            `Set ANTHROPIC_API_KEY in your .env file.`);
    }
    // Anthropic requires system prompt as a top-level field, not in messages
    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');
    const body = {
        model: config.model,
        messages: nonSystemMsgs.map(m => ({ role: m.role, content: m.content })),
        max_tokens: config.maxTokens ?? 2048,
        temperature: config.temperature ?? 0.7,
    };
    if (systemMsg) {
        body.system = systemMsg.content;
    }
    const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`[OpenEvo] Anthropic API error (${response.status}): ${errText}`);
    }
    const data = await response.json();
    const textBlock = data.content?.find((b) => b.type === 'text');
    if (!textBlock?.text) {
        throw new Error('[OpenEvo] Anthropic returned empty response.');
    }
    return {
        content: textBlock.text,
        model: data.model || config.model,
        tokensUsed: data.usage ? data.usage.input_tokens + data.usage.output_tokens : undefined,
    };
}
/** Google Gemini API */
async function sendGemini(baseUrl, config, messages) {
    if (!config.apiKey) {
        throw new Error(`[OpenEvo] No API key found for provider "gemini". ` +
            `Set GEMINI_API_KEY in your .env file.`);
    }
    // Gemini uses 'user'/'model' roles and a separate systemInstruction field
    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');
    const contents = nonSystemMsgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));
    const body = {
        contents,
        generationConfig: {
            temperature: config.temperature ?? 0.7,
            maxOutputTokens: config.maxTokens ?? 2048,
        },
    };
    if (systemMsg) {
        body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }
    const endpoint = `${baseUrl}/${config.model}:generateContent?key=${config.apiKey}`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`[OpenEvo] Gemini API error (${response.status}): ${errText}`);
    }
    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error('[OpenEvo] Gemini returned empty response.');
    }
    return {
        content: text,
        model: config.model,
        tokensUsed: data.usageMetadata
            ? data.usageMetadata.promptTokenCount + data.usageMetadata.candidatesTokenCount
            : undefined,
    };
}
/** Build a ProviderConfig from environment variables and config.yaml values */
export function resolveProvider(configYaml) {
    const provider = (configYaml?.provider || 'ollama');
    const model = configYaml?.model || (provider === 'ollama' || provider === 'local' ? 'qwen3.5:2b' : 'gpt-4');
    const envKeyMap = {
        openrouter: 'OPENROUTER_API_KEY',
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        gemini: 'GEMINI_API_KEY',
        ollama: '',
        local: '',
    };
    const apiKey = process.env[envKeyMap[provider]] || undefined;
    return {
        provider,
        model,
        apiKey,
        baseUrl: configYaml?.base_url,
        temperature: configYaml?.temperature,
        maxTokens: configYaml?.max_tokens,
    };
}
