# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EASYLEGAL is a monorepo containing a full-stack application:
- **Backend**: Express.js API built with TypeScript
- **Frontend**: React application built with Vite and TypeScript
- **Common**: Shared utilities, types, and scripts

## Monorepo Structure

```
EASYLEGAL/
├── packages/
│   ├── backend/          - Express.js backend API
│   │   ├── src/
│   │   ├── dist/         - Compiled JavaScript output
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── jest.config.js
│   ├── frontend/         - React frontend application
│   │   ├── src/
│   │   ├── dist/         - Production build output
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── common/           - Shared code and scripts
│       ├── src/
│       ├── scripts/      - Deployment and utility scripts
│       ├── package.json
│       └── tsconfig.json
├── package.json          - Root workspace configuration
└── CLAUDE.md
```

## Development Commands

### Root Level (run from project root)
- `npm install` - Install all dependencies for all packages
- `npm run dev` - Start backend development server
- `npm run dev:backend` - Start backend development server
- `npm run dev:frontend` - Start frontend development server with Vite
- `npm run build` - Build all packages
- `npm run build:backend` - Build backend only
- `npm run build:frontend` - Build frontend only
- `npm run build:common` - Build common package only
- `npm run test` - Run backend tests
- `npm run test:backend` - Run backend tests

### Backend Package Commands (in packages/backend/)
- `npm run dev` - Start development server with hot reload (nodemon + ts-node)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled production build
- `npm test` - Run tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Frontend Package Commands (in packages/frontend/)
- `npm run dev` - Start Vite development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Common Package Commands (in packages/common/)
- `npm run build` - Compile TypeScript
- `npm run dev` - Compile TypeScript in watch mode

## Backend API Endpoints

- `GET /api/health` - Health check endpoint that returns "We are alive"
- `GET /api/welcome` - Example i18n endpoint that returns a translated welcome message

## Internationalization (i18n)

The monorepo supports 3 languages: **English (en)**, **French (fr)**, and **Dutch (nl)**.

### Configuration
- i18n setup is centralized in the **@easylegal/common** package
- Translation files located in: `packages/common/src/locales/{lang}/common.json`
- Default language: English (en)
- Fallback language: English (en)

### Backend i18n
- Uses `i18next` with `i18next-http-middleware` and `i18next-fs-backend`
- Language detection via query string (`?lng=fr`), cookie, or Accept-Language header
- Access translations in routes: `req.t('key')`

### Frontend i18n
- Uses `react-i18next` with `i18next`
- Translations loaded from @easylegal/common package
- Use `useTranslation()` hook: `const { t, i18n } = useTranslation('common')`
- Language switcher included in UI

### Adding New Translations
1. Add translation keys to `packages/common/src/locales/{lang}/common.json`
2. Build common package: `npm run build:common`
3. Use translations in backend: `req.t('your.key')`
4. Use translations in frontend: `t('your.key')`

## Architecture

### Backend
- Express 5.x for HTTP server
- TypeScript for type safety
- i18next for internationalization
- Port configurable via `PORT` environment variable (defaults to 3000)
- Jest + Supertest for testing
- Application logic (`app.ts`) separated from server startup (`index.ts`)

### Frontend
- React 19 with TypeScript
- Chakra UI v3 - ALWAYS use the latest Chakra UI components from v3
- react-i18next for internationalization
- Vite for fast development and optimized builds
- ESLint for code quality
- Chakra UI MCP server installed for component assistance

### Common
- Shared TypeScript utilities and types
- i18n configuration and translation files (English, French, Dutch)
- Deployment and build scripts
- Reusable code across frontend and backend

## Workspace Management

This project uses npm workspaces. All packages are linked automatically:
- Install dependencies from the root: `npm install`
- Run scripts in specific workspaces using `--workspace` flag
- Dependencies are hoisted to the root `node_modules` when possible
