# Settings Page - Invoice Designer Link Implementation

## Issue Fixed
Fixed the `useNavigate() may be used only in the context of a <Router> component` error in SettingsPage.tsx.

## Root Cause
The SettingsPage was using `useNavigate` from `react-router-dom`, but the LexoHub application doesn't use React Router. Instead, it uses a custom page navigation system with a `Page` type and `onNavigate` callback prop.

## Solution Implemented

### 1. Removed React Router Dependency
**Before:**
```typescript
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  // ...
}
```

**After:**
```typescript
import type { Page } from '../types';

interface SettingsPageProps {
  onNavigate?: (page: Page) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  // ...
}
```

### 2. Updated Navigation Handlers
**Before:**
```typescript
const handleManageTemplates = () => {
  navigate('/templates');
};

const handleManageCategory = (categoryName: string) => {
  navigate(`/templates?category=${encodeURIComponent(categoryName)}`);
};
```

**After:**
```typescript
const handleManageTemplates = () => {
  if (onNavigate) {
    onNavigate('matter-templates');
  }
};

const handleManageCategory = () => {
  if (onNavigate) {
    onNavigate('matter-templates');
  }
};
```

### 3. Updated App.tsx to Pass Navigation Prop
```typescript
case 'settings':
  return <SettingsPage onNavigate={handlePageChange} />;
```

### 4. Added Invoice Designer Link
Added a prominent call-to-action card in the Billing tab of Settings:

```typescript
<Card>
  <CardHeader>
    <h2 className="text-xl font-semibold text-neutral-900">Invoice & Proforma Design</h2>
  </CardHeader>
  <CardContent>
    <div className="flex items-start space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <FileText className="w-6 h-6 text-blue-600 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-medium text-neutral-900 mb-1">Customize Your PDF Design</h4>
        <p className="text-sm text-neutral-600 mb-3">
          Design professional invoices and proformas with custom colors, fonts, branding, and layout options.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onNavigate?.('invoice-designer')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Open PDF Designer
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

## Location of Invoice Designer Link
The Invoice Designer can now be accessed from:
1. **Settings → Billing Tab** - Prominent blue card at the top
2. **Direct navigation** - Via `onNavigate('invoice-designer')`

## Visual Design
- **Blue highlight card** - Stands out from other settings
- **Icon** - FileText icon for visual recognition
- **Clear description** - Explains what the designer does
- **Primary button** - Encourages action
- **Positioned at top** - First thing users see in Billing tab

## Benefits
1. **Error Fixed** - No more React Router errors
2. **Consistent Navigation** - Uses app's custom navigation system
3. **Easy Access** - Users can quickly find the PDF designer
4. **Contextual Placement** - Located in Billing settings where it makes sense
5. **Professional UI** - Matches LexoHub design system

## Testing
To test the implementation:
1. Navigate to Settings page
2. Click on "Billing" tab
3. See the "Invoice & Proforma Design" card at the top
4. Click "Open PDF Designer" button
5. Should navigate to the Invoice Designer page without errors

## Files Modified
1. `src/pages/SettingsPage.tsx` - Fixed navigation, added designer link
2. `src/App.tsx` - Added onNavigate prop to SettingsPage
3. `src/types/index.ts` - Added 'invoice-designer' to Page type

## Future Enhancements
- Add quick access from Invoices page
- Add to Pro Forma page
- Create keyboard shortcut (e.g., Cmd/Ctrl + D)
- Add to Quick Actions menu
- Show preview thumbnail in settings
