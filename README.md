# LexoHub

A modern practice intelligence platform for legal professionals, built with React, TypeScript, and Tailwind CSS.

## Development

### Development Constitution

Before contributing to this codebase, please read and follow the [LexoHub Development Constitution](./LEXO_CONSTITUTION.md). This document contains essential guidelines for maintaining code quality, consistency, and architectural integrity.

### Key Principles

- **Consistency**: Follow established patterns and design tokens
- **Scalability**: Build reusable, composable components
- **Robustness**: Implement proper error handling and accessibility
- **Type Safety**: Leverage TypeScript for better developer experience

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Review the constitution before making changes:
   - [LEXO_CONSTITUTION.md](./LEXO_CONSTITUTION.md)

### Environment Variables

Configure a `.env` file based on `.env.example`.

- `VITE_DEMO_JUNIOR_EMAIL` and `VITE_DEMO_SENIOR_EMAIL` for demo users
- `VITE_AUTH_SIGNIN_MAX_ATTEMPTS` and `VITE_AUTH_SIGNIN_WINDOW_MS` to tune sign-in rate limiting
- `VITE_AUTH_SIGNUP_MAX_ATTEMPTS` and `VITE_AUTH_SIGNUP_WINDOW_MS` to tune sign-up rate limiting

### Authentication

- Supports standard email/password and passwordless “magic link” sign-in
- Error messages are mapped to user-friendly text for common scenarios

### Architecture Overview

- **Components**: All UI components are defined in `src/App.tsx`
- **Types**: Data models and interfaces in `src/types/index.ts`
- **Styling**: Design system tokens in `tailwind.config.js`
- **State**: React Query for server state, React hooks for local state

For detailed architectural guidelines and development standards, see the [Development Constitution](./LEXO_CONSTITUTION.md).