# Chatbot Testing Documentation

This document describes the comprehensive test suite for the EASYLEGAL chatbot functionality.

## Overview

The chatbot supports two interaction modes:
1. **Manual Mode**: Uses predefined questions from a YAML configuration file
2. **OpenAI Mode**: Uses AI to generate dynamic questions based on context

## Critical Requirement: Manual Mode NEVER Uses AI

**The most important aspect of these tests is to verify that manual mode NEVER uses AI services.** All questions in manual mode must come directly from the YAML configuration file (`packages/backend/src/config/conversation-flow.yaml`) without any dynamic generation.

## Test Files

### 1. `manualFlow.test.ts` - Manual Flow Service Tests
**Location**: `packages/backend/src/services/manualFlow.test.ts`

Tests the core manual flow service that reads and processes the YAML configuration.

#### Key Test Categories:

- **Initialization Tests**
  - Verifies YAML file is loaded correctly
  - Checks service initialization

- **First Question Tests**
  - Ensures first question comes from YAML
  - Verifies `{userName}` placeholder replacement
  - Confirms NO AI generation

- **Routing Tests**
  - Tests all conversation paths (Contract, Employment, Real Estate, Other)
  - Verifies answer matching (case-insensitive, trimmed)
  - Confirms routing follows YAML exactly

- **YAML Compliance Tests** (CRITICAL)
  - Verifies ALL questions come from YAML file
  - Confirms exact text matching (no AI modifications)
  - Tests that manual flow NEVER generates dynamic questions

- **Full Conversation Flow Tests**
  - Complete end-to-end flows for each path
  - Verifies conversation completion
  - Ensures deterministic behavior (same inputs = same outputs)

**Run with**:
```bash
cd packages/backend
npm test -- manualFlow.test.ts
```

### 2. `conversation.test.ts` - API Route Tests
**Location**: `packages/backend/src/routes/conversation.test.ts`

Tests the HTTP API endpoints with mocked services.

#### Key Test Categories:

- **POST /api/conversation/start**
  - Tests both manual and openai modes
  - Verifies correct service is called based on mode
  - CRITICAL: Confirms OpenAI is NEVER called in manual mode
  - Tests validation (invalid users, missing params)

- **POST /api/conversation/message**
  - Tests message processing in both modes
  - Verifies database persistence
  - CRITICAL: Confirms OpenAI is NEVER called in manual mode
  - Tests conversation completion
  - Tests validation (invalid IDs, inactive conversations)

- **GET /api/conversation/:id**
  - Tests conversation retrieval
  - Verifies message order
  - Tests error handling

- **Mode Isolation Tests** (CRITICAL)
  - Proves strict separation between manual and openai modes
  - Verifies no cross-contamination

**Run with**:
```bash
cd packages/backend
npm test -- conversation.test.ts
```

### 3. `conversation.integration.test.ts` - Integration Tests
**Location**: `packages/backend/src/routes/conversation.integration.test.ts`

End-to-end integration tests without mocks, using real YAML configuration.

#### Key Test Categories:

- **Complete Flow Tests**
  - Full contract dispute flow
  - Full employment issue flow
  - Full real estate flow
  - Full "other" category flow

- **Question Text Verification**
  - Confirms questions match YAML exactly
  - No modifications or AI generation

- **Answer Routing Verification**
  - Tests all routing paths
  - Verifies default routes

- **Manual Mode Never Uses AI** (MOST CRITICAL TEST)
  - Completes entire conversation
  - Verifies all questions from YAML
  - Proves deterministic behavior

**Run with**:
```bash
cd packages/backend
npm test -- conversation.integration.test.ts
```

## Running All Tests

To run all chatbot-related tests:

```bash
cd packages/backend
npm test
```

To run specific test file:
```bash
npm test -- <filename>
```

To run tests in watch mode:
```bash
npm run test:watch
```

To generate coverage report:
```bash
npm run test:coverage
```

## Test Coverage

The test suite covers:
- ✅ Manual flow service (YAML loading and processing)
- ✅ Conversation API routes (all endpoints)
- ✅ Both interaction modes (manual and openai)
- ✅ All conversation paths from YAML
- ✅ Error handling and validation
- ✅ Database persistence
- ✅ Mode isolation and separation

### Critical Test Scenarios

The following scenarios are EXTENSIVELY tested:

1. **Manual mode NEVER calls OpenAI** - Verified at multiple levels:
   - Service tests with mocks
   - API route tests with mocks
   - Integration tests without mocks

2. **YAML compliance** - All questions must:
   - Come from YAML file
   - Match exact text
   - Follow defined routing
   - Never be dynamically generated

3. **Deterministic behavior** - Manual mode must:
   - Produce identical outputs for identical inputs
   - Be completely predictable
   - Not depend on external AI services

## YAML Configuration

The conversation flow is defined in:
`packages/backend/src/config/conversation-flow.yaml`

### Structure:
- 14 predefined questions
- Conditional routing based on user answers
- 4 main paths: Contract, Employment, Real Estate, Other
- All paths converge to final questions (12, 13, 14)
- Ends with "END" marker

### Key Features:
- `answer_contains`: Substring matching (case-insensitive)
- `default`: Fallback route when no pattern matches
- `{userName}`: Placeholder replaced with actual user name
- Questions IDs: 1-14 + "END"

## Test Data

- **Test User**: Created in `beforeAll` hooks
- **Test Conversations**: Created and cleaned up in each test
- **Mock Responses**: Predefined for service tests

## Assertions

### Manual Mode Tests Must Verify:

1. ✅ No calls to `openAIService.generateFirstQuestion()`
2. ✅ No calls to `openAIService.generateNextQuestion()`
3. ✅ No calls to `openAIService.shouldEndConversation()`
4. ✅ All calls go to `manualFlowService.getFirstQuestion()`
5. ✅ All calls go to `manualFlowService.getNextQuestion()`
6. ✅ Question text matches YAML exactly
7. ✅ Routing follows YAML configuration
8. ✅ Conversation is deterministic

## Common Issues

### Issue: Test fails with "OpenAI called in manual mode"
**Solution**: Check that mode is set to 'manual' and service is properly mocked

### Issue: Question text doesn't match
**Solution**: Verify YAML file hasn't changed, check for whitespace differences

### Issue: Routing goes to wrong question
**Solution**: Check answer_contains order in YAML (first match wins)

## Future Enhancements

Consider adding:
- Frontend component tests for Chatbot.tsx
- E2E tests with Playwright/Cypress
- Performance tests for conversation handling
- Load tests for concurrent conversations
- Security tests for input validation
- Accessibility tests for chat interface

## Conclusion

This test suite provides comprehensive coverage of the chatbot functionality with special emphasis on ensuring manual mode operates independently of AI services. The tests verify that the predefined YAML conversation flow is followed exactly without any dynamic question generation.
