import { useState } from 'react';
import { FormAssistant } from './FormAssistant';
import { Button, Card, CardHeader, CardContent } from '../../design-system/components';
import type { FormField, FormContext } from '../../services/ai/form-assistant.service';

export function FormAssistantExample() {
  const [formData, setFormData] = useState({
    matter_title: '',
    client_name: '',
    description: '',
    estimated_fee: '',
    brief_type: '',
    urgency: 'standard',
    date: new Date().toISOString().split('T')[0]
  });

  const formFields: FormField[] = [
    {
      name: 'matter_title',
      label: 'Matter Title',
      type: 'text',
      value: formData.matter_title,
      required: true,
      placeholder: 'e.g., Contract Review for ABC Corp'
    },
    {
      name: 'client_name',
      label: 'Client Name',
      type: 'text',
      value: formData.client_name,
      required: true,
      placeholder: 'e.g., John Smith'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      value: formData.description,
      required: true,
      placeholder: 'Describe the matter...'
    },
    {
      name: 'estimated_fee',
      label: 'Estimated Fee (R)',
      type: 'number',
      value: formData.estimated_fee,
      placeholder: '0.00'
    },
    {
      name: 'brief_type',
      label: 'Brief Type',
      type: 'select',
      value: formData.brief_type,
      options: [
        { value: 'civil_litigation', label: 'Civil Litigation' },
        { value: 'commercial', label: 'Commercial Law' },
        { value: 'family', label: 'Family Law' },
        { value: 'criminal', label: 'Criminal Defense' },
        { value: 'contract', label: 'Contract Review' }
      ]
    },
    {
      name: 'urgency',
      label: 'Urgency',
      type: 'select',
      value: formData.urgency,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'standard', label: 'Standard' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      value: formData.date,
      required: true
    }
  ];

  const formContext: FormContext = {
    formType: 'matter',
    existingData: formData,
    relatedData: {
      matters: [
        { id: '1', title: 'Previous Contract Review', client_name: 'ABC Corp', attorney: 'John Doe' },
        { id: '2', title: 'Litigation Matter', client_name: 'XYZ Ltd', attorney: 'Jane Smith' }
      ],
      clients: [
        { id: '1', name: 'ABC Corp', email: 'contact@abc.com' },
        { id: '2', name: 'XYZ Ltd', email: 'info@xyz.com' }
      ]
    }
  };

  const handleApplySuggestion = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyAll = (suggestions: Record<string, string | number>) => {
    setFormData(prev => ({
      ...prev,
      ...suggestions
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <h2 className="text-2xl font-bold text-neutral-900">
            New Matter Form with AI Assistant
          </h2>
          <p className="text-neutral-600 mt-1">
            Use the AI Assistant to quickly fill out the form with natural language
          </p>
        </CardHeader>
        <CardContent>
          <FormAssistant
            fields={formFields}
            context={formContext}
            onApplySuggestion={handleApplySuggestion}
            onApplyAll={handleApplyAll}
            className="mb-6"
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Matter Title *
              </label>
              <input
                type="text"
                value={formData.matter_title}
                onChange={(e) => setFormData(prev => ({ ...prev, matter_title: e.target.value }))}
                placeholder="e.g., Contract Review for ABC Corp"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                placeholder="e.g., John Smith"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the matter..."
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Estimated Fee (R)
                </label>
                <input
                  type="number"
                  value={formData.estimated_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_fee: e.target.value }))}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Brief Type
                </label>
                <select
                  value={formData.brief_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, brief_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  <option value="civil_litigation">Civil Litigation</option>
                  <option value="commercial">Commercial Law</option>
                  <option value="family">Family Law</option>
                  <option value="criminal">Criminal Defense</option>
                  <option value="contract">Contract Review</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Urgency
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" size="md" type="button">
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Create Matter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">
            How to Use the AI Assistant
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-neutral-700">
            <div>
              <strong className="text-neutral-900">Smart Fill:</strong>
              <p>Type a natural description like "Contract review for ABC Corp, estimated at R15000, high urgency" and click Smart Fill.</p>
            </div>
            <div>
              <strong className="text-neutral-900">Get Suggestions:</strong>
              <p>Click to get intelligent suggestions based on your recent entries and patterns.</p>
            </div>
            <div>
              <strong className="text-neutral-900">Keyboard Shortcut:</strong>
              <p>Press Ctrl+Enter (or Cmd+Enter on Mac) to analyze your input.</p>
            </div>
            <div>
              <strong className="text-neutral-900">Apply Suggestions:</strong>
              <p>Review each suggestion with confidence scores and reasoning, then apply individually or all at once.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
