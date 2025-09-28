# Spacing Scale - The Mpondo Design System

## Spacing Philosophy

Our spacing system is built on an 8px grid, providing consistent rhythm and alignment throughout the interface. This creates visual harmony and makes the design feel structured and professional.

## Base Unit

```css
--spacing-base: 8px; /* Base unit for all spacing calculations */
```

## Spacing Scale

### Micro Spacing (0-8px)
```css
--spacing-0: 0px;        /* No spacing */
--spacing-0-5: 2px;      /* 0.125rem - Micro adjustments */
--spacing-1: 4px;        /* 0.25rem - Minimal spacing */
--spacing-1-5: 6px;      /* 0.375rem - Fine adjustments */
--spacing-2: 8px;        /* 0.5rem - Base unit */
```

### Small Spacing (8-24px)
```css
--spacing-3: 12px;       /* 0.75rem - Small gaps */
--spacing-4: 16px;       /* 1rem - Standard spacing */
--spacing-5: 20px;       /* 1.25rem - Comfortable spacing */
--spacing-6: 24px;       /* 1.5rem - Section spacing */
```

### Medium Spacing (24-48px)
```css
--spacing-7: 28px;       /* 1.75rem - Component spacing */
--spacing-8: 32px;       /* 2rem - Large component spacing */
--spacing-10: 40px;      /* 2.5rem - Section breaks */
--spacing-12: 48px;      /* 3rem - Major section spacing */
```

### Large Spacing (48px+)
```css
--spacing-16: 64px;      /* 4rem - Page section spacing */
--spacing-20: 80px;      /* 5rem - Major layout spacing */
--spacing-24: 96px;      /* 6rem - Hero section spacing */
--spacing-32: 128px;     /* 8rem - Maximum spacing */
```

## Tailwind CSS Classes

### Padding Classes
```css
.p-0     { padding: 0px; }
.p-0.5   { padding: 2px; }
.p-1     { padding: 4px; }
.p-1.5   { padding: 6px; }
.p-2     { padding: 8px; }
.p-3     { padding: 12px; }
.p-4     { padding: 16px; }
.p-5     { padding: 20px; }
.p-6     { padding: 24px; }
.p-8     { padding: 32px; }
.p-10    { padding: 40px; }
.p-12    { padding: 48px; }
.p-16    { padding: 64px; }
.p-20    { padding: 80px; }
.p-24    { padding: 96px; }
```

### Margin Classes
```css
.m-0     { margin: 0px; }
.m-0.5   { margin: 2px; }
.m-1     { margin: 4px; }
.m-1.5   { margin: 6px; }
.m-2     { margin: 8px; }
.m-3     { margin: 12px; }
.m-4     { margin: 16px; }
.m-5     { margin: 20px; }
.m-6     { margin: 24px; }
.m-8     { margin: 32px; }
.m-10    { margin: 40px; }
.m-12    { margin: 48px; }
.m-16    { margin: 64px; }
.m-20    { margin: 80px; }
.m-24    { margin: 96px; }
```

### Gap Classes (for Flexbox/Grid)
```css
.gap-0   { gap: 0px; }
.gap-1   { gap: 4px; }
.gap-2   { gap: 8px; }
.gap-3   { gap: 12px; }
.gap-4   { gap: 16px; }
.gap-6   { gap: 24px; }
.gap-8   { gap: 32px; }
.gap-12  { gap: 48px; }
```

## Usage Guidelines

### Component Internal Spacing
- **Buttons**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Cards**: `p-6` (24px all around)
- **Form inputs**: `px-3 py-2` (12px horizontal, 8px vertical)
- **Modal content**: `p-6` or `p-8` (24px or 32px)

### Layout Spacing
- **Between components**: `space-y-4` or `space-y-6` (16px or 24px)
- **Section breaks**: `mb-8` or `mb-12` (32px or 48px)
- **Page margins**: `px-6` on mobile, `px-8` on desktop
- **Container max-width**: Use with appropriate padding

### Grid Layouts
```css
/* Dashboard grid with consistent gaps */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px; /* --spacing-6 */
}

/* Form layout with proper spacing */
.form-layout {
  display: flex;
  flex-direction: column;
  gap: 16px; /* --spacing-4 */
}
```

## Responsive Spacing

### Mobile (< 768px)
```css
/* Reduce spacing on mobile for better space utilization */
@media (max-width: 767px) {
  .responsive-spacing {
    --spacing-section: var(--spacing-4); /* 16px instead of 24px */
    --spacing-component: var(--spacing-3); /* 12px instead of 16px */
  }
}
```

### Desktop (≥ 768px)
```css
/* Standard spacing on desktop */
@media (min-width: 768px) {
  .responsive-spacing {
    --spacing-section: var(--spacing-6); /* 24px */
    --spacing-component: var(--spacing-4); /* 16px */
  }
}
```

## Common Spacing Patterns

### Card Layouts
```css
.mpondo-card {
  padding: var(--spacing-6); /* 24px */
  margin-bottom: var(--spacing-4); /* 16px */
  border-radius: var(--radius-lg);
}

.mpondo-card-header {
  margin-bottom: var(--spacing-4); /* 16px */
}

.mpondo-card-content > * + * {
  margin-top: var(--spacing-3); /* 12px between elements */
}
```

### Form Layouts
```css
.mpondo-form-group {
  margin-bottom: var(--spacing-5); /* 20px */
}

.mpondo-form-label {
  margin-bottom: var(--spacing-2); /* 8px */
}

.mpondo-form-help {
  margin-top: var(--spacing-1); /* 4px */
}
```

### Navigation Spacing
```css
.mpondo-nav-item {
  padding: var(--spacing-3) var(--spacing-4); /* 12px vertical, 16px horizontal */
}

.mpondo-nav-section {
  margin-bottom: var(--spacing-6); /* 24px */
}
```

## Accessibility Considerations

### Touch Targets
- Minimum 44px (--spacing-11) for touch targets on mobile
- Use `p-3` (12px) minimum for clickable elements
- Ensure adequate spacing between interactive elements

### Focus Indicators
- Use `focus:ring-2` with `focus:ring-offset-2` for proper focus spacing
- Maintain consistent focus ring spacing across all interactive elements

### Content Spacing
- Maintain proper spacing between related content groups
- Use consistent spacing for similar content types
- Ensure sufficient white space for readability

## Implementation Examples

### Dashboard Card
```jsx
<div className="bg-surface-primary border border-surface-border rounded-lg p-6 space-y-4">
  <h3 className="text-heading-4 text-content-primary">Work in Progress</h3>
  <div className="space-y-2">
    <p className="text-2xl font-semibold text-content-primary">R 247,850</p>
    <p className="text-body-small text-content-secondary">+12.3% from last month</p>
  </div>
</div>
```

### Form Layout
```jsx
<form className="space-y-5">
  <div className="space-y-2">
    <label className="text-label-medium text-content-primary">Client Name</label>
    <input className="w-full px-3 py-2 border border-surface-border rounded-lg" />
  </div>
  <div className="space-y-2">
    <label className="text-label-medium text-content-primary">Matter Type</label>
    <select className="w-full px-3 py-2 border border-surface-border rounded-lg" />
  </div>
</form>
```