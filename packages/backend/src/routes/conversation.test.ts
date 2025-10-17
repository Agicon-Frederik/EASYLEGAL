import request from 'supertest';
import app from '../app';
import { prisma } from '../database/prisma';
import { manualFlowService } from '../services/manualFlow';
import { openAIService } from '../services/openai';

// Mock the services
jest.mock('../services/openai');
jest.mock('../services/manualFlow');

describe('Conversation API Routes', () => {
  let testUserId: number;

  beforeAll(async () => {
    // Initialize manual flow service
    manualFlowService.initialize();

    // Create a test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' },
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up conversations and messages after each test
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({
      where: { userId: testUserId },
    });
    jest.clearAllMocks();
  });

  describe('POST /api/conversation/start', () => {
    describe('Manual Mode', () => {
      it('should start a conversation in manual mode', async () => {
        const mockQuestion = {
          questionId: 1,
          text: 'Hello Test User! Welcome to EASYLEGAL. What type of legal matter do you need help with today?',
        };

        (manualFlowService.getFirstQuestion as jest.Mock).mockReturnValue(mockQuestion);

        const response = await request(app)
          .post('/api/conversation/start')
          .send({
            userId: testUserId,
            mode: 'manual',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('conversationId');
        expect(response.body.data).toHaveProperty('question');
        expect(response.body.data).toHaveProperty('messageId');
        expect(response.body.data.mode).toBe('manual');
        expect(response.body.data.question).toBe(mockQuestion.text);

        // Verify conversation was created in database
        const conversation = await prisma.conversation.findUnique({
          where: { id: response.body.data.conversationId },
        });

        expect(conversation).not.toBeNull();
        expect(conversation?.mode).toBe('manual');
        expect(conversation?.currentQuestionId).toBe(1);
        expect(conversation?.status).toBe('active');

        // Verify manualFlowService was called, NOT openAIService
        expect(manualFlowService.getFirstQuestion).toHaveBeenCalledWith('Test User');
        expect(openAIService.generateFirstQuestion).not.toHaveBeenCalled();
      });

      it('should NEVER call OpenAI service in manual mode', async () => {
        const mockQuestion = {
          questionId: 1,
          text: 'Test question',
        };

        (manualFlowService.getFirstQuestion as jest.Mock).mockReturnValue(mockQuestion);

        await request(app)
          .post('/api/conversation/start')
          .send({
            userId: testUserId,
            mode: 'manual',
          });

        // CRITICAL: Verify OpenAI is NEVER called in manual mode
        expect(openAIService.generateFirstQuestion).not.toHaveBeenCalled();
        expect(openAIService.generateNextQuestion).not.toHaveBeenCalled();
        expect(openAIService.shouldEndConversation).not.toHaveBeenCalled();
      });

      it('should store currentQuestionId for manual mode', async () => {
        const mockQuestion = {
          questionId: 1,
          text: 'First question',
        };

        (manualFlowService.getFirstQuestion as jest.Mock).mockReturnValue(mockQuestion);

        const response = await request(app)
          .post('/api/conversation/start')
          .send({
            userId: testUserId,
            mode: 'manual',
          });

        const conversation = await prisma.conversation.findUnique({
          where: { id: response.body.data.conversationId },
        });

        expect(conversation?.currentQuestionId).toBe(1);
      });
    });

    describe('OpenAI Mode', () => {
      it('should start a conversation in openai mode', async () => {
        const mockQuestion = 'Hello! How can I help you with your legal matter?';
        (openAIService.generateFirstQuestion as jest.Mock).mockResolvedValue(mockQuestion);

        const response = await request(app)
          .post('/api/conversation/start')
          .send({
            userId: testUserId,
            mode: 'openai',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.mode).toBe('openai');
        expect(response.body.data.question).toBe(mockQuestion);

        // Verify conversation was created in database
        const conversation = await prisma.conversation.findUnique({
          where: { id: response.body.data.conversationId },
        });

        expect(conversation).not.toBeNull();
        expect(conversation?.mode).toBe('openai');
        expect(conversation?.currentQuestionId).toBeNull();

        // Verify openAIService was called
        expect(openAIService.generateFirstQuestion).toHaveBeenCalledWith('Test User');
        expect(manualFlowService.getFirstQuestion).not.toHaveBeenCalled();
      });

      it('should default to openai mode if mode not specified', async () => {
        const mockQuestion = 'AI generated question';
        (openAIService.generateFirstQuestion as jest.Mock).mockResolvedValue(mockQuestion);

        const response = await request(app)
          .post('/api/conversation/start')
          .send({
            userId: testUserId,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.mode).toBe('openai');
        expect(openAIService.generateFirstQuestion).toHaveBeenCalled();
      });
    });

    describe('Validation', () => {
      it('should return 404 if user does not exist', async () => {
        const response = await request(app)
          .post('/api/conversation/start')
          .send({
            userId: 99999,
            mode: 'manual',
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('User not found');
      });

      it('should return 400 for invalid userId', async () => {
        const response = await request(app)
          .post('/api/conversation/start')
          .send({
            userId: 'invalid',
            mode: 'manual',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 for invalid mode', async () => {
        const response = await request(app)
          .post('/api/conversation/start')
          .send({
            userId: testUserId,
            mode: 'invalid-mode',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 if userId is missing', async () => {
        const response = await request(app)
          .post('/api/conversation/start')
          .send({
            mode: 'manual',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('POST /api/conversation/message', () => {
    let conversationId: number;

    beforeEach(async () => {
      // Create a test conversation
      const conversation = await prisma.conversation.create({
        data: {
          userId: testUserId,
          status: 'active',
          mode: 'manual',
          currentQuestionId: 1,
        },
      });
      conversationId = conversation.id;

      // Create initial assistant message
      await prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: 'First question',
        },
      });
    });

    describe('Manual Mode', () => {
      it('should process user message and return next question in manual mode', async () => {
        const mockNextQuestion = {
          questionId: 2,
          text: 'Next question about contract',
          isEnd: false,
        };

        (manualFlowService.getNextQuestion as jest.Mock).mockReturnValue(mockNextQuestion);

        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: 'A',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.question).toBe(mockNextQuestion.text);
        expect(response.body.data.completed).toBe(false);

        // Verify messages were saved
        const messages = await prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'asc' },
        });

        expect(messages.length).toBe(3); // Initial + user + assistant
        expect(messages[1].role).toBe('user');
        expect(messages[1].content).toBe('A');
        expect(messages[2].role).toBe('assistant');
        expect(messages[2].content).toBe(mockNextQuestion.text);

        // Verify manualFlowService was called with correct parameters
        expect(manualFlowService.getNextQuestion).toHaveBeenCalledWith(1, 'A');

        // CRITICAL: Verify OpenAI is NEVER called in manual mode
        expect(openAIService.generateNextQuestion).not.toHaveBeenCalled();
        expect(openAIService.shouldEndConversation).not.toHaveBeenCalled();
      });

      it('should update currentQuestionId after each message in manual mode', async () => {
        const mockNextQuestion = {
          questionId: 5,
          text: 'Employment question',
          isEnd: false,
        };

        (manualFlowService.getNextQuestion as jest.Mock).mockReturnValue(mockNextQuestion);

        await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: 'B',
          });

        const updatedConversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        expect(updatedConversation?.currentQuestionId).toBe(5);
      });

      it('should mark conversation as completed when reaching end in manual mode', async () => {
        const mockEndQuestion = {
          questionId: 'END',
          text: 'Thank you for providing all this information.',
          isEnd: true,
        };

        (manualFlowService.getNextQuestion as jest.Mock).mockReturnValue(mockEndQuestion);

        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: 'Nothing else',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.completed).toBe(true);

        const updatedConversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        expect(updatedConversation?.status).toBe('completed');
      });

      it('should NEVER call OpenAI during entire manual conversation flow', async () => {
        // Simulate multiple messages in manual mode
        const questions = [
          { questionId: 2, text: 'Q2', isEnd: false },
          { questionId: 3, text: 'Q3', isEnd: false },
          { questionId: 12, text: 'Q12', isEnd: false },
          { questionId: 13, text: 'Q13', isEnd: false },
          { questionId: 14, text: 'Q14', isEnd: false },
          { questionId: 'END', text: 'Thank you', isEnd: true },
        ];

        for (let i = 0; i < questions.length; i++) {
          (manualFlowService.getNextQuestion as jest.Mock).mockReturnValue(questions[i]);

          await request(app)
            .post('/api/conversation/message')
            .send({
              conversationId,
              message: `Answer ${i + 1}`,
            });

          // Update conversation for next iteration
          if (!questions[i].isEnd) {
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { currentQuestionId: questions[i].questionId as number },
            });
          }
        }

        // CRITICAL: After entire conversation, OpenAI should NEVER be called
        expect(openAIService.generateNextQuestion).not.toHaveBeenCalled();
        expect(openAIService.shouldEndConversation).not.toHaveBeenCalled();
        expect(openAIService.generateFirstQuestion).not.toHaveBeenCalled();
      });
    });

    describe('OpenAI Mode', () => {
      beforeEach(async () => {
        // Update conversation to openai mode
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            mode: 'openai',
            currentQuestionId: null,
          },
        });
      });

      it('should process user message using OpenAI in openai mode', async () => {
        const mockNextQuestion = 'AI generated follow-up question';
        (openAIService.shouldEndConversation as jest.Mock).mockResolvedValue(false);
        (openAIService.generateNextQuestion as jest.Mock).mockResolvedValue(mockNextQuestion);

        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: 'I have a contract issue',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.question).toBe(mockNextQuestion);
        expect(response.body.data.completed).toBe(false);

        // Verify OpenAI service was called
        expect(openAIService.shouldEndConversation).toHaveBeenCalled();
        expect(openAIService.generateNextQuestion).toHaveBeenCalled();

        // Verify manual flow service was NOT called
        expect(manualFlowService.getNextQuestion).not.toHaveBeenCalled();
      });

      it('should end conversation when OpenAI determines it should end', async () => {
        const mockFinalQuestion = 'Thank you. I have all the information I need.';
        (openAIService.shouldEndConversation as jest.Mock).mockResolvedValue(true);
        (openAIService.generateNextQuestion as jest.Mock).mockResolvedValue(mockFinalQuestion);

        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: 'That is all',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.completed).toBe(true);

        const updatedConversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        expect(updatedConversation?.status).toBe('completed');
      });
    });

    describe('Validation', () => {
      it('should return 404 if conversation does not exist', async () => {
        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId: 99999,
            message: 'Test message',
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Conversation not found');
      });

      it('should return 400 if conversation is not active', async () => {
        // Mark conversation as completed
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'completed' },
        });

        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: 'Test message',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Conversation is not active');
      });

      it('should return 400 for invalid conversationId', async () => {
        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId: 'invalid',
            message: 'Test message',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 if message is empty', async () => {
        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: '',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should return 400 if message is too long', async () => {
        const longMessage = 'a'.repeat(5001);

        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: longMessage,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/conversation/:id', () => {
    let conversationId: number;

    beforeEach(async () => {
      // Create a test conversation with messages
      const conversation = await prisma.conversation.create({
        data: {
          userId: testUserId,
          status: 'active',
          mode: 'manual',
          currentQuestionId: 1,
        },
      });
      conversationId = conversation.id;

      // Create some messages
      await prisma.message.createMany({
        data: [
          {
            conversationId,
            role: 'assistant',
            content: 'First question',
          },
          {
            conversationId,
            role: 'user',
            content: 'My answer',
          },
          {
            conversationId,
            role: 'assistant',
            content: 'Second question',
          },
        ],
      });
    });

    it('should retrieve conversation with messages', async () => {
      const response = await request(app).get(`/api/conversation/${conversationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', conversationId);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.messages).toHaveLength(3);
      expect(response.body.data.mode).toBe('manual');
    });

    it('should return messages in chronological order', async () => {
      const response = await request(app).get(`/api/conversation/${conversationId}`);

      const messages = response.body.data.messages;
      expect(messages[0].role).toBe('assistant');
      expect(messages[0].content).toBe('First question');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('My answer');
      expect(messages[2].role).toBe('assistant');
      expect(messages[2].content).toBe('Second question');
    });

    it('should return 404 if conversation does not exist', async () => {
      const response = await request(app).get('/api/conversation/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Conversation not found');
    });

    it('should return 400 for invalid conversation ID', async () => {
      const response = await request(app).get('/api/conversation/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid conversation ID');
    });
  });

  describe('Mode Isolation Tests', () => {
    it('should maintain strict separation between manual and openai modes', async () => {
      // Start manual conversation
      const mockManualQuestion = { questionId: 1, text: 'Manual question' };
      (manualFlowService.getFirstQuestion as jest.Mock).mockReturnValue(mockManualQuestion);

      const manualResponse = await request(app)
        .post('/api/conversation/start')
        .send({ userId: testUserId, mode: 'manual' });

      const manualConvId = manualResponse.body.data.conversationId;

      // Start openai conversation
      const mockOpenAIQuestion = 'OpenAI question';
      (openAIService.generateFirstQuestion as jest.Mock).mockResolvedValue(mockOpenAIQuestion);

      const openaiResponse = await request(app)
        .post('/api/conversation/start')
        .send({ userId: testUserId, mode: 'openai' });

      const openaiConvId = openaiResponse.body.data.conversationId;

      // Verify modes are correctly set
      const manualConv = await prisma.conversation.findUnique({ where: { id: manualConvId } });
      const openaiConv = await prisma.conversation.findUnique({ where: { id: openaiConvId } });

      expect(manualConv?.mode).toBe('manual');
      expect(manualConv?.currentQuestionId).not.toBeNull();
      expect(openaiConv?.mode).toBe('openai');
      expect(openaiConv?.currentQuestionId).toBeNull();

      // Verify correct services were called
      expect(manualFlowService.getFirstQuestion).toHaveBeenCalled();
      expect(openAIService.generateFirstQuestion).toHaveBeenCalled();
    });
  });
});
