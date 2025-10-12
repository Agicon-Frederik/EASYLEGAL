# EASYLEGAL Monorepo

A full-stack application built with Express.js, React, and TypeScript.

## Project Structure

This is a monorepo managed with npm workspaces containing three packages:

- **@easylegal/backend** - Express.js REST API
- **@easylegal/frontend** - React application with Vite
- **@easylegal/common** - Shared utilities, types, and scripts

## Getting Started

### Prerequisites

- Node.js 18+
- npm 7+ (for workspace support)

### Installation

```bash
# Install all dependencies for all packages
npm install
```

### Development

```bash
# Start backend development server (port 3000)
npm run dev:backend

# Start frontend development server (port 5173)
npm run dev:frontend

# Build all packages
npm run build
```

### Testing

```bash
# Run backend tests
npm test
```

## Package Details

### Backend (@easylegal/backend)

Express.js API server with TypeScript.

- **Location**: `packages/backend/`
- **Port**: 3000 (configurable via PORT env var)
- **Tech**: Express 5.x, TypeScript, Jest

### Frontend (@easylegal/frontend)

React application built with Vite and Chakra UI.

- **Location**: `packages/frontend/`
- **Port**: 5173 (default Vite dev server)
- **Tech**: React 19, Chakra UI v3, TypeScript, Vite, ESLint
- **UI Framework**: Chakra UI v3 with MCP server support

### Common (@easylegal/common)

Shared code, utilities, scripts, and i18n configuration.

- **Location**: `packages/common/`
- **Contains**: TypeScript utilities, shared types, deployment scripts, i18n translations
- **i18n**: Centralized translation management for English, French, and Dutch

## Available Scripts

Run these from the project root:

| Script | Description |
|--------|-------------|
| `npm run dev:backend` | Start backend dev server |
| `npm run dev:frontend` | Start frontend dev server |
| `npm run build` | Build all packages |
| `npm run build:backend` | Build backend only |
| `npm run build:frontend` | Build frontend only |
| `npm run build:common` | Build common package only |
| `npm test` | Run backend tests |

## Authentication

The application uses **magic link authentication** to restrict access to 2 authorized users. See [AUTHENTICATION.md](./AUTHENTICATION.md) for complete setup instructions.

**Quick Setup:**
1. Copy `.env.example` files to `.env` in both backend and frontend packages
2. Configure email settings in `packages/backend/.env`
3. Update authorized users in `packages/backend/src/database/db.ts`
4. Rebuild and restart: `npm run build && npm run dev:backend`

## Deployment

### Deployment Options

Choose the deployment strategy that best fits your needs:

#### **Option 1: AWS Amplify + EC2 (Recommended for Production)**
- **Frontend**: Deployed to AWS Amplify (auto-deploys on git push, global CDN, free SSL)
- **Backend**: Deployed to EC2 with PM2
- **Guide**: [AWS-AMPLIFY-SETUP.md](./AWS-AMPLIFY-SETUP.md)

#### **Option 2: EC2 with Nginx Proxy Manager**
- **Frontend**: Served by Nginx Proxy Manager as static files
- **Backend**: Deployed to EC2 with PM2
- **Guide**: [NGINX-PROXY-MANAGER-SETUP.md](./NGINX-PROXY-MANAGER-SETUP.md)

#### **Option 3: EC2 with Traditional Nginx**
- **Frontend**: Served by Nginx as static files
- **Backend**: Deployed to EC2 with PM2
- **Guide**: [AWS-EC2-SETUP.md](./AWS-EC2-SETUP.md)

### Deployment Architecture

**Amplify + EC2:**
```
GitHub Push → Amplify (Frontend) + GitHub Actions (Backend) → EC2
```

**Nginx Proxy Manager:**
```
GitHub Push → GitHub Actions → EC2 → Nginx Proxy Manager serves frontend
```

## Internationalization (i18n)

The application supports three languages:
- English (en) - Default
- French (fr)
- Dutch (nl)

### Usage

**Frontend**: Use the language switcher buttons in the UI, or use the `useTranslation` hook:
```tsx
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation('common');
const text = t('messages.welcome', { appName: 'EASYLEGAL' });
i18n.changeLanguage('fr'); // Switch to French
```

**Backend**: Language is auto-detected from query params, cookies, or headers:
```bash
# Using query parameter
curl http://localhost:3000/api/welcome?lng=fr

# Using Accept-Language header
curl -H "Accept-Language: nl" http://localhost:3000/api/welcome
```

**Adding translations**: Edit files in `packages/common/src/locales/{lang}/common.json`, then rebuild:
```bash
npm run build:common
```

## Workspace Commands

To run a command in a specific package:

```bash
# Run a script in a specific workspace
npm run <script> --workspace=@easylegal/backend

# Install a dependency in a specific workspace
npm install <package> --workspace=@easylegal/frontend
```

## License

ISC
