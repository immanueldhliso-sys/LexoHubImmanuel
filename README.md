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

### Architecture Overview

- **Components**: All UI components are defined in `src/App.tsx`
- **Types**: Data models and interfaces in `src/types/index.ts`
- **Styling**: Design system tokens in `tailwind.config.js`
- **State**: React Query for server state, React hooks for local state

For detailed architectural guidelines and development standards, see the [Development Constitution](./LEXO_CONSTITUTION.md).