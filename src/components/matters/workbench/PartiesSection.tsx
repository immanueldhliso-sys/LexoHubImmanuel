import React from 'react';
import { RotateCcw } from 'lucide-react';
import { BarAssociation, ClientType } from '../../../types';

interface PartiesData {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  client_type: ClientType;
  instructing_attorney: string;
  instructing_attorney_email: string;
  instructing_attorney_phone: string;
  instructing_firm: string;
  instructing_firm_ref: string;
  bar: BarAssociation;
}

interface PartiesSectionProps {
  data: PartiesData;
  errors: Partial<Record<keyof PartiesData, string>>;
  prepopulatedFields?: Set<string>;
  onChange: (field: keyof PartiesData, value: string | ClientType | BarAssociation) => void;
}

export const PartiesSection: React.FC<PartiesSectionProps> = ({
  data,
  errors,
  prepopulatedFields = new Set(),
  onChange
}) => {
  // Helper function to render input with prepopulation indicator
  const renderInputWithIndicator = (
    field: keyof PartiesData,
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
          value={data[field] as string}
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
    field: keyof PartiesData,
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
          value={data[field] as string}
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
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Parties & Contact Details</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Specify the client and instructing attorney information for this matter.
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Client Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Client Information</h4>
          <div className="space-y-4">
            {renderInputWithIndicator('client_name', 'Client Name', 'text', 'Client or company name', true)}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderSelectWithIndicator('client_type', 'Client Type', [
                { value: ClientType.INDIVIDUAL, label: 'Individual' },
                { value: ClientType.COMPANY, label: 'Company' },
                { value: ClientType.TRUST, label: 'Trust' },
                { value: ClientType.GOVERNMENT, label: 'Government' },
                { value: ClientType.NGO, label: 'NGO' }
              ])}

              {renderSelectWithIndicator('bar', 'Bar Association', [
                { value: BarAssociation.JOHANNESBURG, label: 'Johannesburg Bar' },
                { value: BarAssociation.CAPE_TOWN, label: 'Cape Town Bar' }
              ])}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInputWithIndicator('client_email', 'Client Email', 'email', 'client@example.com')}
              {renderInputWithIndicator('client_phone', 'Client Phone', 'text', '+27 11 123 4567')}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Client Address
                {prepopulatedFields.has('client_address') && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Pre-filled
                  </span>
                )}
              </label>
              <textarea
                value={data.client_address}
                onChange={(e) => onChange('client_address', e.target.value)}
                placeholder="Full address"
                rows={2}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent ${
                  errors.client_address ? 'border-red-500' : prepopulatedFields.has('client_address') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                }`}
              />
              {errors.client_address && (
                <p className="text-red-500 text-sm">{errors.client_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Instructing Attorney Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Instructing Attorney Information</h4>
          <div className="space-y-4">
            {renderInputWithIndicator('instructing_attorney', 'Instructing Attorney', 'text', 'Name of instructing attorney', true)}

            {renderInputWithIndicator('instructing_firm', 'Instructing Firm', 'text', 'Law firm name')}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInputWithIndicator('instructing_attorney_email', 'Attorney Email', 'email', 'attorney@firm.com')}
              {renderInputWithIndicator('instructing_attorney_phone', 'Attorney Phone', 'text', '+27 11 123 4567')}
            </div>

            {renderInputWithIndicator('instructing_firm_ref', 'Firm Reference', 'text', 'Internal reference number')}
          </div>
        </div>
      </div>
    </div>
  );
};