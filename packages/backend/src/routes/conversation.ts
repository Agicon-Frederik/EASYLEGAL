import express, { Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { openAIService } from '../services/openai';
import { manualFlowService } from '../services/manualFlow';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const startConversationSchema = z.object({
  userId: z.number().int().positive(),
  mode: z.enum(['openai', 'manual']).optional().default('openai'),
});

const sendMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  message: z.string().min(1).max(5000),
});

/**
 * POST /api/conversation/start
 * Start a new conversation for a user
 * Returns the first LLM-generated question
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId, mode } = startConversationSchema.parse(req.body);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let firstQuestion: string;
    let currentQuestionId: number | null = null;

    // Generate first question based on mode
    console.log('[DEBUG] Starting conversation with mode:', mode);
    console.log('[DEBUG] User name:', user.name);

    if (mode === 'manual') {
      console.log('[DEBUG] Using MANUAL flow mode');
      const result = manualFlowService.getFirstQuestion(user.name);
      console.log('[DEBUG] Manual flow result:', JSON.stringify(result, null, 2));
      firstQuestion = result.text;
      currentQuestionId = result.questionId;
      console.log('[DEBUG] First question set to:', firstQuestion);
    } else {
      console.log('[DEBUG] Using OPENAI mode');
      firstQuestion = await openAIService.generateFirstQuestion(user.name);
      console.log('[DEBUG] OpenAI question:', firstQuestion);
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        status: 'active',
        mode,
        currentQuestionId,
      },
    });

    // Save assistant's first message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: firstQuestion,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        conversationId: conversation.id,
        question: firstQuestion,
        messageId: assistantMessage.id,
        mode,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues,
      });
    }

    console.error('Error starting conversation:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: req.t('auth.errors.serverError'),
    });
  }
});

/**
 * POST /api/conversation/message
 * Send a user response and get the next question
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { conversationId, message } = sendMessageSchema.parse(req.body);

    // Verify conversation exists and is active
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    if (conversation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Conversation is not active',
      });
    }

    // Save user's response
    await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: message,
      },
    });

    let nextQuestion: string;
    let shouldEnd: boolean;
    let newQuestionId: number | null = null;

    if (conversation.mode === 'manual') {
      // Manual flow mode
      if (!conversation.currentQuestionId) {
        return res.status(500).json({
          success: false,
          message: 'Invalid conversation state: missing current question ID',
        });
      }

      const result = manualFlowService.getNextQuestion(conversation.currentQuestionId, message);
      nextQuestion = result.text;
      shouldEnd = result.isEnd;
      newQuestionId = typeof result.questionId === 'number' ? result.questionId : null;
    } else {
      // OpenAI mode
      const messageHistory = conversation.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      shouldEnd = await openAIService.shouldEndConversation(messageHistory);
      nextQuestion = await openAIService.generateNextQuestion(messageHistory, message);
    }

    if (shouldEnd) {
      // Mark conversation as completed
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'completed' },
      });

      // Save final message
      const finalMessage = await prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: nextQuestion,
        },
      });

      return res.json({
        success: true,
        data: {
          question: nextQuestion,
          messageId: finalMessage.id,
          completed: true,
        },
      });
    }

    // Update current question ID for manual mode
    if (conversation.mode === 'manual' && newQuestionId !== null) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { currentQuestionId: newQuestionId },
      });
    }

    // Save assistant's next question
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: nextQuestion,
      },
    });

    res.json({
      success: true,
      data: {
        question: nextQuestion,
        messageId: assistantMessage.id,
        completed: false,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues,
      });
    }

    console.error('Error processing message:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: req.t('auth.errors.serverError'),
    });
  }
});

/**
 * GET /api/conversation/:id
 * Get conversation history
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);

    if (isNaN(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID',
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Error fetching conversation:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      conversationId: req.params.id,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: req.t('auth.errors.serverError'),
    });
  }
});

export default router;
