export interface Message {
    username: string;
    role: 'user' | 'assistant';
    content: string;
}

export interface ModerationResult {
    flagged: boolean;
    reason: string;
    action: 'allow' | 'warn' | 'block';
    severity: 'none' | 'low' | 'medium' | 'high';
}

export interface AIProvider {
    analyzeContext(messages: Message[]): Promise<ModerationResult>;
}