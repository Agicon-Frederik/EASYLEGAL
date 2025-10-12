# Authentication System

This document describes the magic link authentication system implemented in the EASYLEGAL monorepo.

## Overview

The application uses **magic link authentication** with JWT tokens to restrict access to only 2 authorized users. The system supports multi-language emails and user interface in English, French, and Dutch.

## Architecture

### Components

1. **Email Service** (`packages/common/src/email/emailService.ts`)
   - Sends beautiful HTML emails with magic links
   - Supports 3 languages (en, fr, nl)
   - Uses nodemailer for email delivery

2. **JWT Utils** (`packages/common/src/auth/jwtUtils.ts`)
   - Generates magic link tokens (15-minute expiry)
   - Generates session tokens (7-day expiry)
   - Verifies and decodes tokens

3. **Database** (`packages/backend/src/database/db.ts`)
   - SQLite database storing authorized users
   - Pre-populated with 2 authorized users
   - Located at `packages/backend/data/easylegal.db`

4. **Backend Auth Routes** (`packages/backend/src/routes/auth.ts`)
   - `POST /api/auth/request-magic-link` - Request a magic link
   - `POST /api/auth/verify-token` - Verify magic link and get session token
   - `GET /api/auth/verify-session` - Verify if session is still valid

5. **Frontend Auth Pages**
   - **Login Page** (`packages/frontend/src/pages/Login.tsx`) - Email input form
   - **Verify Page** (`packages/frontend/src/pages/Verify.tsx`) - Magic link verification
   - **Protected Route** (`packages/frontend/src/components/ProtectedRoute.tsx`) - Route guard
   - **Auth Context** (`packages/frontend/src/contexts/AuthContext.tsx`) - Global auth state

## Authentication Flow

```
1. User enters email on /login page
   ↓
2. Backend checks if email is authorized in database
   ↓
3. If authorized, backend generates magic link token (15min expiry)
   ↓
4. Backend sends email with magic link to user's email
   ↓
5. User clicks magic link (redirects to /auth/verify?token=...)
   ↓
6. Backend verifies magic link token
   ↓
7. If valid, backend generates session token (7day expiry)
   ↓
8. Frontend stores session token in localStorage
   ↓
9. User is redirected to home page (/)
   ↓
10. Protected routes check for valid session token
```

## Setup Instructions

### 1. Backend Configuration

Create `packages/backend/.env` from the example:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Edit the file with your email credentials:

```env
# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173

# JWT Secret (IMPORTANT: Change this in production!)
JWT_SECRET=your-very-secure-secret-key-here

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

**Email Provider Setup:**

**Option 1: Gmail**
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated password as `EMAIL_PASS`

**Option 2: Purelymail** (or other SMTP providers)
```env
EMAIL_HOST=smtp.purelymail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@your-domain.com
EMAIL_PASS=your-smtp-password
```

**Option 3: SendGrid, Mailgun, etc.**
Check your provider's SMTP settings and update the environment variables accordingly.

### 2. Configure Authorized Users

Edit `packages/backend/src/database/db.ts` to change the authorized users.

Find the `initializeUsers` method (around line 48):

```typescript
private async initializeUsers(): Promise<void> {
  const authorizedUsers = [
    { email: 'frederik@agicon.be', name: 'Frederik' },
    { email: 'pascale@easylegal.be', name: 'Pascale' },
  ];

  for (const user of authorizedUsers) {
    await this.addUser(user.email, user.name);
  }
}
```

Replace with your actual authorized email addresses and names.

**How it works:**
- Users are automatically added when the backend starts
- The database uses `INSERT OR IGNORE`, so existing users won't be duplicated
- To reset the database completely, delete `packages/backend/data/easylegal.db` and restart
- On AWS deployments, the database is automatically seeded with users from the code

### 3. Frontend Configuration

Create `packages/frontend/.env` from the example:

```bash
cp packages/frontend/.env.example packages/frontend/.env
```

For development:
```env
VITE_API_URL=http://localhost:3000
```

For production:
```env
VITE_API_URL=https://api.easylegal.online
```

### 4. Install Dependencies

The backend requires the `dotenv` package to load environment variables:

```bash
# From the root directory
npm install
```

This will install all dependencies including dotenv which is already configured in the backend.

### 5. Build and Run

```bash
# Build all packages
npm run build

# Start backend in development (from root)
npm run dev:backend

# Start frontend in development (in another terminal, from root)
npm run dev:frontend
```

For production:
```bash
# Build all packages first
npm run build

# Start backend (from root)
cd packages/backend
npm start
```

## Security Features

1. **Email Verification**: Only pre-authorized emails can log in
2. **Token Expiry**: Magic links expire after 15 minutes
3. **Session Expiry**: Sessions expire after 7 days
4. **JWT Signing**: All tokens are signed with a secret key
5. **CORS Protection**: Backend only accepts requests from configured frontend URL
6. **Database Isolation**: SQLite database is gitignored and must be configured per environment

## Multi-Language Support

The system supports 3 languages for both emails and UI:

- **English (en)**: Default language
- **French (fr)**: Full translation
- **Dutch (nl)**: Full translation

The language is automatically detected from the user's browser settings via i18next, and emails are sent in the user's selected language.

## API Reference

### POST /api/auth/request-magic-link

Request a magic link to be sent to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "language": "en"  // Optional: "en", "fr", or "nl"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Magic link sent successfully"
}
```

**Error Responses:**

- **400 Bad Request** - Email is required
  ```json
  {
    "success": false,
    "message": "Email address is required"
  }
  ```

- **403 Forbidden** - Email not authorized
  ```json
  {
    "success": false,
    "message": "This email is not authorized to access the system"
  }
  ```

- **500 Internal Server Error** - Email failed to send
  ```json
  {
    "success": false,
    "message": "Failed to send email. Please try again."
  }
  ```

### POST /api/auth/verify-token

Verify the magic link token and receive a session token.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Token is required
- **401 Unauthorized** - Invalid or expired token
- **403 Forbidden** - User no longer authorized

### GET /api/auth/verify-session

Verify if a session token is still valid.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session is valid",
  "user": {
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**

- **401 Unauthorized** - Token missing, invalid, or expired

## Testing

To test the authentication flow:

1. **Start both backend and frontend** in development mode
2. **Configure email** settings in backend `.env`
3. **Add your email** to the authorized users list in `packages/backend/src/database/db.ts`
4. **Rebuild backend**: `npm run build:backend`
5. **Restart backend**: `cd packages/backend && npm start`
6. **Navigate to** http://localhost:5173/login
7. **Enter your email** and submit
8. **Check your email** for the magic link
9. **Click the magic link** to verify and login
10. **You should be redirected** to the home page with your name displayed

## Troubleshooting

### Email not sending

- Check your `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASS` settings
- For Gmail, ensure you're using an App Password, not your regular password
- Check the backend console for error messages

### "Email not authorized" error

- Ensure the email is added to the database in `packages/backend/src/database/db.ts`
- Rebuild the backend: `npm run build:backend`
- Delete the old database: `rm packages/backend/data/easylegal.db`
- Restart the backend to recreate the database with new users

### Magic link expired

- Magic links expire after 15 minutes for security
- Request a new magic link from the login page

### Session expired

- Sessions expire after 7 days
- Log in again to create a new session

### CORS errors

- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- For production, update to your production frontend URL

## Production Deployment

For production deployment:

1. **Change JWT_SECRET** to a strong, random secret key
2. **Update FRONTEND_URL** to your production frontend URL
3. **Configure production email** settings
4. **Use HTTPS** for both frontend and backend
5. **Set secure environment variables** (don't commit `.env` files)
6. **Back up the users.db** database file
7. **Consider rate limiting** on the `/request-magic-link` endpoint

## File Structure

```
packages/
├── common/
│   ├── src/
│   │   ├── auth/
│   │   │   └── jwtUtils.ts          # JWT token utilities
│   │   ├── email/
│   │   │   └── emailService.ts      # Email sending service
│   │   ├── types/
│   │   │   └── auth.ts              # Auth TypeScript types
│   │   └── locales/                 # Translations (en, fr, nl)
│   │       └── */common.json        # Auth translations
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   └── db.ts                # SQLite database
│   │   ├── routes/
│   │   │   └── auth.ts              # Auth API endpoints
│   │   ├── index.ts                 # Entry point with dotenv config
│   │   └── app.ts                   # Express app with auth routes
│   ├── data/
│   │   └── easylegal.db             # SQLite database file (gitignored)
│   ├── .env.example                 # Example environment variables
│   └── package.json                 # Includes dotenv dependency
└── frontend/
    ├── src/
    │   ├── contexts/
    │   │   └── AuthContext.tsx      # Auth state management
    │   ├── components/
    │   │   └── ProtectedRoute.tsx   # Route guard
    │   ├── pages/
    │   │   ├── Login.tsx            # Login page
    │   │   ├── Verify.tsx           # Magic link verification
    │   │   └── Home.tsx             # Protected home page
    │   └── App.tsx                  # Router with auth routes
    ├── .env.example                 # Example environment variables
    └── package.json
```

## License

This authentication system is part of the EASYLEGAL monorepo.
