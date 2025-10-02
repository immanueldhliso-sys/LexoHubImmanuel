# Live Preview Panel Implementation

## Overview
Added a real-time live preview panel to the Invoice Designer that shows a scaled-down version of the invoice/proforma while editing settings. The preview updates instantly as users make changes.

## Features Implemented

### 1. Toggle Button
- **"Show/Hide Live Preview"** button in the header
- Eye icon for visual recognition
- Toggles the preview panel on/off
- Adjusts layout dynamically when toggled

### 2. Live Preview Panel
- **Sticky positioning** - Stays visible while scrolling
- **Scaled preview** - 70% scale to fit in panel (800px height)
- **Real-time updates** - Changes reflect immediately
- **Professional styling** - Card with shadow and border

### 3. Preview Mode Switcher
- **Invoice/Pro Forma toggle** in preview header
- Blue button styling for active mode
- Instant switching between modes
- Compact button design

### 4. Dynamic Layout
The page layout adjusts based on preview visibility:

**With Live Preview:**
- Sidebar: 3 columns (xl:col-span-3)
- Editor: 5 columns (xl:col-span-5)
- Preview: 4 columns (xl:col-span-4)

**Without Live Preview:**
- Sidebar: 4 columns (xl:col-span-4)
- Editor: 8 columns (xl:col-span-8)
- Preview: Hidden

### 5. Preview Content
The live preview displays:
- **Header** with logo, title, firm name, tagline
- **Client information** section
- **Invoice/Pro Forma details**
- **Line items table** with sample data
- **Totals section** with subtotal, VAT, grand total
- **Banking details** (if enabled)
- All styled according to current settings

### 6. Real-time Styling
All design settings apply instantly:
- **Colors**: Primary, secondary, text colors
- **Fonts**: Family and all font sizes
- **Layout**: Header alignment, logo position, margins
- **Branding**: Logo display, firm name, tagline
- **Content**: Line numbers, tax breakdown, banking details

## Technical Implementation

### State Management
```typescript
const [showLivePreview, setShowLivePreview] = useState(true);
```

### Scaling Technique
```css
transform: scale(0.7);
transform-origin: top left;
width: 142.857%; /* 100% / 0.7 */
height: 800px;
```

### Dynamic Inline Styles
All styles are applied using React inline styles with template literals:
```typescript
style={{
  fontFamily: settings.fonts.family,
  color: settings.colors.text,
  fontSize: `${settings.fonts.titleSize}pt`,
  background: settings.colors.primary
}}
```

### Responsive Grid
```typescript
className={showLivePreview ? "xl:col-span-5" : "xl:col-span-8"}
```

## User Experience

### Benefits
1. **Instant Feedback** - See changes as you make them
2. **No Context Switching** - Edit and preview side-by-side
3. **Faster Workflow** - No need to open full preview repeatedly
4. **Better Decisions** - Compare options quickly
5. **Professional Confidence** - Know exactly how it will look

### Interactions
- **Toggle visibility** - Show/hide preview panel
- **Switch modes** - Toggle between Invoice and Pro Forma
- **Scroll independently** - Preview stays visible (sticky)
- **Responsive** - Adapts to screen size

## Visual Design

### Preview Panel Styling
- **Card container** with padding
- **Border** - Light neutral border
- **Shadow** - Inner shadow for depth
- **Background** - White background
- **Rounded corners** - Professional appearance

### Mode Switcher
- **Active state** - Blue background (bg-blue-600)
- **Inactive state** - Light gray (bg-neutral-100)
- **Hover effect** - Slightly darker on hover
- **Small size** - Compact buttons (text-xs)

### Header
- **Title** - "Live Preview" in semibold
- **Buttons** - Invoice/Pro Forma toggle
- **Spacing** - Proper margins and padding

## Sample Data
The preview uses realistic sample data:
- **Client**: "Client Name" with email
- **Invoice Number**: INV-001 or PF-001
- **Date**: Current date in SA format
- **Line Items**:
  - Legal consultation (2 × R 2,500 = R 5,000)
  - Document prep (1 × R 3,500 = R 3,500)
- **Subtotal**: R 8,500
- **VAT (15%)**: R 1,275
- **Total**: R 9,775

## Responsive Behavior

### Desktop (XL screens)
- Three-column layout with preview
- Full preview panel visible
- Optimal editing experience

### Tablet/Mobile
- Stacks vertically
- Preview can be hidden for more space
- Toggle button always accessible

## Performance

### Optimization
- **Inline styles** - No CSS recalculation
- **Conditional rendering** - Preview only renders when visible
- **Efficient updates** - React re-renders only changed elements
- **No external dependencies** - Pure React implementation

## Future Enhancements

### Potential Improvements
1. **Zoom controls** - Adjust preview scale
2. **Drag to resize** - Adjustable preview width
3. **Multiple previews** - Compare different designs
4. **Print from preview** - Direct print button
5. **Export preview** - Save as image
6. **Annotations** - Add notes to preview
7. **Comparison mode** - Before/after view
8. **Mobile preview** - Show how it looks on mobile

## Testing

### How to Test
1. Open Invoice Designer
2. Live preview should be visible by default
3. Click "Hide Live Preview" - panel disappears, layout adjusts
4. Click "Show Live Preview" - panel reappears
5. Change any setting (color, font, etc.)
6. Preview updates instantly
7. Toggle between Invoice and Pro Forma
8. Scroll page - preview stays visible (sticky)

### Expected Behavior
- ✅ Preview visible by default
- ✅ Toggle button works
- ✅ Layout adjusts dynamically
- ✅ All settings apply instantly
- ✅ Mode switcher works
- ✅ Preview stays sticky while scrolling
- ✅ Colors update in real-time
- ✅ Fonts update in real-time
- ✅ Layout changes apply immediately
- ✅ Logo appears when uploaded
- ✅ Content options toggle correctly

## Browser Compatibility
- ✅ Chrome/Edge - Full support
- ✅ Firefox - Full support
- ✅ Safari - Full support
- ✅ Responsive - Works on all screen sizes

## Comparison: Live Preview vs Full Preview

### Live Preview (Side Panel)
- ✅ Always visible while editing
- ✅ Instant updates
- ✅ Scaled to fit
- ✅ Side-by-side editing
- ⚠️ Smaller size

### Full Preview (New Window)
- ✅ Full size view
- ✅ Print-ready
- ✅ Shareable
- ⚠️ Separate window
- ⚠️ Manual refresh needed

Both options are now available for the best user experience!
