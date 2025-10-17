import OpenAI from 'openai';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private initialized = false;

  /**
   * Initialize the OpenAI client
   */
  initialize(apiKey: string): void {
    if (!apiKey) {
      console.warn('⚠ OpenAI API key not provided. LLM features will use fallback responses.');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey,
      });
      this.initialized = true;
      console.log('✓ OpenAI service initialized');
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      throw error;
    }
  }

  /**
   * Check if OpenAI is initialized and ready
   */
  isReady(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Generate the first question for a new legal consultation
   */
  async generateFirstQuestion(userName: string): Promise<string> {
    if (!this.isReady()) {
      return this.getFallbackFirstQuestion(userName);
    }

    try {
      const systemPrompt = `You are a helpful legal assistant for EASYLEGAL, a platform that helps users with legal questions.
Your role is to gather information from users about their legal situation by asking clear, focused questions.
Be professional, empathetic, and concise. Ask one question at a time.
Your first question should be welcoming and ask about the type of legal matter they need help with.`;

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `The user's name is ${userName}. Generate a welcoming first question to start gathering information about their legal matter.` },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content || this.getFallbackFirstQuestion(userName);
    } catch (error) {
      console.error('OpenAI API error (first question):', error);
      return this.getFallbackFirstQuestion(userName);
    }
  }

  /**
   * Generate the next question based on conversation history
   */
  async generateNextQuestion(conversationHistory: Message[], latestUserMessage: string): Promise<string> {
    if (!this.isReady()) {
      return this.getFallbackNextQuestion(conversationHistory.length);
    }

    try {
      const systemPrompt = `You are a helpful legal assistant for EASYLEGAL.
Your role is to gather comprehensive information about the user's legal situation by asking follow-up questions.
Based on the conversation so far, ask a relevant follow-up question to better understand their case.
Be professional, empathetic, and concise. Ask one focused question at a time.
After gathering enough information (typically 3-5 exchanges), you should start wrapping up and offer to summarize.`;

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((msg): OpenAI.Chat.ChatCompletionMessageParam => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: latestUserMessage },
      ];

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 250,
      });

      return response.choices[0]?.message?.content || this.getFallbackNextQuestion(conversationHistory.length);
    } catch (error) {
      console.error('OpenAI API error (next question):', error);
      return this.getFallbackNextQuestion(conversationHistory.length);
    }
  }

  /**
   * Check if the conversation should end based on the conversation history
   */
  async shouldEndConversation(conversationHistory: Message[]): Promise<boolean> {
    if (!this.isReady()) {
      // Fallback: end after 8 messages (4 Q&A pairs)
      return conversationHistory.length >= 8;
    }

    try {
      const systemPrompt = `You are analyzing a legal consultation conversation to determine if enough information has been gathered.
Review the conversation and determine if:
1. The user has provided sufficient details about their legal matter
2. Key questions have been asked and answered
3. It's appropriate to wrap up and summarize

Respond with ONLY "YES" if the conversation should end, or "NO" if more questions are needed.`;

      const conversationText = conversationHistory
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Conversation:\n${conversationText}\n\nShould this conversation end? (YES/NO)` },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const answer = response.choices[0]?.message?.content?.trim().toUpperCase();
      return answer === 'YES';
    } catch (error) {
      console.error('OpenAI API error (should end):', error);
      // Fallback: end after 8 messages
      return conversationHistory.length >= 8;
    }
  }

  // Fallback methods when OpenAI is not available
  private getFallbackFirstQuestion(userName: string): string {
    return `Hello ${userName}! I'm here to help you with your legal question. What type of legal matter do you need assistance with today?`;
  }

  private getFallbackNextQuestion(messageCount: number): string {
    if (messageCount <= 2) {
      return "Could you provide more details about your situation? For example, when did this issue start?";
    } else if (messageCount <= 4) {
      return "Have you taken any steps to address this matter already? If so, what have you tried?";
    } else if (messageCount <= 6) {
      return "Is there anything else you'd like to add that might be relevant to your case?";
    } else {
      return "Thank you for providing all this information. Based on what you've shared, I'll prepare a summary of your situation. Is there anything else you'd like to clarify?";
    }
  }
}

export const openAIService = new OpenAIService();
