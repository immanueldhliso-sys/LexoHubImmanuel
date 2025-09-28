# Color Tokens - The Mpondo Design System

## Color Philosophy

Our color system draws inspiration from South African judicial traditions and financial stability, creating a palette that conveys trust, authority, and professional competence.

## Primary Colors - Judicial Navy

Inspired by South African judicial robes, representing authority and trust.

```css
/* Light Mode */
--color-primary-50: #f0f4f8;   /* rgb(240, 244, 248) */
--color-primary-100: #d9e6f2;  /* rgb(217, 230, 242) */
--color-primary-200: #b3cde0;  /* rgb(179, 205, 224) */
--color-primary-300: #8bb4ce;  /* rgb(139, 180, 206) */
--color-primary-400: #5a8fb5;  /* rgb(90, 143, 181) */
--color-primary-500: #2c5aa0;  /* rgb(44, 90, 160) - Primary brand */
--color-primary-600: #1e3d6f;  /* rgb(30, 61, 111) - Hover states */
--color-primary-700: #162c52;  /* rgb(22, 44, 82) */
--color-primary-800: #0d1a3a;  /* rgb(13, 26, 58) */
--color-primary-900: #050d21;  /* rgb(5, 13, 33) */

/* Dark Mode */
--color-primary-50-dark: #050d21;
--color-primary-100-dark: #0d1a3a;
--color-primary-200-dark: #162c52;
--color-primary-300-dark: #1e3d6f;
--color-primary-400-dark: #2c5aa0;
--color-primary-500-dark: #5a8fb5;
--color-primary-600-dark: #8bb4ce;
--color-primary-700-dark: #b3cde0;
--color-primary-800-dark: #d9e6f2;
--color-primary-900-dark: #f0f4f8;
```

## Secondary Colors - Sage Green

Representing financial stability and growth.

```css
/* Light Mode */
--color-secondary-50: #f6f8f6;   /* rgb(246, 248, 246) */
--color-secondary-100: #e8f0e8;  /* rgb(232, 240, 232) */
--color-secondary-200: #d1e1d1;  /* rgb(209, 225, 209) */
--color-secondary-300: #a8c7a8;  /* rgb(168, 199, 168) */
--color-secondary-400: #7ba87b;  /* rgb(123, 168, 123) */
--color-secondary-500: #588558;  /* rgb(88, 133, 88) - Secondary brand */
--color-secondary-600: #446644;  /* rgb(68, 102, 68) */
--color-secondary-700: #335033;  /* rgb(51, 80, 51) */
--color-secondary-800: #223a22;  /* rgb(34, 58, 34) */
--color-secondary-900: #112211;  /* rgb(17, 34, 17) */
```

## Surface Colors

Neutral backgrounds and surfaces for content.

```css
/* Light Mode */
--color-surface-primary: #ffffff;     /* rgb(255, 255, 255) - Main backgrounds */
--color-surface-secondary: #f8fafc;   /* rgb(248, 250, 252) - Page backgrounds */
--color-surface-tertiary: #f1f5f9;    /* rgb(241, 245, 249) - Subtle backgrounds */
--color-surface-hover: #f1f5f9;       /* rgb(241, 245, 249) - Hover states */
--color-surface-border: #e2e8f0;      /* rgb(226, 232, 240) - Borders */
--color-surface-disabled: #f1f5f9;    /* rgb(241, 245, 249) - Disabled states */

/* Dark Mode */
--color-surface-primary-dark: #0f172a;
--color-surface-secondary-dark: #1e293b;
--color-surface-tertiary-dark: #334155;
--color-surface-hover-dark: #475569;
--color-surface-border-dark: #64748b;
--color-surface-disabled-dark: #334155;
```

## Content Colors

Text and content colors with proper contrast ratios.

```css
/* Light Mode */
--color-content-primary: #0f172a;     /* rgb(15, 23, 42) - Primary text */
--color-content-secondary: #475569;   /* rgb(71, 85, 105) - Secondary text */
--color-content-tertiary: #64748b;    /* rgb(100, 116, 139) - Tertiary text */
--color-content-inverse: #ffffff;     /* rgb(255, 255, 255) - Text on dark */
--color-content-disabled: #94a3b8;    /* rgb(148, 163, 184) - Disabled text */

/* Dark Mode */
--color-content-primary-dark: #f8fafc;
--color-content-secondary-dark: #cbd5e1;
--color-content-tertiary-dark: #94a3b8;
--color-content-inverse-dark: #0f172a;
--color-content-disabled-dark: #64748b;
```

## Semantic Colors

### Success - Financial Positive

```css
--color-success-50: #f0fdf4;   /* rgb(240, 253, 244) */
--color-success-100: #dcfce7;  /* rgb(220, 252, 231) */
--color-success-200: #bbf7d0;  /* rgb(187, 247, 208) */
--color-success-300: #86efac;  /* rgb(134, 239, 172) */
--color-success-400: #4ade80;  /* rgb(74, 222, 128) */
--color-success-500: #22c55e;  /* rgb(34, 197, 94) - Success primary */
--color-success-600: #16a34a;  /* rgb(22, 163, 74) */
--color-success-700: #15803d;  /* rgb(21, 128, 61) */
--color-success-800: #166534;  /* rgb(22, 101, 52) */
--color-success-900: #14532d;  /* rgb(20, 83, 45) */
```

### Warning - Attention Required

```css
--color-warning-50: #fffbeb;   /* rgb(255, 251, 235) */
--color-warning-100: #fef3c7;  /* rgb(254, 243, 199) */
--color-warning-200: #fde68a;  /* rgb(253, 230, 138) */
--color-warning-300: #fcd34d;  /* rgb(252, 211, 77) */
--color-warning-400: #fbbf24;  /* rgb(251, 191, 36) */
--color-warning-500: #f59e0b;  /* rgb(245, 158, 11) - Warning primary */
--color-warning-600: #d97706;  /* rgb(217, 119, 6) */
--color-warning-700: #b45309;  /* rgb(180, 83, 9) */
--color-warning-800: #92400e;  /* rgb(146, 64, 14) */
--color-warning-900: #78350f;  /* rgb(120, 53, 15) */
```

### Error - Critical Issues

```css
--color-error-50: #fef2f2;     /* rgb(254, 242, 242) */
--color-error-100: #fee2e2;    /* rgb(254, 226, 226) */
--color-error-200: #fecaca;    /* rgb(254, 202, 202) */
--color-error-300: #fca5a5;    /* rgb(252, 165, 165) */
--color-error-400: #f87171;    /* rgb(248, 113, 113) */
--color-error-500: #ef4444;    /* rgb(239, 68, 68) - Error primary */
--color-error-600: #dc2626;    /* rgb(220, 38, 38) */
--color-error-700: #b91c1c;    /* rgb(185, 28, 28) */
--color-error-800: #991b1b;    /* rgb(153, 27, 27) */
--color-error-900: #7f1d1d;    /* rgb(127, 29, 29) */
```

## Usage Guidelines

### Primary Usage
- Use `primary-500` for main brand elements, primary buttons, and key actions
- Use `primary-600` for hover states and emphasis
- Use `primary-50-100` for subtle backgrounds and highlights

### Semantic Usage
- **Success**: Positive financial indicators, completed actions, confirmations
- **Warning**: Overdue items, attention needed, caution states
- **Error**: Critical issues, validation errors, system problems

### Accessibility
All color combinations meet WCAG 2.1 AA contrast requirements:
- Normal text: 4.5:1 minimum contrast ratio
- Large text: 3:1 minimum contrast ratio
- UI components: 3:1 minimum contrast ratio

### Dark Mode
Dark mode tokens are provided with `-dark` suffix. Implement using CSS custom properties and `prefers-color-scheme` media query.