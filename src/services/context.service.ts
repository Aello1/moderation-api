import prisma from '../prisma';
import { AIProvider, Message, ModerationResult } from './providers/base.provider';
import { GroqProvider } from './providers/groq.provider';
import { GeminiProvider } from './providers/gemini.provider';

function getProvider(providerName: string): AIProvider {
  switch (providerName) {
    case 'groq':
      return new GroqProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      return new GroqProvider();
  }
}

export async function analyzeContext(messages: Message[]): Promise<ModerationResult> {
  const primaryName = process.env.AI_PROVIDER ?? 'groq';
  const fallbackName = process.env.AI_FALLBACK;

  const primary = getProvider(primaryName);
  let usedProvider = primaryName;

  let result: ModerationResult;

  try {
    result = await primary.analyzeContext(messages);
  } catch (primaryError) {
    if (!fallbackName) {
      throw primaryError;
    }

    console.warn(`Primary provider (${primaryName}) failed, switching to fallback (${fallbackName})`);
    const fallback = getProvider(fallbackName);
    usedProvider = fallbackName;
    result = await fallback.analyzeContext(messages);
  }

  await prisma.contextLog.create({
    data: {
      messages: messages as any,
      flagged: result.flagged,
      reason: result.reason,
      action: result.action,
      severity: result.severity,
      provider: usedProvider,
    },
  });

  return result;
}

export type { Message, ModerationResult };