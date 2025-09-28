import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from './Modal';
import Button from './Button';

const meta: Meta<typeof Modal> = {
  title: 'Design System/Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible modal component for displaying content in an overlay. Supports different sizes, keyboard navigation, and composition with sub-components.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Size of the modal',
    },
    showCloseButton: {
      control: { type: 'boolean' },
      description: 'Whether to show the close button in header',
    },
    closeOnOverlayClick: {
      control: { type: 'boolean' },
      description: 'Whether clicking the overlay closes the modal',
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Whether pressing escape closes the modal',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component for interactive stories
const ModalWrapper = ({ children, ...props }: React.PropsWithChildren<ModalProps>) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...props} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </Modal>
    </div>
  );
};

// Basic modal
export const Default: Story = {
  render: () => (
    <ModalWrapper title="Default Modal">
      <ModalBody>
        <p className="text-neutral-600">
          This is a basic modal with default settings. You can close it by clicking the X button,
          pressing Escape, or clicking outside the modal.
        </p>
      </ModalBody>
    </ModalWrapper>
  ),
};

// Different sizes
export const Small: Story = {
  render: () => (
    <ModalWrapper title="Small Modal" size="sm">
      <ModalBody>
        <p className="text-neutral-600">This is a small modal for simple confirmations.</p>
      </ModalBody>
    </ModalWrapper>
  ),
};

export const Large: Story = {
  render: () => (
    <ModalWrapper title="Large Modal" size="lg">
      <ModalBody>
        <p className="text-neutral-600 mb-4">
          This is a large modal that can accommodate more content. It's perfect for forms,
          detailed information, or complex interactions.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 rounded-lg">
            <h4 className="font-medium mb-2">Section 1</h4>
            <p className="text-sm text-neutral-600">Some content here</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <h4 className="font-medium mb-2">Section 2</h4>
            <p className="text-sm text-neutral-600">More content here</p>
          </div>
        </div>
      </ModalBody>
    </ModalWrapper>
  ),
};

// With composition
export const WithComposition: Story = {
  render: () => (
    <ModalWrapper>
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-mpondo-gold-100 rounded-lg">
            <Info className="w-5 h-5 text-mpondo-gold-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Invoice Details</h3>
            <p className="text-sm text-neutral-600">Review invoice information</p>
          </div>
        </div>
      </ModalHeader>
      
      <ModalBody>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">Invoice Number</label>
              <p className="text-neutral-900">INV-2024-001</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Amount</label>
              <p className="text-neutral-900 font-semibold">R 15,750.00</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-neutral-700">Description</label>
            <p className="text-neutral-600">
              Legal services rendered for Smith vs. Jones case including research,
              document preparation, and court appearances.
            </p>
          </div>
        </div>
      </ModalBody>
      
      <ModalFooter>
        <Button variant="outline">Download PDF</Button>
        <Button>Send Invoice</Button>
      </ModalFooter>
    </ModalWrapper>
  ),
};

// Confirmation modal
export const Confirmation: Story = {
  render: () => (
    <ModalWrapper size="sm">
      <ModalBody>
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-error-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Delete Invoice</h3>
          <p className="text-neutral-600 mb-6">
            Are you sure you want to delete this invoice? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete</Button>
          </div>
        </div>
      </ModalBody>
    </ModalWrapper>
  ),
};

// Success modal
export const Success: Story = {
  render: () => (
    <ModalWrapper size="sm" showCloseButton={false}>
      <ModalBody>
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Payment Successful</h3>
          <p className="text-neutral-600 mb-6">
            Your payment of R 15,750.00 has been processed successfully.
          </p>
          <Button className="w-full">Continue</Button>
        </div>
      </ModalBody>
    </ModalWrapper>
  ),
};

// Form modal
export const FormModal: Story = {
  render: () => (
    <ModalWrapper title="Create New Matter" size="lg">
      <ModalBody>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Matter Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                placeholder="Enter matter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Client
              </label>
              <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent">
                <option>Select client</option>
                <option>John Smith</option>
                <option>Jane Doe</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              placeholder="Enter matter description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Hourly Rate
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Currency
              </label>
              <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent">
                <option>ZAR (R)</option>
                <option>USD ($)</option>
                <option>EUR (€)</option>
              </select>
            </div>
          </div>
        </form>
      </ModalBody>
      
      <ModalFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Create Matter</Button>
      </ModalFooter>
    </ModalWrapper>
  ),
};

// No close options
export const NoCloseOptions: Story = {
  render: () => (
    <ModalWrapper
      title="Processing Payment"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <ModalBody>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-mpondo-gold-200 border-t-mpondo-gold-600 rounded-full mx-auto mb-4" />
          <p className="text-neutral-600">
            Please wait while we process your payment. Do not close this window.
          </p>
        </div>
      </ModalBody>
    </ModalWrapper>
  ),
};