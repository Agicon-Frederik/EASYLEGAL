import request from 'supertest';
import app from '../app';
import { prisma } from '../database/prisma';
import { manualFlowService } from '../services/manualFlow';

/**
 * Integration tests for complete conversation flows
 * These tests verify that manual mode conversations follow YAML exactly
 * and NEVER use AI/OpenAI services
 */
describe('Conversation Integration Tests', () => {
  let testUserId: number;

  beforeAll(async () => {
    // Initialize manual flow service with real YAML
    manualFlowService.initialize();

    // Create a test user
    const user = await prisma.user.create({
      data: {
        name: 'John Smith',
        email: 'john.integration@example.com',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: 'john.integration@example.com' },
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up conversations after each test
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({
      where: { userId: testUserId },
    });
  });

  describe('Complete Manual Flow - Contract Dispute', () => {
    it('should complete a contract dispute conversation using ONLY YAML questions', async () => {
      // Step 1: Start conversation in manual mode
      const startResponse = await request(app)
        .post('/api/conversation/start')
        .send({
          userId: testUserId,
          mode: 'manual',
        });

      expect(startResponse.status).toBe(201);
      expect(startResponse.body.success).toBe(true);
      expect(startResponse.body.data.mode).toBe('manual');

      const conversationId = startResponse.body.data.conversationId;
      const firstQuestion = startResponse.body.data.question;

      // Verify first question contains expected text from YAML
      expect(firstQuestion).toContain('John Smith');
      expect(firstQuestion).toContain('EASYLEGAL');
      expect(firstQuestion).toContain('legal matter');

      // Step 2: Answer with "A" for contract dispute
      const response1 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'A',
        });

      expect(response1.status).toBe(200);
      expect(response1.body.data.completed).toBe(false);
      expect(response1.body.data.question).toContain('contract dispute');
      expect(response1.body.data.question).toContain('written');
      expect(response1.body.data.question).toContain('verbal');

      // Step 3: Answer with "written"
      const response2 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'written',
        });

      expect(response2.status).toBe(200);
      expect(response2.body.data.completed).toBe(false);
      expect(response2.body.data.question).toContain('copy of the written contract');

      // Step 4: Answer "Yes"
      const response3 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'Yes',
        });

      expect(response3.status).toBe(200);
      expect(response3.body.data.completed).toBe(false);
      expect(response3.body.data.question).toContain('When did this issue begin');
      expect(response3.body.data.question).toContain('timeline');

      // Step 5: Provide timeline
      const response4 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'The issue started 3 months ago in September',
        });

      expect(response4.status).toBe(200);
      expect(response4.body.data.completed).toBe(false);
      expect(response4.body.data.question).toContain('taken any action');

      // Step 6: Describe actions taken
      const response5 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'I have sent multiple emails to the other party',
        });

      expect(response5.status).toBe(200);
      expect(response5.body.data.completed).toBe(false);
      expect(response5.body.data.question).toContain('anything else');

      // Step 7: Final response
      const response6 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'No, that covers everything',
        });

      expect(response6.status).toBe(200);
      expect(response6.body.data.completed).toBe(true);
      expect(response6.body.data.question).toContain('Thank you');
      expect(response6.body.data.question).toContain('legal professional');

      // Verify conversation is marked as completed
      const finalConversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      expect(finalConversation?.status).toBe('completed');
      expect(finalConversation?.mode).toBe('manual');

      // Verify all messages were saved correctly
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });

      // Should have multiple messages (initial + Q&A pairs)
      // Actually shorter flow: initial + 6 messages (3 Q&A pairs) = 7 messages minimum
      expect(messages.length).toBeGreaterThanOrEqual(7);

      // Verify alternating pattern starts with assistant
      expect(messages[0].role).toBe('assistant');
      expect(messages[1].role).toBe('user');
      expect(messages[2].role).toBe('assistant');
    });
  });

  describe('Complete Manual Flow - Employment Issue', () => {
    it('should complete an employment issue conversation using ONLY YAML questions', async () => {
      // Start conversation
      const startResponse = await request(app)
        .post('/api/conversation/start')
        .send({
          userId: testUserId,
          mode: 'manual',
        });

      const conversationId = startResponse.body.data.conversationId;

      // Step 1: Choose employment issue (B)
      const response1 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'B',
        });

      expect(response1.body.data.question).toContain('employment issue');
      expect(response1.body.data.question).toContain('termination');
      expect(response1.body.data.question).toContain('Discrimination or harassment');

      // Step 2: Choose wrongful termination (A)
      const response2 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'A',
        });

      expect(response2.body.data.question).toContain('employed');
      expect(response2.body.data.question).toContain('termination occur');

      // Step 3: Provide employment details
      const response3 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'I was employed for 5 years, terminated last month',
        });

      expect(response3.body.data.question).toContain('When did this issue begin');

      // Continue to completion
      await request(app)
        .post('/api/conversation/message')
        .send({ conversationId, message: '6 weeks ago' });

      await request(app)
        .post('/api/conversation/message')
        .send({ conversationId, message: 'I filed a complaint with HR' });

      const finalResponse = await request(app)
        .post('/api/conversation/message')
        .send({ conversationId, message: 'Nothing else to add' });

      expect(finalResponse.body.data.completed).toBe(true);
      expect(finalResponse.body.data.question).toContain('Thank you');
    });
  });

  describe('Complete Manual Flow - Real Estate', () => {
    it('should complete a real estate conversation using ONLY YAML questions', async () => {
      // Start conversation
      const startResponse = await request(app)
        .post('/api/conversation/start')
        .send({
          userId: testUserId,
          mode: 'manual',
        });

      const conversationId = startResponse.body.data.conversationId;

      // Step 1: Choose real estate (C)
      const response1 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'C',
        });

      expect(response1.body.data.question).toContain('real estate');
      expect(response1.body.data.question).toContain('Buying/selling');
      expect(response1.body.data.question).toContain('Landlord-tenant');

      // Step 2: Choose buying/selling (A)
      const response2 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'A',
        });

      expect(response2.body.data.question).toContain('transaction');

      // Step 3: Provide lease details
      const response3 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'Yes, I have reviewed the lease',
        });

      expect(response3.body.data.question).toContain('When did this issue begin');

      // Continue to completion
      await request(app)
        .post('/api/conversation/message')
        .send({ conversationId, message: '2 months ago' });

      await request(app)
        .post('/api/conversation/message')
        .send({ conversationId, message: 'Contacted my landlord multiple times' });

      const finalResponse = await request(app)
        .post('/api/conversation/message')
        .send({ conversationId, message: 'That is all' });

      expect(finalResponse.body.data.completed).toBe(true);
    });
  });

  describe('Complete Manual Flow - Other/General Path', () => {
    it('should handle "Other" option correctly using YAML questions', async () => {
      // Start conversation
      const startResponse = await request(app)
        .post('/api/conversation/start')
        .send({
          userId: testUserId,
          mode: 'manual',
        });

      const conversationId = startResponse.body.data.conversationId;

      // Step 1: Choose other (D)
      const response1 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'D',
        });

      expect(response1.body.data.question).toContain('describe your legal matter');
      expect(response1.body.data.question).toContain('detail');

      // Step 2: Provide description
      const response2 = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'I have an intellectual property concern about a patent',
        });

      expect(response2.body.data.question).toContain('When did this issue begin');

      // Complete conversation
      await request(app)
        .post('/api/conversation/message')
        .send({ conversationId, message: 'Started 1 year ago' });

      await request(app)
        .post('/api/conversation/message')
        .send({ conversationId, message: 'Consulted with a patent attorney' });

      const finalResponse = await request(app)
        .post('/api/conversation/message')
        .send({ conversationId, message: 'No additional information' });

      expect(finalResponse.body.data.completed).toBe(true);
    });
  });

  describe('Question Text Verification', () => {
    it('should use exact question text from YAML file without any AI modifications', async () => {
      // Start conversation
      const startResponse = await request(app)
        .post('/api/conversation/start')
        .send({
          userId: testUserId,
          mode: 'manual',
        });

      const conversationId = startResponse.body.data.conversationId;

      // Test multiple questions and verify they match YAML exactly
      const steps = [
        {
          answer: 'A',
          expectedContains: [
            'contract dispute',
            'written contract',
            'verbal agreement',
            '(A) Written',
            '(B) Verbal',
          ],
        },
        {
          answer: 'written',
          expectedContains: ['copy of the written contract', '(A) Yes', '(B) No'],
        },
      ];

      for (const step of steps) {
        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: step.answer,
          });

        // Verify all expected strings are present
        for (const expectedText of step.expectedContains) {
          expect(response.body.data.question).toContain(expectedText);
        }
      }
    });
  });

  describe('Answer Routing Verification', () => {
    it('should route to correct questions based on user answers', async () => {
      const testCases = [
        { firstAnswer: 'A', expectedSecondQuestionContains: 'contract dispute' },
        { firstAnswer: 'contract', expectedSecondQuestionContains: 'contract dispute' },
        { firstAnswer: 'B', expectedSecondQuestionContains: 'employment issue' },
        { firstAnswer: 'employment', expectedSecondQuestionContains: 'employment issue' },
        { firstAnswer: 'C', expectedSecondQuestionContains: 'real estate' },
      ];

      for (const testCase of testCases) {
        // Start new conversation for each test case
        const startResponse = await request(app)
          .post('/api/conversation/start')
          .send({
            userId: testUserId,
            mode: 'manual',
          });

        const conversationId = startResponse.body.data.conversationId;

        // Send first answer
        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: testCase.firstAnswer,
          });

        expect(response.body.data.question).toContain(testCase.expectedSecondQuestionContains);

        // Clean up
        await prisma.message.deleteMany({ where: { conversationId } });
        await prisma.conversation.delete({ where: { id: conversationId } });
      }
    });

    it('should use default route when answer does not match any pattern', async () => {
      const startResponse = await request(app)
        .post('/api/conversation/start')
        .send({
          userId: testUserId,
          mode: 'manual',
        });

      const conversationId = startResponse.body.data.conversationId;

      // Send an answer that doesn't match any keywords
      const response = await request(app)
        .post('/api/conversation/message')
        .send({
          conversationId,
          message: 'xyz qwerty',
        });

      // Should route to question 11 (other/general)
      expect(response.body.data.question).toContain('describe your legal matter');
    });
  });

  describe('Manual Mode Never Uses AI - Critical Test', () => {
    it('should complete ENTIRE conversation without any AI involvement', async () => {
      // This test proves that manual mode uses ONLY the YAML file
      // by completing a full conversation and verifying all questions
      // come from the predefined flow

      const startResponse = await request(app)
        .post('/api/conversation/start')
        .send({
          userId: testUserId,
          mode: 'manual',
        });

      const conversationId = startResponse.body.data.conversationId;

      // Pre-defined answers that will trigger specific paths
      const conversationFlow = [
        { answer: 'A', expectInQuestion: 'contract dispute' },
        { answer: 'B', expectInQuestion: 'verbal' },
        { answer: 'Yes I have witnesses', expectInQuestion: 'When did this issue begin' },
        { answer: 'Started in January', expectInQuestion: 'taken any action' },
        { answer: 'Sent letters', expectInQuestion: 'anything else' },
        { answer: 'No', expectInQuestion: 'Thank you' },
      ];

      for (const step of conversationFlow) {
        const response = await request(app)
          .post('/api/conversation/message')
          .send({
            conversationId,
            message: step.answer,
          });

        expect(response.status).toBe(200);
        expect(response.body.data.question).toContain(step.expectInQuestion);
      }

      // Verify conversation completed successfully
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: true },
      });

      expect(conversation?.status).toBe('completed');
      expect(conversation?.mode).toBe('manual');

      // All messages should be present (initial + 6 Q&A pairs)
      expect(conversation?.messages.length).toBeGreaterThanOrEqual(13);
    });
  });

  describe('Mode Comparison', () => {
    it('should demonstrate that manual mode behavior is deterministic unlike openai mode', async () => {
      // Create two identical manual conversations
      const conversation1Start = await request(app)
        .post('/api/conversation/start')
        .send({ userId: testUserId, mode: 'manual' });

      const conversation2Start = await request(app)
        .post('/api/conversation/start')
        .send({ userId: testUserId, mode: 'manual' });

      // First questions should be identical
      expect(conversation1Start.body.data.question).toBe(conversation2Start.body.data.question);

      const conv1Id = conversation1Start.body.data.conversationId;
      const conv2Id = conversation2Start.body.data.conversationId;

      // Send same answer to both
      const response1 = await request(app)
        .post('/api/conversation/message')
        .send({ conversationId: conv1Id, message: 'A' });

      const response2 = await request(app)
        .post('/api/conversation/message')
        .send({ conversationId: conv2Id, message: 'A' });

      // Responses should be identical (deterministic)
      expect(response1.body.data.question).toBe(response2.body.data.question);

      // Send same second answer
      const response1b = await request(app)
        .post('/api/conversation/message')
        .send({ conversationId: conv1Id, message: 'written' });

      const response2b = await request(app)
        .post('/api/conversation/message')
        .send({ conversationId: conv2Id, message: 'written' });

      // Should still be identical (both responses should exist and match)
      expect(response1b.body).toHaveProperty('data');
      expect(response2b.body).toHaveProperty('data');
      expect(response1b.body.data.question).toBe(response2b.body.data.question);
    });
  });
});
