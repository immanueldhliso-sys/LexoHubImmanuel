# AI Form Assistant

An intelligent form completion assistant powered by AWS Bedrock Claude 3.5 Sonnet that helps users fill out forms quickly and accurately using natural language input.

## Features

### 🤖 Smart Fill
- **Natural Language Processing**: Type what you want to enter in plain English (or Afrikaans)
- **Contextual Understanding**: Understands South African legal terminology and practices
- **Multi-field Extraction**: Extracts multiple form fields from a single input

### 💡 Intelligent Suggestions
- **Pattern Learning**: Learns from your previous entries
- **Context-Aware**: Considers related data (matters, clients, recent entries)
- **Confidence Scoring**: Shows confidence levels for each suggestion (0-100%)
- **Alternative Options**: Provides multiple suggestions when uncertain

### ⚡ User Experience
- **Keyboard Shortcuts**: Ctrl+Enter (Cmd+Enter on Mac) to analyze input
- **One-Click Apply**: Apply suggestions individually or all at once
- **Visual Feedback**: Clear indication of applied suggestions
- **Accessibility**: Full keyboard navigation and screen reader support

## Installation

The FormAssistant is already integrated into the LexoHub codebase. To use it in a new form:

```tsx
import { FormAssistant } from '@/components/forms';
import type { FormField, FormContext } from '@/services/ai/form-assistant.service';
```

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import { FormAssistant } from '@/components/forms';

function MyForm() {
  const [formData, setFormData] = useState({
    client_name: '',
    description: '',
    amount: ''
  });

  const formFields: FormField[] = [
    {
      name: 'client_name',
      label: 'Client Name',
      type: 'text',
      value: formData.client_name,
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      value: formData.description
    },
    {
      name: 'amount',
      label: 'Amount (R)',
      type: 'number',
      value: formData.amount
    }
  ];

  const formContext: FormContext = {
    formType: 'invoice',
    existingData: formData,
    relatedData: {
      matters: availableMatters,
      clients: availableClients
    }
  };

  const handleApplySuggestion = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div>
      <FormAssistant
        fields={formFields}
        context={formContext}
        onApplySuggestion={handleApplySuggestion}
      />
      
      {/* Your form fields */}
    </div>
  );
}
```

### Advanced Example with Apply All

```tsx
const handleApplyAll = (suggestions: Record<string, string | number>) => {
  setFormData(prev => ({
    ...prev,
    ...suggestions
  }));
};

<FormAssistant
  fields={formFields}
  context={formContext}
  onApplySuggestion={handleApplySuggestion}
  onApplyAll={handleApplyAll}
  className="mb-6"
/>
```

## API Reference

### FormAssistant Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fields` | `FormField[]` | Yes | Array of form field definitions |
| `context` | `FormContext` | Yes | Form context with type and related data |
| `onApplySuggestion` | `(field: string, value: string \| number) => void` | Yes | Callback when a suggestion is applied |
| `onApplyAll` | `(suggestions: Record<string, string \| number>) => void` | No | Callback to apply multiple suggestions at once |
| `className` | `string` | No | Additional CSS classes |

### FormField Interface

```typescript
interface FormField {
  name: string;                    // Field identifier
  label: string;                   // Display label
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'tel';
  value?: string | number;         // Current value
  options?: Array<{                // For select fields
    value: string;
    label: string;
  }>;
  required?: boolean;              // Is field required
  placeholder?: string;            // Placeholder text
}
```

### FormContext Interface

```typescript
interface FormContext {
  formType: 'invoice' | 'matter' | 'time-entry' | 'pro-forma' | 'client';
  existingData?: Record<string, unknown>;
  relatedData?: {
    matters?: Array<{ id: string; title: string; client_name: string }>;
    clients?: Array<{ id: string; name: string; email: string }>;
    recentEntries?: Array<Record<string, unknown>>;
  };
  userPreferences?: Record<string, unknown>;
}
```

### FormAssistantSuggestion Interface

```typescript
interface FormAssistantSuggestion {
  field: string;                   // Field name
  suggestedValue: string | number; // Suggested value
  confidence: number;              // Confidence score (0-1)
  reasoning: string;               // Explanation for suggestion
  alternatives?: Array<{           // Alternative suggestions
    value: string | number;
    confidence: number;
  }>;
}
```

## Examples

### Example 1: Invoice Form

```tsx
// User types: "Meeting with John Smith about contract review, 2 hours yesterday, R3000"

// AI extracts:
{
  client_name: "John Smith",
  description: "Meeting about contract review",
  duration: "2 hours",
  date: "2025-10-01",
  amount: "3000"
}
```

### Example 2: Matter Form

```tsx
// User types: "New litigation matter for ABC Corp, high urgency, estimated R50000"

// AI extracts:
{
  client_name: "ABC Corp",
  matter_type: "litigation",
  urgency: "high",
  estimated_fee: "50000"
}
```

### Example 3: Time Entry

```tsx
// User types: "Research on Smith case, 3.5 hours today"

// AI extracts:
{
  matter_reference: "Smith case",
  activity_type: "Research",
  duration_minutes: 210,
  date: "2025-10-02"
}
```

## Integration Guide

### Step 1: Define Form Fields

```tsx
const formFields: FormField[] = [
  {
    name: 'field_name',
    label: 'Field Label',
    type: 'text',
    value: formData.field_name,
    required: true,
    placeholder: 'Enter value...'
  },
  // ... more fields
];
```

### Step 2: Set Up Context

```tsx
const formContext: FormContext = {
  formType: 'invoice', // or 'matter', 'time-entry', etc.
  existingData: formData,
  relatedData: {
    matters: availableMatters,
    clients: availableClients,
    recentEntries: recentInvoices
  }
};
```

### Step 3: Handle Suggestions

```tsx
const handleApplySuggestion = (field: string, value: string | number) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};
```

### Step 4: Add Component

```tsx
<FormAssistant
  fields={formFields}
  context={formContext}
  onApplySuggestion={handleApplySuggestion}
/>
```

## Best Practices

### 1. Provide Rich Context

```tsx
// ✅ Good - Rich context
const context: FormContext = {
  formType: 'invoice',
  existingData: formData,
  relatedData: {
    matters: allMatters,
    clients: allClients,
    recentEntries: last10Invoices
  }
};

// ❌ Bad - Minimal context
const context: FormContext = {
  formType: 'invoice'
};
```

### 2. Include Current Values

```tsx
// ✅ Good - Include current values
const formFields: FormField[] = [
  {
    name: 'client_name',
    label: 'Client Name',
    type: 'text',
    value: formData.client_name // Current value
  }
];
```

### 3. Handle All Suggestions

```tsx
// ✅ Good - Handle both individual and batch apply
<FormAssistant
  fields={formFields}
  context={formContext}
  onApplySuggestion={handleApplySuggestion}
  onApplyAll={handleApplyAll}
/>
```

### 4. Validate Applied Values

```tsx
const handleApplySuggestion = (field: string, value: string | number) => {
  // Validate before applying
  if (field === 'amount' && typeof value === 'number' && value < 0) {
    toast.error('Amount cannot be negative');
    return;
  }
  
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` (Windows/Linux) | Analyze natural language input |
| `Cmd+Enter` (Mac) | Analyze natural language input |
| `Tab` | Navigate between suggestions |
| `Enter` | Apply focused suggestion |
| `Esc` | Close assistant |

## Accessibility

The FormAssistant is fully accessible:

- ✅ **Keyboard Navigation**: All functions accessible via keyboard
- ✅ **Screen Reader Support**: Proper ARIA labels and roles
- ✅ **Focus Management**: Clear focus indicators
- ✅ **Color Contrast**: WCAG 2.1 AA compliant
- ✅ **Semantic HTML**: Proper heading hierarchy

## Performance

- **Fast Response**: < 3 seconds for most requests
- **Caching**: Reuses recent suggestions when applicable
- **Fallback Mode**: Works offline with reduced functionality
- **Progressive Enhancement**: Form works without AI if service unavailable

## Troubleshooting

### Issue: No suggestions appearing

**Solution**: Check that:
1. AWS Bedrock API key is configured in `.env`
2. Form fields are properly defined with `name` and `type`
3. Form context includes `formType`

### Issue: Low confidence scores

**Solution**: Provide more context:
1. Include related data (matters, clients)
2. Add recent entries for pattern learning
3. Use more specific natural language input

### Issue: Wrong field mappings

**Solution**: 
1. Ensure field names match your form structure
2. Provide clear field labels
3. Include field options for select fields

## Future Enhancements

- [ ] Voice input integration
- [ ] Multi-language support (11 SA languages)
- [ ] Custom training on user patterns
- [ ] Batch form processing
- [ ] Template suggestions
- [ ] Field validation suggestions

## Support

For issues or questions:
1. Check CloudWatch Logs for AI service errors
2. Verify AWS Bedrock configuration
3. Review form field definitions
4. Check browser console for errors

## License

Proprietary - LexoHub Internal Use Only
