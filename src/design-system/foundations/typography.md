# Typography Tokens - The Mpondo Design System

## Typography Philosophy

Our typography system uses Inter as the primary typeface, chosen for its exceptional legibility in legal documents and professional interfaces. The modular scale (1.25 ratio) creates clear hierarchy while maintaining readability across all device sizes.

## Font Family

```css
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
```

## Type Scale - Modular Scale (1.25 Ratio)

### Display Headings

```css
/* Display Large - Hero sections */
--typography-display-large-font-family: var(--font-family-primary);
--typography-display-large-font-size: 3.75rem;     /* 60px */
--typography-display-large-font-weight: 600;       /* Semibold */
--typography-display-large-line-height: 1.1;       /* 66px */
--typography-display-large-letter-spacing: -0.025em;

/* Display Medium - Page headers */
--typography-display-medium-font-family: var(--font-family-primary);
--typography-display-medium-font-size: 3rem;       /* 48px */
--typography-display-medium-font-weight: 600;      /* Semibold */
--typography-display-medium-line-height: 1.1;      /* 53px */
--typography-display-medium-letter-spacing: -0.025em;

/* Display Small - Section headers */
--typography-display-small-font-family: var(--font-family-primary);
--typography-display-small-font-size: 2.25rem;     /* 36px */
--typography-display-small-font-weight: 600;       /* Semibold */
--typography-display-small-line-height: 1.2;       /* 43px */
--typography-display-small-letter-spacing: -0.025em;
```

### Headings

```css
/* Heading 1 - Main page titles */
--typography-heading-1-font-family: var(--font-family-primary);
--typography-heading-1-font-size: 1.875rem;        /* 30px */
--typography-heading-1-font-weight: 600;           /* Semibold */
--typography-heading-1-line-height: 1.2;           /* 36px */
--typography-heading-1-letter-spacing: -0.025em;

/* Heading 2 - Section titles */
--typography-heading-2-font-family: var(--font-family-primary);
--typography-heading-2-font-size: 1.5rem;          /* 24px */
--typography-heading-2-font-weight: 600;           /* Semibold */
--typography-heading-2-line-height: 1.3;           /* 31px */
--typography-heading-2-letter-spacing: -0.025em;

/* Heading 3 - Subsection titles */
--typography-heading-3-font-family: var(--font-family-primary);
--typography-heading-3-font-size: 1.25rem;         /* 20px */
--typography-heading-3-font-weight: 600;           /* Semibold */
--typography-heading-3-line-height: 1.4;           /* 28px */
--typography-heading-3-letter-spacing: -0.025em;

/* Heading 4 - Component titles */
--typography-heading-4-font-family: var(--font-family-primary);
--typography-heading-4-font-size: 1.125rem;        /* 18px */
--typography-heading-4-font-weight: 600;           /* Semibold */
--typography-heading-4-line-height: 1.4;           /* 25px */
--typography-heading-4-letter-spacing: 0;
```

### Body Text

```css
/* Body Large - Introductory text, important content */
--typography-body-large-font-family: var(--font-family-primary);
--typography-body-large-font-size: 1.125rem;       /* 18px */
--typography-body-large-font-weight: 400;          /* Normal */
--typography-body-large-line-height: 1.5;          /* 27px */
--typography-body-large-letter-spacing: 0;

/* Body Medium - Standard body text */
--typography-body-medium-font-family: var(--font-family-primary);
--typography-body-medium-font-size: 1rem;          /* 16px */
--typography-body-medium-font-weight: 400;         /* Normal */
--typography-body-medium-line-height: 1.5;         /* 24px */
--typography-body-medium-letter-spacing: 0;

/* Body Small - Secondary content, captions */
--typography-body-small-font-family: var(--font-family-primary);
--typography-body-small-font-size: 0.875rem;       /* 14px */
--typography-body-small-font-weight: 400;          /* Normal */
--typography-body-small-line-height: 1.5;          /* 21px */
--typography-body-small-letter-spacing: 0.025em;
```

### Labels & UI Text

```css
/* Label Large - Form labels, button text */
--typography-label-large-font-family: var(--font-family-primary);
--typography-label-large-font-size: 1rem;          /* 16px */
--typography-label-large-font-weight: 500;         /* Medium */
--typography-label-large-line-height: 1.5;         /* 24px */
--typography-label-large-letter-spacing: 0;

/* Label Medium - UI labels, navigation */
--typography-label-medium-font-family: var(--font-family-primary);
--typography-label-medium-font-size: 0.875rem;     /* 14px */
--typography-label-medium-font-weight: 500;        /* Medium */
--typography-label-medium-line-height: 1.5;        /* 21px */
--typography-label-medium-letter-spacing: 0.025em;

/* Label Small - Helper text, metadata */
--typography-label-small-font-family: var(--font-family-primary);
--typography-label-small-font-size: 0.75rem;       /* 12px */
--typography-label-small-font-weight: 500;         /* Medium */
--typography-label-small-line-height: 1.5;         /* 18px */
--typography-label-small-letter-spacing: 0.025em;
```

### Code & Monospace

```css
/* Code - Inline code, technical content */
--typography-code-font-family: var(--font-family-mono);
--typography-code-font-size: 0.875rem;             /* 14px */
--typography-code-font-weight: 400;                /* Normal */
--typography-code-line-height: 1.5;                /* 21px */
--typography-code-letter-spacing: 0;
```

## Tailwind CSS Classes

### Display Classes
```css
.text-display-large { /* 60px/66px, semibold, -0.025em */ }
.text-display-medium { /* 48px/53px, semibold, -0.025em */ }
.text-display-small { /* 36px/43px, semibold, -0.025em */ }
```

### Heading Classes
```css
.text-heading-1 { /* 30px/36px, semibold, -0.025em */ }
.text-heading-2 { /* 24px/31px, semibold, -0.025em */ }
.text-heading-3 { /* 20px/28px, semibold, -0.025em */ }
.text-heading-4 { /* 18px/25px, semibold */ }
```

### Body Classes
```css
.text-body-large { /* 18px/27px, normal */ }
.text-body-medium { /* 16px/24px, normal */ }
.text-body-small { /* 14px/21px, normal, 0.025em */ }
```

### Label Classes
```css
.text-label-large { /* 16px/24px, medium */ }
.text-label-medium { /* 14px/21px, medium, 0.025em */ }
.text-label-small { /* 12px/18px, medium, 0.025em */ }
```

## Usage Guidelines

### Hierarchy Rules
1. **One Display per page** - Use display sizes sparingly for maximum impact
2. **Heading progression** - Don't skip heading levels (H1 → H2 → H3)
3. **Body text consistency** - Use body-medium as default, body-large for emphasis
4. **Label specificity** - Use labels for interactive elements and metadata

### Accessibility
- Maintain proper heading hierarchy for screen readers
- Ensure sufficient color contrast (see color tokens)
- Use semantic HTML elements with typography classes
- Provide focus indicators for interactive text elements

### Responsive Behavior
```css
/* Mobile adjustments */
@media (max-width: 768px) {
  .text-display-large { font-size: 2.25rem; } /* 36px */
  .text-display-medium { font-size: 1.875rem; } /* 30px */
  .text-heading-1 { font-size: 1.5rem; } /* 24px */
}
```

### Legal Document Optimization
- **Line length**: Optimal 45-75 characters per line
- **Line height**: 150% for body text ensures comfortable reading
- **Letter spacing**: Subtle adjustments improve readability at smaller sizes
- **Font weight**: Limited to 3 weights (400, 500, 600) for consistency