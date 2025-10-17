import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface Route {
  answer_contains?: string;
  default?: boolean;
  next_question: number | string;
}

interface Question {
  id: number;
  text: string;
  routes: Route[];
}

interface FlowConfig {
  questions: Question[];
  config: {
    start_question: number;
    end_marker: string;
  };
}

class ManualFlowService {
  private flowConfig: FlowConfig | null = null;
  private initialized = false;

  /**
   * Initialize the manual flow service by loading the YAML configuration
   */
  initialize(): void {
    try {
      // Try multiple possible paths (for both ts-node and compiled)
      const possiblePaths = [
        path.join(__dirname, '../config/conversation-flow.yaml'),
        path.join(process.cwd(), 'src/config/conversation-flow.yaml'),
        path.join(process.cwd(), 'packages/backend/src/config/conversation-flow.yaml'),
      ];

      let configPath: string | null = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          configPath = testPath;
          break;
        }
      }

      if (!configPath) {
        throw new Error(`Could not find conversation-flow.yaml. Tried paths: ${possiblePaths.join(', ')}`);
      }

      console.log(`Loading manual flow config from: ${configPath}`);
      const fileContents = fs.readFileSync(configPath, 'utf8');
      this.flowConfig = yaml.load(fileContents) as FlowConfig;
      this.initialized = true;
      console.log('✓ Manual flow service initialized with', this.flowConfig.questions.length, 'questions');
    } catch (error) {
      console.error('Failed to initialize manual flow service:', error);
      throw error;
    }
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return this.initialized && this.flowConfig !== null;
  }

  /**
   * Get the first question for starting a conversation
   */
  getFirstQuestion(userName: string): { questionId: number; text: string } {
    if (!this.isReady() || !this.flowConfig) {
      throw new Error('Manual flow service not initialized');
    }

    const startQuestionId = this.flowConfig.config.start_question;
    const question = this.flowConfig.questions.find((q) => q.id === startQuestionId);

    if (!question) {
      throw new Error(`Start question ${startQuestionId} not found in configuration`);
    }

    // Replace {userName} placeholder with actual name
    const text = question.text.replace('{userName}', userName);

    return {
      questionId: question.id,
      text,
    };
  }

  /**
   * Get the next question based on the current question and user's answer
   */
  getNextQuestion(currentQuestionId: number, userAnswer: string): { questionId: number | string; text: string; isEnd: boolean } {
    if (!this.isReady() || !this.flowConfig) {
      throw new Error('Manual flow service not initialized');
    }

    const currentQuestion = this.flowConfig.questions.find((q) => q.id === currentQuestionId);

    if (!currentQuestion) {
      throw new Error(`Question ${currentQuestionId} not found in configuration`);
    }

    // Find the appropriate route based on the user's answer
    let nextQuestionId: number | string = this.flowConfig.config.end_marker;
    const normalizedAnswer = userAnswer.toLowerCase().trim();

    for (const route of currentQuestion.routes) {
      if (route.answer_contains && normalizedAnswer.includes(route.answer_contains.toLowerCase())) {
        nextQuestionId = route.next_question;
        break;
      } else if (route.default) {
        nextQuestionId = route.next_question;
      }
    }

    // Check if we've reached the end
    if (nextQuestionId === this.flowConfig.config.end_marker) {
      return {
        questionId: nextQuestionId,
        text: 'Thank you for providing all this information. Based on what you\'ve shared, I\'ll prepare a summary of your situation. A legal professional will review your case and get back to you soon.',
        isEnd: true,
      };
    }

    // Find the next question
    const nextQuestion = this.flowConfig.questions.find((q) => q.id === nextQuestionId);

    if (!nextQuestion) {
      // If question not found, end the conversation
      return {
        questionId: this.flowConfig.config.end_marker,
        text: 'Thank you for providing this information. We\'ll review your case and get back to you soon.',
        isEnd: true,
      };
    }

    return {
      questionId: nextQuestion.id,
      text: nextQuestion.text,
      isEnd: false,
    };
  }

  /**
   * Check if a specific question ID is the end marker
   */
  isEndOfFlow(questionId: number | string): boolean {
    if (!this.isReady() || !this.flowConfig) {
      return false;
    }
    return questionId === this.flowConfig.config.end_marker;
  }
}

export const manualFlowService = new ManualFlowService();
