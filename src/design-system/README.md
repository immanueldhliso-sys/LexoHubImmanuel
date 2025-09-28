# Lexo Design System

A comprehensive design system for the Lexo legal practice management application, built with Tailwind CSS and documented with Storybook.

## Overview

The Lexo Design System provides a unified set of components, tokens, and patterns that ensure consistency across the application while maintaining the professional aesthetic required for legal practice management.

## Design Philosophy

### Color System
- **Primary**: Judicial Navy - Inspired by South African judicial traditions
- **Secondary**: Sage Green - Representing growth and balance
- **Accent**: Mpondo Gold - Honoring heritage and excellence
- **Semantic**: Success, Warning, Error states for clear communication

### Typography
- **Primary Font**: Inter - Clean, professional, highly legible
- **Monospace**: JetBrains Mono - For code, references, and data display

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- React 18+
- TypeScript

### Installation

The design system is already integrated into the Lexo application. To use components:

```tsx
import { Button, Card, Modal, Input } from '@/design-system/components';

function MyComponent() {
  return (
    <Card>
      <Input label="Client Name" placeholder="Enter client name" />
      <Button>Save Client</Button>
    </Card>
  );
}
```

### Development

To run Storybook for component development and documentation:

```bash
npm run storybook
```

This will start Storybook at `http://localhost:6006` where you can:
- Browse all components and their variants
- Test component interactions
- View component documentation
- Copy code examples

## Components

### Core Components

#### Button
A flexible button component with multiple variants and states.

**Variants**: `primary`, `secondary`, `outline`, `ghost`, `destructive`
**Sizes**: `sm`, `md`, `lg`
**Features**: Loading states, icon support, full-width option

```tsx
<Button variant="primary" size="md" loading>
  Save Changes
</Button>
```

#### Card
A container component for grouping related content.

**Variants**: `default`, `elevated`, `outlined`, `ghost`
**Sizes**: `sm`, `md`, `lg`
**Features**: Interactive states, hover effects, composition with sub-components

```tsx
<Card variant="elevated" hoverable>
  <CardHeader>
    <h3>Invoice #INV-001</h3>
  </CardHeader>
  <CardContent>
    <p>Amount: R 15,750.00</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

#### Modal
A flexible modal component for overlays and dialogs.

**Sizes**: `sm`, `md`, `lg`, `xl`, `full`
**Features**: Keyboard navigation, backdrop click handling, composition support

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Create Invoice">
  <ModalBody>
    <Input label="Amount" type="number" />
  </ModalBody>
  <ModalFooter>
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button>Create</Button>
  </ModalFooter>
</Modal>
```

#### Input
A comprehensive input component with validation and accessibility features.

**Variants**: `default`, `filled`, `underlined`
**Sizes**: `sm`, `md`, `lg`
**Features**: Icons, validation states, password toggle, helper text

```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  leftIcon={<Mail />}
  error="Please enter a valid email"
  required
/>
```

## Design Tokens

### Colors

The design system uses a comprehensive color palette defined in `tailwind.config.js`:

```js
// Brand Colors
'mpondo-gold': { /* 50-950 scale */ },
'judicial-blue': { /* 50-950 scale */ },

// Semantic Colors
'success': { /* 50-950 scale */ },
'warning': { /* 50-950 scale */ },
'error': { /* 50-950 scale */ },

// Neutral Palette
'neutral': { /* 50-950 scale */ }
```

### Spacing

Extended spacing scale for consistent layouts:
- `xs`: 0.125rem (2px)
- `sm`: 0.25rem (4px)
- `md`: 0.5rem (8px)
- `lg`: 1rem (16px)
- `xl`: 1.5rem (24px)
- `2xl`: 2rem (32px)
- `3xl`: 3rem (48px)

### Typography

Font families and weights:
- **Inter**: 300, 400, 500, 600, 700
- **JetBrains Mono**: 400, 500, 600

## Architecture

### File Structure

```
src/design-system/
├── components/           # React components
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   ├── Card.tsx
│   ├── Card.stories.tsx
│   ├── Modal.tsx
│   ├── Modal.stories.tsx
│   ├── Input.tsx
│   ├── Input.stories.tsx
│   └── index.ts         # Component exports
├── tokens/              # Design tokens
├── patterns/            # Component patterns
└── README.md           # This file
```

### Component Guidelines

1. **TypeScript First**: All components are built with TypeScript for type safety
2. **Accessibility**: Components follow WCAG guidelines and include proper ARIA attributes
3. **Composition**: Components support composition patterns for flexibility
4. **Consistency**: All components use the same design tokens and patterns
5. **Documentation**: Every component has comprehensive Storybook stories

### Naming Conventions

- **Components**: PascalCase (e.g., `Button`, `Modal`)
- **Props**: camelCase (e.g., `variant`, `isOpen`)
- **CSS Classes**: Tailwind utility classes
- **Files**: PascalCase for components, kebab-case for utilities

## Migration Guide

### From Legacy Components

When migrating existing components to the design system:

1. **Identify the Pattern**: Determine which design system component matches your use case
2. **Update Imports**: Replace legacy imports with design system imports
3. **Map Props**: Update prop names to match the design system API
4. **Test Thoroughly**: Ensure functionality and styling are preserved
5. **Update Documentation**: Update any component documentation

### Example Migration

**Before:**
```tsx
import { CustomButton } from './components/CustomButton';

<CustomButton type="primary" onClick={handleClick}>
  Save
</CustomButton>
```

**After:**
```tsx
import { Button } from '@/design-system/components';

<Button variant="primary" onClick={handleClick}>
  Save
</Button>
```

## Best Practices

### Component Usage

1. **Use Semantic Variants**: Choose variants that match the semantic meaning
2. **Consistent Sizing**: Use the same size scale across related components
3. **Proper Composition**: Use sub-components for complex layouts
4. **Accessibility**: Always provide proper labels and ARIA attributes

### Styling

1. **Utility First**: Use Tailwind utilities for custom styling
2. **Design Tokens**: Always use design system colors and spacing
3. **Responsive Design**: Use responsive utilities for mobile-first design
4. **Dark Mode**: Consider dark mode support in custom components

### Performance

1. **Tree Shaking**: Import only the components you need
2. **Code Splitting**: Use dynamic imports for large components
3. **Memoization**: Use React.memo for expensive components
4. **Bundle Analysis**: Monitor bundle size impact

## Contributing

### Adding New Components

1. Create the component file in `src/design-system/components/`
2. Add comprehensive TypeScript types
3. Include accessibility features
4. Create Storybook stories
5. Update the index.ts export file
6. Add documentation

### Component Checklist

- [ ] TypeScript types defined
- [ ] Accessibility attributes included
- [ ] Responsive design considered
- [ ] Storybook stories created
- [ ] Error states handled
- [ ] Loading states included (if applicable)
- [ ] Keyboard navigation supported
- [ ] Documentation updated

## Resources

- [Storybook Documentation](http://localhost:6006)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Accessibility Guidelines](https://reactjs.org/docs/accessibility.html)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For questions or issues with the design system:

1. Check the Storybook documentation
2. Review existing component examples
3. Consult the migration guide
4. Create an issue with detailed reproduction steps

---

*Built with ❤️ for the Lexo legal practice management platform*