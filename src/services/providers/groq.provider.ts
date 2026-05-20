import Groq from 'groq-sdk';
import { AIProvider, Message, ModerationResult } from './base.provider';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export class GroqProvider implements AIProvider {
    async analyzeContext(messages: Message[]): Promise<ModerationResult> {
        const conversation = messages.map(m => `${m.username}: ${m.content}`).join('\n');
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a content moderation assistant. You will be given a conversation history.
Analyze the conversation with its full context and respond ONLY with the following JSON format:
{
  "flagged": true/false,
  "reason": "brief explanation of why the content is harmful or safe",
  "action": "allow/warn/block",
  "severity": "none/low/medium/high"
}
Do not write anything outside of the JSON. No markdown, no explanation, just the JSON object.`,
                },
                {
                    role: 'user',
                    content: conversation
                }
            ],
            temperature: 0.1
        });

        const raw = response.choices[0].message.content ?? '{}';
        const result = JSON.parse(raw);
        return result;
    }
}