# Form Validation Pattern

## Overview

The form validation pattern provides consistent, accessible feedback for user input across all forms in the Mpondo Design System. It supports real-time validation, field-level errors, and form-level success states.

## Validation States

### Valid State
- Clean appearance with no additional styling
- Optional success indicator for critical fields
- Green border and checkmark icon when explicitly showing success

### Invalid State
- Red border: `border-error-500`
- Error message below field
- Error icon in field (for inputs with icon support)
- Maintains focus ring in error color

### Warning State
- Amber border: `border-warning-500`
- Warning message below field
- Warning icon in field
- Used for non-blocking issues

### Loading State
- Spinner icon in field
- Disabled appearance
- Loading message below field

## Visual Specifications

### Error Styling
```css
.form-field-error {
  @apply border-error-500 focus:border-error-500 focus:ring-error-500;
}

.form-error-message {
  @apply text-error-600 text-sm mt-1 flex items-center;
}

.form-error-icon {
  @apply text-error-500 w-4 h-4 mr-1;
}
```

### Success Styling
```css
.form-field-success {
  @apply border-success-500 focus:border-success-500 focus:ring-success-500;
}

.form-success-message {
  @apply text-success-600 text-sm mt-1 flex items-center;
}

.form-success-icon {
  @apply text-success-500 w-4 h-4 mr-1;
}
```

### Warning Styling
```css
.form-field-warning {
  @apply border-warning-500 focus:border-warning-500 focus:ring-warning-500;
}

.form-warning-message {
  @apply text-warning-600 text-sm mt-1 flex items-center;
}

.form-warning-icon {
  @apply text-warning-500 w-4 h-4 mr-1;
}
```

## Validation Timing

### Real-time Validation
- **On blur**: Validate when user leaves field
- **On change**: For critical fields (email, password confirmation)
- **Debounced**: 300ms delay for expensive validations (username availability)

### Submit Validation
- **On submit**: Validate all fields before submission
- **Focus first error**: Automatically focus first invalid field
- **Scroll to error**: Ensure error is visible on screen

## Message Guidelines

### Error Messages
- **Be specific**: "Email address is required" not "This field is required"
- **Be helpful**: "Password must be at least 8 characters" not "Invalid password"
- **Be concise**: Keep under 60 characters when possible
- **Be actionable**: Tell users how to fix the issue

### Success Messages
- **Confirm completion**: "Email verified successfully"
- **Show progress**: "Profile updated"
- **Be encouraging**: Use positive language

## Implementation Examples

### Basic Form Field with Validation
```jsx
import { useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  success?: string;
  warning?: string;
  required?: boolean;
  loading?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  warning,
  required,
  loading,
}) => {
  const [touched, setTouched] = useState(false);
  
  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const getFieldState = () => {
    if (error && touched) return 'error';
    if (success && touched) return 'success';
    if (warning && touched) return 'warning';
    return 'default';
  };

  const fieldState = getFieldState();

  const stateClasses = {
    default: 'border-surface-border focus:border-primary-500 focus:ring-primary-500',
    error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
    success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
    warning: 'border-warning-500 focus:border-warning-500 focus:ring-warning-500',
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-content-primary">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          disabled={loading}
          className={cn(
            'w-full px-3 py-2 border rounded-lg transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:bg-surface-disabled disabled:text-content-disabled',
            stateClasses[fieldState]
          )}
          aria-invalid={fieldState === 'error'}
          aria-describedby={
            error ? `${label}-error` : 
            success ? `${label}-success` : 
            warning ? `${label}-warning` : undefined
          }
        />
        
        {/* State Icons */}
        {fieldState !== 'default' && !loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {fieldState === 'error' && <AlertCircle className="w-4 h-4 text-error-500" />}
            {fieldState === 'success' && <CheckCircle className="w-4 h-4 text-success-500" />}
            {fieldState === 'warning' && <AlertTriangle className="w-4 h-4 text-warning-500" />}
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {/* Messages */}
      {error && touched && (
        <p id={`${label}-error`} className="text-error-600 text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
      
      {success && touched && !error && (
        <p id={`${label}-success`} className="text-success-600 text-sm flex items-center">
          <CheckCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {success}
        </p>
      )}
      
      {warning && touched && !error && !success && (
        <p id={`${label}-warning`} className="text-warning-600 text-sm flex items-center">
          <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
          {warning}
        </p>
      )}
    </div>
  );
};
```

### Form with Validation Hook
```jsx
import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface FormField {
  value: string;
  error: string | null;
  touched: boolean;
  rules: ValidationRule;
}

export const useFormValidation = (initialFields: Record<string, ValidationRule>) => {
  const [fields, setFields] = useState<Record<string, FormField>>(() =>
    Object.keys(initialFields).reduce((acc, key) => ({
      ...acc,
      [key]: {
        value: '',
        error: null,
        touched: false,
        rules: initialFields[key],
      },
    }), {})
  );

  const validateField = useCallback((name: string, value: string): string | null => {
    const rules = fields[name]?.rules;
    if (!rules) return null;

    if (rules.required && !value.trim()) {
      return `${name} is required`;
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `${name} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `${name} must be no more than ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return `${name} format is invalid`;
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [fields]);

  const setFieldValue = useCallback((name: string, value: string) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        error: prev[name].touched ? validateField(name, value) : null,
      },
    }));
  }, [validateField]);

  const setFieldTouched = useCallback((name: string) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched: true,
        error: validateField(name, prev[name].value),
      },
    }));
  }, [validateField]);

  const validateAll = useCallback(() => {
    const newFields = { ...fields };
    let hasErrors = false;

    Object.keys(newFields).forEach(name => {
      const error = validateField(name, newFields[name].value);
      newFields[name] = {
        ...newFields[name],
        touched: true,
        error,
      };
      if (error) hasErrors = true;
    });

    setFields(newFields);
    return !hasErrors;
  }, [fields, validateField]);

  const reset = useCallback(() => {
    setFields(prev =>
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: {
          ...prev[key],
          value: '',
          error: null,
          touched: false,
        },
      }), {})
    );
  }, []);

  return {
    fields,
    setFieldValue,
    setFieldTouched,
    validateAll,
    reset,
    isValid: Object.values(fields).every(field => !field.error),
    hasErrors: Object.values(fields).some(field => field.error && field.touched),
  };
};
```

### Complete Form Example
```jsx
export const ClientIntakeForm = () => {
  const { fields, setFieldValue, setFieldTouched, validateAll, isValid } = useFormValidation({
    clientName: { required: true, minLength: 2 },
    email: { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      custom: (value) => {
        if (value && !value.includes('.')) {
          return 'Please enter a valid email address';
        }
        return null;
      }
    },
    phone: { required: true, pattern: /^[\d\s\-\+\(\)]+$/ },
    matterType: { required: true },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) {
      // Focus first error field
      const firstErrorField = Object.keys(fields).find(key => fields[key].error);
      if (firstErrorField) {
        document.getElementById(firstErrorField)?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await submitClientIntake({
        clientName: fields.clientName.value,
        email: fields.email.value,
        phone: fields.phone.value,
        matterType: fields.matterType.value,
      });
      setSubmitSuccess(true);
    } catch (error) {
      // Handle submission error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-4" />
        <h3 className="text-heading-3 text-content-primary mb-2">Client Added Successfully</h3>
        <p className="text-body-medium text-content-secondary">
          The client has been added to your practice management system.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Client Name"
        value={fields.clientName.value}
        onChange={(value) => setFieldValue('clientName', value)}
        onBlur={() => setFieldTouched('clientName')}
        error={fields.clientName.error}
        required
      />

      <FormField
        label="Email Address"
        type="email"
        value={fields.email.value}
        onChange={(value) => setFieldValue('email', value)}
        onBlur={() => setFieldTouched('email')}
        error={fields.email.error}
        required
      />

      <FormField
        label="Phone Number"
        type="tel"
        value={fields.phone.value}
        onChange={(value) => setFieldValue('phone', value)}
        onBlur={() => setFieldTouched('phone')}
        error={fields.phone.error}
        required
      />

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 text-content-secondary hover:text-content-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-surface-disabled disabled:text-content-disabled text-white px-6 py-2 rounded-lg transition-colors duration-150"
        >
          {isSubmitting ? 'Adding Client...' : 'Add Client'}
        </button>
      </div>
    </form>
  );
};
```

## Accessibility Guidelines

### ARIA Attributes
- Use `aria-invalid="true"` for fields with errors
- Use `aria-describedby` to associate error messages with fields
- Use `aria-required="true"` for required fields

### Focus Management
- Focus first invalid field on form submission
- Ensure error messages are announced by screen readers
- Maintain logical tab order

### Color and Contrast
- Don't rely solely on color to indicate validation state
- Use icons and text to reinforce validation messages
- Ensure sufficient contrast for all validation states

## Best Practices

### Error Prevention
- Use input types (email, tel, url) for automatic validation
- Provide format hints in placeholder text
- Use progressive enhancement for complex validations

### User Experience
- Validate on blur for better UX than on-change
- Show success states sparingly, only for critical confirmations
- Group related validation errors together
- Provide clear recovery paths for errors

### Performance
- Debounce expensive validations (API calls)
- Cache validation results when appropriate
- Use client-side validation with server-side backup