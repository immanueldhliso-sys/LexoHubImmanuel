import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Input } from '../../../design-system/components';

// Matter types constant (extracted from NewMatterModal)
const MATTER_TYPES = [
  'Commercial Litigation',
  'Contract Law',
  'Employment Law',
  'Family Law',
  'Criminal Law',
  'Property Law',
  'Intellectual Property',
  'Tax Law',
  'Constitutional Law',
  'Administrative Law',
  'Other'
];

interface BasicInfoData {
  title: string;
  description: string;
  matter_type: string;
  court_case_number: string;
}

interface BasicInfoSectionProps {
  data: BasicInfoData;
  errors: Partial<Record<keyof BasicInfoData, string>>;
  prepopulatedFields?: Set<string>;
  onChange: (field: keyof BasicInfoData, value: string) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  data,
  errors,
  prepopulatedFields = new Set(),
  onChange
}) => {
  // Helper function to render input with prepopulation indicator
  const renderInputWithIndicator = (
    field: keyof BasicInfoData,
    label: string,
    type: string = 'text',
    placeholder?: string,
    required?: boolean
  ) => {
    const isPrepopulated = prepopulatedFields.has(field);
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {isPrepopulated && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              <RotateCcw className="w-3 h-3 mr-1" />
              Pre-filled
            </span>
          )}
        </label>
        <input
          type={type}
          value={data[field]}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent ${
            errors[field] ? 'border-red-500' : isPrepopulated ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
          }`}
        />
        {errors[field] && (
          <p className="text-red-500 text-sm">{errors[field]}</p>
        )}
      </div>
    );
  };

  // Helper function to render select with prepopulation indicator
  const renderSelectWithIndicator = (
    field: keyof BasicInfoData,
    label: string,
    options: { value: string; label: string }[],
    required?: boolean
  ) => {
    const isPrepopulated = prepopulatedFields.has(field);
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {isPrepopulated && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              <RotateCcw className="w-3 h-3 mr-1" />
              Pre-filled
            </span>
          )}
        </label>
        <select
          value={data[field]}
          onChange={(e) => onChange(field, e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent ${
            errors[field] ? 'border-red-500' : isPrepopulated ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
          }`}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors[field] && (
          <p className="text-red-500 text-sm">{errors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Basic Information</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Provide the essential details about this matter to get started.
        </p>
      </div>
      
      <div className="space-y-4">
        {renderInputWithIndicator('title', 'Matter Title', 'text', 'e.g., Smith v Jones Commercial Dispute', true)}

        {renderSelectWithIndicator('matter_type', 'Matter Type', [
          { value: '', label: 'Select matter type' },
          ...MATTER_TYPES.map(type => ({ value: type, label: type }))
        ], true)}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
            {prepopulatedFields.has('description') && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                <RotateCcw className="w-3 h-3 mr-1" />
                Pre-filled
              </span>
            )}
          </label>
          <textarea
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Brief description of the matter"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent ${
              errors.description ? 'border-red-500' : prepopulatedFields.has('description') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description}</p>
          )}
        </div>

        {renderInputWithIndicator('court_case_number', 'Court Case Number', 'text', 'e.g., 12345/2024')}
      </div>
    </div>
  );
};