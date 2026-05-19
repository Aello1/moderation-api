import { AIProvider, Message, ModerationResult } from './providers/base.provider';
import { GroqProvider } from './providers/groq.provider';

function getProvider(): AIProvider {
    const provider =  process.env.AI_PROVIDER || 'groq';
    
    switch (provider) {
        case 'groq':
            return new GroqProvider();
        default:
            return new GroqProvider();
    }
}

export async function analyzeContext(message: Message[]): Promise<ModerationResult> {
    const provider = getProvider();
    return provider.analyzeContext(message);
}

export type { Message, ModerationResult }