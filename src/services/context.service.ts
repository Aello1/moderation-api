import prisma from '../prisma';
import { AIProvider, Message, ModerationResult } from './providers/base.provider';
import { GroqProvider } from './providers/groq.provider';

function getProvider(): AIProvider {
    const provider = process.env.AI_PROVIDER || 'groq';

    switch (provider) {
        case 'groq':
            return new GroqProvider();
        default:
            return new GroqProvider();
    }
}

export async function analyzeContext(messages: Message[]): Promise<ModerationResult> {
    const provider = getProvider();
    const result = await provider.analyzeContext(messages);

    await prisma.contextLog.create({
        data: {
            messages: messages as any,
            flagged: result.flagged,
            reason: result.reason,
            action: result.action,
            severity: result.severity,
            provider: process.env.AI_PROVIDER || 'groq'
        }
    });

    return result;
}

export type { Message, ModerationResult }