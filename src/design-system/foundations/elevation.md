# Elevation & Shadows - The Mpondo Design System

## Elevation Philosophy

Our elevation system creates depth and hierarchy through carefully crafted shadows that feel natural and professional. The shadows are designed to be subtle yet effective, maintaining the sophisticated aesthetic of legal practice management.

## Shadow Scale

### Level 0 - Flat
```css
--shadow-none: none;
/* Usage: Flush elements, disabled states */
```

### Level 1 - Subtle Lift
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
/* Usage: Cards at rest, form inputs */
```

### Level 2 - Standard Elevation
```css
--shadow-md: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
/* Usage: Buttons, interactive cards */
```

### Level 3 - Prominent Elevation
```css
--shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
/* Usage: Dropdowns, tooltips, hover states */
```

### Level 4 - High Elevation
```css
--shadow-xl: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
/* Usage: Modals, popovers, floating panels */
```

### Level 5 - Maximum Elevation
```css
--shadow-2xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
/* Usage: Full-screen overlays, critical alerts */
```

## Colored Shadows

### Primary Shadows (for brand elements)
```css
--shadow-primary-sm: 0 1px 2px 0 rgba(44, 90, 160, 0.1);
--shadow-primary-md: 0 4px 6px -1px rgba(44, 90, 160, 0.1), 0 2px 4px -1px rgba(44, 90, 160, 0.06);
--shadow-primary-lg: 0 10px 15px -3px rgba(44, 90, 160, 0.1), 0 4px 6px -2px rgba(44, 90, 160, 0.05);
```

### Success Shadows (for positive actions)
```css
--shadow-success-sm: 0 1px 2px 0 rgba(34, 197, 94, 0.1);
--shadow-success-md: 0 4px 6px -1px rgba(34, 197, 94, 0.1), 0 2px 4px -1px rgba(34, 197, 94, 0.06);
```

### Error Shadows (for critical elements)
```css
--shadow-error-sm: 0 1px 2px 0 rgba(239, 68, 68, 0.1);
--shadow-error-md: 0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(239, 68, 68, 0.06);
```

## Tailwind CSS Classes

### Standard Shadow Classes
```css
.shadow-none { box-shadow: none; }
.shadow-sm   { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.shadow      { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
.shadow-md   { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
.shadow-lg   { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
.shadow-xl   { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
```

### Custom Mpondo Shadow Classes
```css
.shadow-primary-sm { box-shadow: var(--shadow-primary-sm); }
.shadow-primary-md { box-shadow: var(--shadow-primary-md); }
.shadow-primary-lg { box-shadow: var(--shadow-primary-lg); }

.shadow-success-sm { box-shadow: var(--shadow-success-sm); }
.shadow-success-md { box-shadow: var(--shadow-success-md); }

.shadow-error-sm { box-shadow: var(--shadow-error-sm); }
.shadow-error-md { box-shadow: var(--shadow-error-md); }
```

## Border Radius Scale

### Radius Values
```css
--radius-none: 0px;          /* Sharp corners */
--radius-sm: 0.25rem;        /* 4px - Subtle rounding */
--radius-md: 0.5rem;         /* 8px - Standard rounding */
--radius-lg: 0.75rem;        /* 12px - Prominent rounding */
--radius-xl: 1rem;           /* 16px - High rounding */
--radius-2xl: 1.5rem;        /* 24px - Maximum rounding */
--radius-full: 9999px;       /* Perfect circles/pills */
```

### Tailwind CSS Classes
```css
.rounded-none { border-radius: 0px; }
.rounded-sm   { border-radius: 0.25rem; }
.rounded      { border-radius: 0.5rem; }
.rounded-lg   { border-radius: 0.75rem; }
.rounded-xl   { border-radius: 1rem; }
.rounded-2xl  { border-radius: 1.5rem; }
.rounded-full { border-radius: 9999px; }
```

## Usage Guidelines

### Component Elevation Hierarchy

#### Level 1 - Base Elements
- **Cards at rest**: `shadow-sm`
- **Form inputs**: `shadow-sm` or `shadow-none`
- **Table rows**: `shadow-none`

```jsx
<div className="bg-surface-primary border border-surface-border rounded-lg shadow-sm p-6">
  <h3>Dashboard Card</h3>
</div>
```

#### Level 2 - Interactive Elements
- **Buttons**: `shadow` with `hover:shadow-md`
- **Interactive cards**: `shadow` with `hover:shadow-lg`
- **Navigation items**: `shadow-sm` with `hover:shadow`

```jsx
<button className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow duration-150">
  Primary Action
</button>
```

#### Level 3 - Floating Elements
- **Dropdowns**: `shadow-lg`
- **Tooltips**: `shadow-lg`
- **Popovers**: `shadow-lg`

```jsx
<div className="absolute bg-surface-primary border border-surface-border rounded-lg shadow-lg p-4">
  <p>Dropdown content</p>
</div>
```

#### Level 4 - Modal Elements
- **Modals**: `shadow-xl`
- **Dialogs**: `shadow-xl`
- **Overlays**: `shadow-xl`

```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
  <div className="bg-surface-primary rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
    <h2>Modal Content</h2>
  </div>
</div>
```

### Elevation Transitions

#### Hover States
```css
.mpondo-card-interactive {
  @apply shadow transition-shadow duration-200 ease-out;
}

.mpondo-card-interactive:hover {
  @apply shadow-lg;
}
```

#### Focus States
```css
.mpondo-button:focus {
  @apply shadow-lg ring-2 ring-primary-500 ring-offset-2;
}
```

### Dark Mode Adjustments

```css
/* Dark mode shadows need to be more prominent */
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  }
}
```

## Accessibility Considerations

### Focus Indicators
- Always combine shadows with proper focus rings
- Ensure sufficient contrast for shadow visibility
- Use `ring-offset` to separate focus rings from shadows

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .shadow-transition {
    transition: none;
  }
}
```

## Implementation Examples

### Dashboard Card with Progressive Elevation
```jsx
<div className="bg-surface-primary border border-surface-border rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-6 cursor-pointer">
  <h3 className="text-heading-4 mb-2">Work in Progress</h3>
  <p className="text-2xl font-semibold text-content-primary">R 247,850</p>
</div>
```

### Button with Elevation States
```jsx
<button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow hover:shadow-md active:shadow-sm transition-all duration-150">
  Generate Invoice
</button>
```

### Modal with Maximum Elevation
```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
  <div className="bg-surface-primary rounded-xl shadow-2xl p-8 max-w-lg w-full">
    <h2 className="text-heading-2 mb-4">Confirm Action</h2>
    <p className="text-body-medium text-content-secondary mb-6">
      Are you sure you want to proceed?
    </p>
    <div className="flex justify-end space-x-3">
      <button className="px-4 py-2 text-content-secondary hover:text-content-primary">
        Cancel
      </button>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-md">
        Confirm
      </button>
    </div>
  </div>
</div>
```