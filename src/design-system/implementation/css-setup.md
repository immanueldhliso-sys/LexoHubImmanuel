# CSS Setup & Implementation Guide

## Overview

This guide provides the complete CSS setup for implementing The Mpondo Design System, including design tokens, utility classes, and component styles.

## Design Tokens Setup

### CSS Custom Properties

Create a `tokens.css` file with all design tokens:

```css
/* tokens.css - The Mpondo Design System Tokens */

:root {
  /* ===== COLOR TOKENS ===== */
  
  /* Primary - Judicial Navy */
  --color-primary-50: #f0f4f8;
  --color-primary-100: #d9e6f2;
  --color-primary-200: #b3cde0;
  --color-primary-300: #8bb4ce;
  --color-primary-400: #5a8fb5;
  --color-primary-500: #2c5aa0;
  --color-primary-600: #1e3d6f;
  --color-primary-700: #162c52;
  --color-primary-800: #0d1a3a;
  --color-primary-900: #050d21;

  /* Secondary - Sage Green */
  --color-secondary-50: #f6f8f6;
  --color-secondary-100: #e8f0e8;
  --color-secondary-200: #d1e1d1;
  --color-secondary-300: #a8c7a8;
  --color-secondary-400: #7ba87b;
  --color-secondary-500: #588558;
  --color-secondary-600: #446644;
  --color-secondary-700: #335033;
  --color-secondary-800: #223a22;
  --color-secondary-900: #112211;

  /* Surface Colors */
  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-tertiary: #f1f5f9;
  --color-surface-hover: #f1f5f9;
  --color-surface-border: #e2e8f0;
  --color-surface-disabled: #f1f5f9;

  /* Content Colors */
  --color-content-primary: #0f172a;
  --color-content-secondary: #475569;
  --color-content-tertiary: #64748b;
  --color-content-inverse: #ffffff;
  --color-content-disabled: #94a3b8;

  /* Success Colors */
  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-200: #bbf7d0;
  --color-success-300: #86efac;
  --color-success-400: #4ade80;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-success-700: #15803d;
  --color-success-800: #166534;
  --color-success-900: #14532d;

  /* Warning Colors */
  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-200: #fde68a;
  --color-warning-300: #fcd34d;
  --color-warning-400: #fbbf24;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-warning-700: #b45309;
  --color-warning-800: #92400e;
  --color-warning-900: #78350f;

  /* Error Colors */
  --color-error-50: #fef2f2;
  --color-error-100: #fee2e2;
  --color-error-200: #fecaca;
  --color-error-300: #fca5a5;
  --color-error-400: #f87171;
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  --color-error-700: #b91c1c;
  --color-error-800: #991b1b;
  --color-error-900: #7f1d1d;

  /* ===== TYPOGRAPHY TOKENS ===== */
  
  /* Font Families */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;

  /* Font Sizes */
  --font-size-xs: 0.75rem;      /* 12px */
  --font-size-sm: 0.875rem;     /* 14px */
  --font-size-base: 1rem;       /* 16px */
  --font-size-lg: 1.125rem;     /* 18px */
  --font-size-xl: 1.25rem;      /* 20px */
  --font-size-2xl: 1.5rem;      /* 24px */
  --font-size-3xl: 1.875rem;    /* 30px */
  --font-size-4xl: 2.25rem;     /* 36px */
  --font-size-5xl: 3rem;        /* 48px */
  --font-size-6xl: 3.75rem;     /* 60px */

  /* Line Heights */
  --line-height-tight: 1.1;
  --line-height-snug: 1.2;
  --line-height-normal: 1.4;
  --line-height-relaxed: 1.5;

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Letter Spacing */
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;

  /* ===== SPACING TOKENS ===== */
  
  --spacing-0: 0px;
  --spacing-0-5: 2px;     /* 0.125rem */
  --spacing-1: 4px;       /* 0.25rem */
  --spacing-1-5: 6px;     /* 0.375rem */
  --spacing-2: 8px;       /* 0.5rem */
  --spacing-3: 12px;      /* 0.75rem */
  --spacing-4: 16px;      /* 1rem */
  --spacing-5: 20px;      /* 1.25rem */
  --spacing-6: 24px;      /* 1.5rem */
  --spacing-7: 28px;      /* 1.75rem */
  --spacing-8: 32px;      /* 2rem */
  --spacing-10: 40px;     /* 2.5rem */
  --spacing-12: 48px;     /* 3rem */
  --spacing-16: 64px;     /* 4rem */
  --spacing-20: 80px;     /* 5rem */
  --spacing-24: 96px;     /* 6rem */
  --spacing-32: 128px;    /* 8rem */

  /* ===== BORDER RADIUS TOKENS ===== */
  
  --radius-none: 0px;
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;

  /* ===== SHADOW TOKENS ===== */
  
  --shadow-none: none;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-xl: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-2xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* Colored Shadows */
  --shadow-primary-sm: 0 1px 2px 0 rgba(44, 90, 160, 0.1);
  --shadow-primary-md: 0 4px 6px -1px rgba(44, 90, 160, 0.1), 0 2px 4px -1px rgba(44, 90, 160, 0.06);
  --shadow-success-sm: 0 1px 2px 0 rgba(34, 197, 94, 0.1);
  --shadow-error-sm: 0 1px 2px 0 rgba(239, 68, 68, 0.1);

  /* ===== TRANSITION TOKENS ===== */
  
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;
  --transition-slower: 500ms;

  --easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-ease-in: cubic-bezier(0.4, 0, 1, 1);
}

/* Dark Mode Tokens */
@media (prefers-color-scheme: dark) {
  :root {
    /* Surface Colors - Dark Mode */
    --color-surface-primary: #0f172a;
    --color-surface-secondary: #1e293b;
    --color-surface-tertiary: #334155;
    --color-surface-hover: #475569;
    --color-surface-border: #64748b;
    --color-surface-disabled: #334155;

    /* Content Colors - Dark Mode */
    --color-content-primary: #f8fafc;
    --color-content-secondary: #cbd5e1;
    --color-content-tertiary: #94a3b8;
    --color-content-inverse: #0f172a;
    --color-content-disabled: #64748b;

    /* Adjust shadows for dark mode */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  }
}
```

### Dark Mode Implementation

```css
/* dark-mode.css */

/* Manual dark mode toggle support */
[data-theme="dark"] {
  --color-surface-primary: #0f172a;
  --color-surface-secondary: #1e293b;
  --color-surface-tertiary: #334155;
  --color-surface-hover: #475569;
  --color-surface-border: #64748b;
  --color-surface-disabled: #334155;

  --color-content-primary: #f8fafc;
  --color-content-secondary: #cbd5e1;
  --color-content-tertiary: #94a3b8;
  --color-content-inverse: #0f172a;
  --color-content-disabled: #64748b;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

/* Dark mode JavaScript toggle */
.js-dark-mode-toggle {
  background: var(--color-surface-tertiary);
  border: 1px solid var(--color-surface-border);
  color: var(--color-content-primary);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast) var(--easing-ease-in-out);
}

.js-dark-mode-toggle:hover {
  background: var(--color-surface-hover);
}
```

## Component Base Styles

### Typography Classes

```css
/* typography.css */

/* Display Classes */
.text-display-large {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-6xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.text-display-medium {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.text-display-small {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
}

/* Heading Classes */
.text-heading-1 {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-tight);
}

.text-heading-2 {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-tight);
}

.text-heading-3 {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-tight);
}

.text-heading-4 {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

/* Body Classes */
.text-body-large {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.text-body-medium {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.text-body-small {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-wide);
}

/* Label Classes */
.text-label-large {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-normal);
}

.text-label-medium {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-wide);
}

.text-label-small {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-relaxed);
  letter-spacing: var(--letter-spacing-wide);
}

/* Responsive Typography */
@media (max-width: 768px) {
  .text-display-large { font-size: var(--font-size-4xl); }
  .text-display-medium { font-size: var(--font-size-3xl); }
  .text-heading-1 { font-size: var(--font-size-2xl); }
}
```

### Signature Interaction Patterns

```css
/* interactions.css */

/* Pattern 1: Progressive Disclosure Cards */
.mpondo-card {
  background: var(--color-surface-primary);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal) var(--easing-ease-in-out);
  cursor: pointer;
}

.mpondo-card:hover {
  border-color: var(--color-primary-300);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.mpondo-card:focus {
  outline: none;
  ring: 2px solid var(--color-primary-500);
  ring-offset: 2px;
}

.mpondo-card-reveal {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity var(--transition-fast) var(--easing-ease-in-out),
              max-height var(--transition-normal) var(--easing-ease-in-out);
}

.mpondo-card:hover .mpondo-card-reveal {
  opacity: 1;
  max-height: none;
  transition: opacity var(--transition-normal) var(--easing-ease-in-out) 100ms,
              max-height var(--transition-slow) var(--easing-ease-in-out) 100ms;
}

/* Pattern 2: Contextual Action Buttons */
.mpondo-action-button {
  position: relative;
  overflow: hidden;
  background: var(--color-primary-600);
  color: var(--color-content-inverse);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-lg);
  border: none;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast) var(--easing-ease-out);
}

.mpondo-action-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
  opacity: 0;
  transition: opacity var(--transition-normal) var(--easing-ease-in-out);
}

.mpondo-action-button:hover {
  background: var(--color-primary-700);
  transform: scale(1.05);
}

.mpondo-action-button:hover::before {
  opacity: 1;
}

.mpondo-action-button:active {
  transform: scale(0.95);
}

.mpondo-action-button:focus {
  outline: none;
  ring: 2px solid var(--color-primary-500);
  ring-offset: 2px;
}

/* Pattern 3: Financial Data Emphasis */
.mpondo-financial-highlight {
  position: relative;
  display: inline-block;
  font-weight: var(--font-weight-semibold);
  color: var(--color-content-primary);
}

.mpondo-financial-highlight::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-success-500);
  transition: width var(--transition-slow) var(--easing-ease-out);
}

.mpondo-financial-highlight:hover::after,
.mpondo-financial-highlight:focus::after {
  width: 100%;
}

/* Loading States */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton {
  background: var(--color-surface-tertiary);
  background-image: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  background-size: 200px 100%;
  background-repeat: no-repeat;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.spinner {
  border: 2px solid var(--color-surface-border);
  border-top: 2px solid var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Risk Level Indicators */
.risk-low {
  color: var(--color-success-600);
  background: var(--color-success-50);
  border-color: var(--color-success-200);
}

.risk-medium {
  color: var(--color-warning-600);
  background: var(--color-warning-50);
  border-color: var(--color-warning-200);
}

.risk-high {
  color: var(--color-error-600);
  background: var(--color-error-50);
  border-color: var(--color-error-200);
}
```

### Utility Classes

```css
/* utilities.css */

/* Spacing Utilities */
.space-y-1 > * + * { margin-top: var(--spacing-1); }
.space-y-2 > * + * { margin-top: var(--spacing-2); }
.space-y-3 > * + * { margin-top: var(--spacing-3); }
.space-y-4 > * + * { margin-top: var(--spacing-4); }
.space-y-5 > * + * { margin-top: var(--spacing-5); }
.space-y-6 > * + * { margin-top: var(--spacing-6); }
.space-y-8 > * + * { margin-top: var(--spacing-8); }

.space-x-1 > * + * { margin-left: var(--spacing-1); }
.space-x-2 > * + * { margin-left: var(--spacing-2); }
.space-x-3 > * + * { margin-left: var(--spacing-3); }
.space-x-4 > * + * { margin-left: var(--spacing-4); }

/* Color Utilities */
.text-primary { color: var(--color-primary-500); }
.text-secondary { color: var(--color-secondary-500); }
.text-success { color: var(--color-success-500); }
.text-warning { color: var(--color-warning-500); }
.text-error { color: var(--color-error-500); }

.bg-primary { background-color: var(--color-primary-500); }
.bg-secondary { background-color: var(--color-secondary-500); }
.bg-success { background-color: var(--color-success-500); }
.bg-warning { background-color: var(--color-warning-500); }
.bg-error { background-color: var(--color-error-500); }

.border-primary { border-color: var(--color-primary-500); }
.border-secondary { border-color: var(--color-secondary-500); }
.border-success { border-color: var(--color-success-500); }
.border-warning { border-color: var(--color-warning-500); }
.border-error { border-color: var(--color-error-500); }

/* Shadow Utilities */
.shadow-none { box-shadow: var(--shadow-none); }
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }
.shadow-2xl { box-shadow: var(--shadow-2xl); }

.shadow-primary-sm { box-shadow: var(--shadow-primary-sm); }
.shadow-primary-md { box-shadow: var(--shadow-primary-md); }
.shadow-success-sm { box-shadow: var(--shadow-success-sm); }
.shadow-error-sm { box-shadow: var(--shadow-error-sm); }

/* Border Radius Utilities */
.rounded-none { border-radius: var(--radius-none); }
.rounded-sm { border-radius: var(--radius-sm); }
.rounded { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-2xl { border-radius: var(--radius-2xl); }
.rounded-full { border-radius: var(--radius-full); }

/* Transition Utilities */
.transition-fast { transition-duration: var(--transition-fast); }
.transition-normal { transition-duration: var(--transition-normal); }
.transition-slow { transition-duration: var(--transition-slow); }

.ease-in-out { transition-timing-function: var(--easing-ease-in-out); }
.ease-out { transition-timing-function: var(--easing-ease-out); }
.ease-in { transition-timing-function: var(--easing-ease-in); }
```

## Accessibility Base Styles

```css
/* accessibility.css */

/* Focus Management */
*:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  :root {
    --color-surface-border: #000000;
    --color-content-primary: #000000;
    --color-content-secondary: #000000;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .skeleton {
    animation: none;
    background: var(--color-surface-tertiary);
  }
}

/* Screen Reader Only Content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary-600);
  color: var(--color-content-inverse);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  text-decoration: none;
  z-index: 1000;
  transition: top var(--transition-fast) var(--easing-ease-out);
}

.skip-link:focus {
  top: 6px;
}
```

## Complete CSS Import Structure

```css
/* main.css - Import order is important */

/* 1. Reset and base styles */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

/* 2. Design tokens */
@import './tokens.css';
@import './dark-mode.css';

/* 3. Base styles */
@import './typography.css';
@import './interactions.css';
@import './utilities.css';
@import './accessibility.css';

/* 4. Global base styles */
html {
  font-family: var(--font-family-primary);
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  margin: 0;
  padding: 0;
  background: var(--color-surface-secondary);
  color: var(--color-content-primary);
  line-height: var(--line-height-relaxed);
}

/* 5. Component-specific styles would be imported here */
/* @import './components/dashboard-card.css'; */
/* @import './components/data-table.css'; */
/* @import './components/forms.css'; */
```

## JavaScript Integration

```javascript
// theme-toggle.js
class ThemeToggle {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupToggle();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }

  setupToggle() {
    const toggleButton = document.querySelector('.js-dark-mode-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggle());
    }
  }
}

// Initialize theme toggle
document.addEventListener('DOMContentLoaded', () => {
  new ThemeToggle();
});
```

This CSS setup provides a complete foundation for implementing The Mpondo Design System with proper token management, accessibility support, and signature interaction patterns.