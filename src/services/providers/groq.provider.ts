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
                    content: `Sen bir içerik moderasyon asistanısın. Sana bir konuşma geçmişi verilecek.
Bu konuşmayı bağlamıyla birlikte analiz et ve şu JSON formatında yanıt ver:
{
  "flagged": true/false,
  "reason": "neden zararlı veya zararsız olduğunun kısa açıklaması",
  "action": "allow/warn/block",
  "severity": "none/low/medium/high"
}
Sadece JSON döndür, başka hiçbir şey yazma.`
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