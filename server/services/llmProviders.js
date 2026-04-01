/**
 * LLM Providers Service
 * Unified abstraction for multiple LLM providers (OpenAI, Anthropic, Google, Zhipu, DeepSeek, MiniMax)
 */

// Provider configurations with model lists
const PROVIDER_CONFIGS = {
    openai: {
        name: 'OpenAI',
        envKey: 'OPENAI_API_KEY',
        models: [
            { id: 'gpt-4o', name: 'GPT-4o (Recommended)', default: true },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Faster)' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Economy)' }
        ]
    },
    anthropic: {
        name: 'Anthropic',
        envKey: 'ANTHROPIC_API_KEY',
        models: [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Recommended)', default: true },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Faster)' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Most Capable)' }
        ]
    },
    google: {
        name: 'Google AI',
        envKey: 'GOOGLE_AI_API_KEY',
        models: [
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Recommended)', default: true },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Faster)' }
        ]
    },
    zhipu: {
        name: 'Zhipu AI',
        envKey: 'ZHIPU_API_KEY',
        models: [
            { id: 'glm-4-plus', name: 'GLM-4 Plus (Recommended)', default: true },
            { id: 'glm-4', name: 'GLM-4' },
            { id: 'glm-4-flash', name: 'GLM-4 Flash (Faster)' }
        ]
    },
    deepseek: {
        name: 'DeepSeek',
        envKey: 'DEEPSEEK_API_KEY',
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat (Recommended)', default: true },
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)' }
        ]
    },
    minimax: {
        name: 'MiniMax',
        envKey: 'MINIMAX_API_KEY',
        models: [
            { id: 'abab6.5s-chat', name: 'ABAB 6.5s Chat (Recommended)', default: true },
            { id: 'abab6.5-chat', name: 'ABAB 6.5 Chat' }
        ]
    }
};

// Security utility to mask API keys in logs
function maskApiKey(key) {
    if (!key || key.length < 8) return '***';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

/**
 * Base class for LLM providers
 */
class LLMProvider {
    constructor(name, apiKey) {
        this.name = name;
        this.apiKey = apiKey;
    }

    async chat(systemPrompt, userMessage, model) {
        throw new Error('chat() must be implemented by subclass');
    }

    isConfigured() {
        return !!this.apiKey;
    }
}

/**
 * OpenAI Provider
 */
class OpenAIProvider extends LLMProvider {
    constructor(apiKey) {
        super('openai', apiKey);
        if (apiKey) {
            const OpenAI = require('openai');
            this.client = new OpenAI({ apiKey });
        }
    }

    async chat(systemPrompt, userMessage, model = 'gpt-4o') {
        try {
            const response = await this.client.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0].message.content || '{}';
            console.log('🤖 OpenAI Raw Content received (brief):', content.substring(0, 100) + '...');

            try {
                // Try direct parse first
                return JSON.parse(content);
            } catch (parseError) {
                console.warn('⚠️ Failed to parse OpenAI JSON response, attempting extraction:', parseError.message);

                // Regex to find JSON object structure
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        return JSON.parse(jsonMatch[0]);
                    } catch (innerParseError) {
                        console.error('❌ Refined JSON extraction failed:', innerParseError.message);
                    }
                }

                // If it's just a string, wrap it in the expected message structure
                return {
                    message: content,
                    mapCommands: [],
                    _was_string_fallback: true
                };
            }
        } catch (error) {
            console.error('❌ OpenAI API Error details:', {
                message: error.message,
                type: error.type,
                code: error.code,
                status: error.status
            });
            throw error;
        }
    }
}

/**
 * Anthropic Provider
 */
class AnthropicProvider extends LLMProvider {
    constructor(apiKey) {
        super('anthropic', apiKey);
        if (apiKey) {
            const Anthropic = require('@anthropic-ai/sdk').default;
            this.client = new Anthropic({ apiKey });
        }
    }

    async chat(systemPrompt, userMessage, model = 'claude-3-5-sonnet-20241022') {
        try {
            const response = await this.client.messages.create({
                model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }]
            });

            const content = response.content[0].text;
            try {
                // Extract JSON if it's wrapped in markdown or text
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : content;
                return JSON.parse(jsonStr);
            } catch {
                return { message: content, mapCommands: [] };
            }
        } catch (error) {
            console.error('❌ Anthropic API Error:', error.message);
            throw error;
        }
    }
}

/**
 * Google AI Provider
 */
class GoogleProvider extends LLMProvider {
    constructor(apiKey) {
        super('google', apiKey);
        if (apiKey) {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            this.client = new GoogleGenerativeAI(apiKey);
        }
    }

    async chat(systemPrompt, userMessage, model = 'gemini-2.0-flash') {
        const genModel = this.client.getGenerativeModel({
            model,
            systemInstruction: systemPrompt
        });

        const result = await genModel.generateContent(userMessage);
        const content = result.response.text();

        // Try to parse as JSON
        try {
            // Extract JSON from markdown code blocks if present
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : content;
            return JSON.parse(jsonStr);
        } catch {
            return { message: content, mapCommands: [] };
        }
    }
}

/**
 * Zhipu AI Provider (GLM models)
 */
class ZhipuProvider extends LLMProvider {
    constructor(apiKey) {
        super('zhipu', apiKey);
        this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    }

    async chat(systemPrompt, userMessage, model = 'glm-4-plus') {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;

        try {
            return JSON.parse(content);
        } catch {
            return { message: content, mapCommands: [] };
        }
    }
}

/**
 * DeepSeek Provider
 */
class DeepSeekProvider extends LLMProvider {
    constructor(apiKey) {
        super('deepseek', apiKey);
        this.baseUrl = 'https://api.deepseek.com/chat/completions';
    }

    async chat(systemPrompt, userMessage, model = 'deepseek-chat') {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                response_format: { type: 'json_object' }
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        return JSON.parse(content);
    }
}

/**
 * MiniMax Provider
 */
class MiniMaxProvider extends LLMProvider {
    constructor(apiKey) {
        super('minimax', apiKey);
        this.baseUrl = 'https://api.minimax.chat/v1/text/chatcompletion_v2';
    }

    async chat(systemPrompt, userMessage, model = 'abab6.5s-chat') {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;

        try {
            return JSON.parse(content);
        } catch {
            return { message: content, mapCommands: [] };
        }
    }
}

/**
 * LLM Provider Manager
 * Manages multiple providers and active selection
 */
class LLMProviderManager {
    constructor() {
        this.providers = {};
        this.activeProvider = null;
        this.activeModel = null;
        this.initialize();
    }

    initialize() {
        // Initialize all providers based on environment variables
        const providerClasses = {
            openai: OpenAIProvider,
            anthropic: AnthropicProvider,
            google: GoogleProvider,
            zhipu: ZhipuProvider,
            deepseek: DeepSeekProvider,
            minimax: MiniMaxProvider
        };

        for (const [key, config] of Object.entries(PROVIDER_CONFIGS)) {
            const apiKey = process.env[config.envKey];
            const ProviderClass = providerClasses[key];
            this.providers[key] = new ProviderClass(apiKey);

            if (apiKey) {
                console.log(`✅ ${config.name} configured (${maskApiKey(apiKey)})`);
            }
        }

        // Set active provider from env or first available
        const envProvider = process.env.LLM_PROVIDER;
        const envModel = process.env.LLM_MODEL;

        if (envProvider && this.providers[envProvider]?.isConfigured()) {
            this.activeProvider = envProvider;
            this.activeModel = envModel || this.getDefaultModel(envProvider);
        } else {
            // Prioritize Google Gemini if available
            if (this.providers.google?.isConfigured()) {
                this.activeProvider = 'google';
                this.activeModel = this.getDefaultModel('google');
            } else {
                // Find first configured provider
                for (const [key, provider] of Object.entries(this.providers)) {
                    if (provider.isConfigured()) {
                        this.activeProvider = key;
                        this.activeModel = this.getDefaultModel(key);
                        break;
                    }
                }
            }
        }

        if (this.activeProvider) {
            console.log(`🤖 Active LLM: ${PROVIDER_CONFIGS[this.activeProvider].name} (${this.activeModel})`);
        } else {
            console.log('⚠️ No LLM provider configured - AI features disabled');
        }
    }

    getDefaultModel(providerKey) {
        const models = PROVIDER_CONFIGS[providerKey]?.models || [];
        const defaultModel = models.find(m => m.default);
        return defaultModel?.id || models[0]?.id;
    }

    getAvailableProviders() {
        return Object.entries(PROVIDER_CONFIGS).map(([key, config]) => ({
            id: key,
            name: config.name,
            configured: this.providers[key]?.isConfigured() || false,
            models: config.models,
            active: this.activeProvider === key
        }));
    }

    getActiveProvider() {
        return this.activeProvider ? this.providers[this.activeProvider] : null;
    }

    setActiveProvider(providerKey, model) {
        if (!this.providers[providerKey]) {
            throw new Error(`Unknown provider: ${providerKey}`);
        }
        if (!this.providers[providerKey].isConfigured()) {
            throw new Error(`Provider ${providerKey} is not configured. Please set ${PROVIDER_CONFIGS[providerKey].envKey} in .env`);
        }

        this.activeProvider = providerKey;
        this.activeModel = model || this.getDefaultModel(providerKey);

        console.log(`🔄 Switched to ${PROVIDER_CONFIGS[providerKey].name} (${this.activeModel})`);
        return { provider: this.activeProvider, model: this.activeModel };
    }

    async chat(systemPrompt, userMessage) {
        const provider = this.getActiveProvider();
        if (!provider) {
            throw new Error('No LLM provider configured. Please set at least one API key in .env');
        }

        return provider.chat(systemPrompt, userMessage, this.activeModel);
    }

    hasConfiguredProvider() {
        return Object.values(this.providers).some(p => p.isConfigured());
    }
}

// Singleton instance
const llmManager = new LLMProviderManager();

module.exports = {
    llmManager,
    PROVIDER_CONFIGS,
    maskApiKey
};
