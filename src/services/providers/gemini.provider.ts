import { GoogleGenAI } from '@google/genai';
import { AIProvider, Message, ModerationResult } from './base.provider';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });

export class GeminiProvider implements AIProvider {
    async analyzeContext(messages: Message[]): Promise<ModerationResult> {
        const conversation = messages
            .map((m) => `${m.username}: ${m.content}`)
            .join('\n');

        const prompt = `You are a content moderation assistant. You will be given a conversation history.
Analyze the conversation with its full context and respond ONLY with the following JSON format:
{
  "flagged": true/false,
  "reason": "brief explanation of why the content is harmful or safe",
  "action": "allow/warn/block",
  "severity": "none/low/medium/high"
}
Do not write anything outside of the JSON. No markdown, no explanation, just the JSON object.

Conversation:
${conversation}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const raw = response.text ?? '{}';
        const cleaned = raw.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    }
}