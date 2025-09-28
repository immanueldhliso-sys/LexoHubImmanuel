import type { Meta, StoryObj } from '@storybook/react';
import { Search, Mail, Lock, DollarSign, Calendar } from 'lucide-react';
import Input from './Input';

const meta: Meta<typeof Input> = {
  title: 'Design System/Components/Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible input component with support for labels, validation, icons, and different variants. Includes password visibility toggle and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'filled', 'underlined'],
      description: 'Visual style variant',
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'Input type',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the input is required',
    },
    showPasswordToggle: {
      control: { type: 'boolean' },
      description: 'Show password visibility toggle (password type only)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic inputs
export const Default: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
    helperText: 'This will be displayed on your invoices',
  },
};

export const WithoutLabel: Story = {
  args: {
    placeholder: 'Search matters...',
  },
};

export const Required: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    required: true,
    type: 'email',
  },
};

// Sizes
export const Small: Story = {
  args: {
    label: 'Small Input',
    placeholder: 'Small size',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    placeholder: 'Large size',
    size: 'lg',
  },
};

// Variants
export const Filled: Story = {
  args: {
    label: 'Filled Variant',
    placeholder: 'Type something...',
    variant: 'filled',
  },
};

export const Underlined: Story = {
  args: {
    label: 'Underlined Variant',
    placeholder: 'Type something...',
    variant: 'underlined',
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search matters, clients, invoices...',
    leftIcon: <Search className="w-4 h-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
    rightIcon: <Mail className="w-4 h-4" />,
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'Amount',
    placeholder: '0.00',
    type: 'number',
    leftIcon: <DollarSign className="w-4 h-4" />,
    rightIcon: <span className="text-xs text-neutral-500">ZAR</span>,
  },
};

// Password input
export const Password: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    showPasswordToggle: true,
  },
};

export const PasswordWithoutToggle: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    leftIcon: <Lock className="w-4 h-4" />,
  },
};

// States
export const WithError: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
    error: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
    defaultValue: 'Cannot edit this',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Matter Reference',
    placeholder: 'e.g., SMITH-2024-001',
    helperText: 'Use the format: CLIENT-YEAR-NUMBER',
  },
};

// Form examples
export const LoginForm: Story = {
  render: () => (
    <div className="space-y-4 max-w-sm">
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        leftIcon={<Mail className="w-4 h-4" />}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        showPasswordToggle
        required
      />
    </div>
  ),
};

export const InvoiceForm: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Input
        label="Invoice Number"
        placeholder="INV-2024-001"
        helperText="Auto-generated if left empty"
      />
      <Input
        label="Amount"
        type="number"
        placeholder="0.00"
        leftIcon={<DollarSign className="w-4 h-4" />}
        rightIcon={<span className="text-xs text-neutral-500">ZAR</span>}
        required
      />
      <Input
        label="Due Date"
        type="date"
        leftIcon={<Calendar className="w-4 h-4" />}
        required
      />
      <Input
        label="Description"
        placeholder="Legal services rendered..."
        helperText="Brief description of services"
      />
    </div>
  ),
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Default"
            placeholder="Default variant"
            variant="default"
          />
          <Input
            label="Filled"
            placeholder="Filled variant"
            variant="filled"
          />
          <Input
            label="Underlined"
            placeholder="Underlined variant"
            variant="underlined"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Small"
            placeholder="Small size"
            size="sm"
          />
          <Input
            label="Medium"
            placeholder="Medium size"
            size="md"
          />
          <Input
            label="Large"
            placeholder="Large size"
            size="lg"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">States</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Normal"
            placeholder="Normal state"
          />
          <Input
            label="With Error"
            placeholder="Error state"
            error="This field is required"
          />
          <Input
            label="Disabled"
            placeholder="Disabled state"
            disabled
            defaultValue="Cannot edit"
          />
        </div>
      </div>
    </div>
  ),
};