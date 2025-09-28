import type { Meta, StoryObj } from '@storybook/react';
import { FileText, DollarSign, TrendingUp, MoreHorizontal } from 'lucide-react';
import Card, { CardHeader, CardContent, CardFooter } from './Card';
import Button from './Button';

const meta: Meta<typeof Card> = {
  title: 'Design System/Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible card component for displaying content with various styles and interactive states. Supports composition with CardHeader, CardContent, and CardFooter sub-components.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined', 'ghost'],
      description: 'Visual style variant of the card',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Padding size of the card',
    },
    interactive: {
      control: { type: 'boolean' },
      description: 'Makes the card focusable and adds interactive styles',
    },
    hoverable: {
      control: { type: 'boolean' },
      description: 'Adds hover effects to the card',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Default Card</h3>
        <p className="text-neutral-600">This is a basic card with default styling.</p>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Elevated Card</h3>
        <p className="text-neutral-600">This card has a shadow for elevation.</p>
      </div>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Outlined Card</h3>
        <p className="text-neutral-600">This card has a prominent border.</p>
      </div>
    ),
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: (
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Ghost Card</h3>
        <p className="text-neutral-600">This card has minimal styling.</p>
      </div>
    ),
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: (
      <div>
        <h3 className="text-base font-semibold text-neutral-900 mb-1">Small Card</h3>
        <p className="text-sm text-neutral-600">Compact padding for tight spaces.</p>
      </div>
    ),
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: (
      <div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-3">Large Card</h3>
        <p className="text-neutral-600">Generous padding for important content.</p>
      </div>
    ),
  },
};

// Interactive states
export const Interactive: Story = {
  args: {
    interactive: true,
    onClick: () => alert('Card clicked!'),
    children: (
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Interactive Card</h3>
        <p className="text-neutral-600">Click me or use keyboard navigation!</p>
      </div>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    hoverable: true,
    children: (
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Hoverable Card</h3>
        <p className="text-neutral-600">Hover over me to see the effect!</p>
      </div>
    ),
  },
};

// Composed cards
export const WithComposition: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-mpondo-gold-100 rounded-lg">
            <FileText className="w-5 h-5 text-mpondo-gold-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Invoice #INV-001</h3>
            <p className="text-sm text-neutral-600">Matter: Smith vs. Jones</p>
          </div>
        </div>
        <button className="p-1 hover:bg-neutral-100 rounded">
          <MoreHorizontal className="w-4 h-4 text-neutral-500" />
        </button>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-600">Amount</p>
            <p className="text-lg font-semibold text-neutral-900">R 15,750.00</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600">Status</p>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
              Paid
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <p className="text-sm text-neutral-500">Due: 15 Dec 2024</p>
        <Button size="sm" variant="outline">View Details</Button>
      </CardFooter>
    </Card>
  ),
};

// Dashboard metric card
export const MetricCard: Story = {
  render: () => (
    <Card hoverable>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-mpondo-gold-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-mpondo-gold-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-600">Work in Progress</p>
            <p className="text-2xl font-semibold text-neutral-900">R 247,850</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
          <TrendingUp className="w-3 h-3" />
          +12.3%
        </span>
      </div>
      <p className="text-sm text-neutral-500">+R 27,150 from last month</p>
    </Card>
  ),
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <h4 className="font-medium mb-2">Default</h4>
        <p className="text-sm text-neutral-600">Standard card styling</p>
      </Card>
      <Card variant="elevated">
        <h4 className="font-medium mb-2">Elevated</h4>
        <p className="text-sm text-neutral-600">With shadow</p>
      </Card>
      <Card variant="outlined">
        <h4 className="font-medium mb-2">Outlined</h4>
        <p className="text-sm text-neutral-600">Prominent border</p>
      </Card>
      <Card variant="ghost">
        <h4 className="font-medium mb-2">Ghost</h4>
        <p className="text-sm text-neutral-600">Minimal styling</p>
      </Card>
    </div>
  ),
};