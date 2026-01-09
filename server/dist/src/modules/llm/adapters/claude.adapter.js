"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAdapter = void 0;
class ClaudeAdapter {
    apiKey;
    baseUrl;
    constructor(apiKey, baseUrl = 'https://api.anthropic.com/v1') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    async *chat(messages, stream) {
        const systemMessage = messages.find((m) => m.role === 'system');
        const chatMessages = messages.filter((m) => m.role !== 'system');
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                system: systemMessage?.content,
                messages: chatMessages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                stream,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error (${response.status}): ${error}`);
        }
        if (!stream) {
            const data = await response.json();
            if (data.error) {
                throw new Error(`Claude API error: ${data.error.message}`);
            }
            yield data.content[0].text;
            return;
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Failed to get response stream');
        }
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const parsed = JSON.parse(line.slice(6));
                        if (parsed.type === 'error') {
                            throw new Error(`Claude API error: ${parsed.error.message}`);
                        }
                        if (parsed.type === 'content_block_delta') {
                            yield parsed.delta.text;
                        }
                    }
                    catch (e) {
                        if (e instanceof SyntaxError)
                            continue;
                        throw e;
                    }
                }
            }
        }
    }
}
exports.ClaudeAdapter = ClaudeAdapter;
//# sourceMappingURL=claude.adapter.js.map