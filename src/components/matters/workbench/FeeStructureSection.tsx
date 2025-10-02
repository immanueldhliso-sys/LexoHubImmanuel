import React from 'react';
import { Input } from '../../../design-system/components';
import { FeeType } from '../../../types';

interface FeeStructureSectionProps {
  formData: {
    fee_type: FeeType;
    estimated_fee: string;
    fee_cap: string;
    vat_exempt: boolean;
    tags: string;
  };
  errors: {
    estimated_fee?: string;
    fee_cap?: string;
    tags?: string;
  };
  onInputChange: (field: string, value: any) => void;
  prepopulatedFields?: Set<string>;
}

export const FeeStructureSection: React.FC<FeeStructureSectionProps> = ({
  formData,
  errors,
  onInputChange,
  prepopulatedFields = new Set()
}) => {
  const renderSelectWithIndicator = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: { value: string; label: string }[],
    fieldName: string,
    error?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
        {prepopulatedFields.has(fieldName) && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Pre-filled
          </span>
        )}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent ${
          error ? 'border-red-300' : 'border-neutral-300'
        }`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );

  const renderInputWithIndicator = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    fieldName: string,
    type: string = 'text',
    placeholder?: string,
    error?: string,
    min?: string,
    max?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
        {prepopulatedFields.has(fieldName) && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Pre-filled
          </span>
        )}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={error}
        min={min}
        max={max}
      />
    </div>
  );

  const feeTypeOptions = [
    { value: FeeType.STANDARD, label: 'Standard Hourly' },
    { value: FeeType.CONTINGENCY, label: 'Contingency' },
    { value: FeeType.SUCCESS, label: 'Success Fee' },
    { value: FeeType.RETAINER, label: 'Retainer' },
    { value: FeeType.PRO_BONO, label: 'Pro Bono' }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Fee Structure</h3>
        <p className="text-sm text-neutral-600 mt-1">
          Configure the fee arrangement and financial terms for this matter
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSelectWithIndicator(
          'Fee Type',
          formData.fee_type,
          (value) => onInputChange('fee_type', value as FeeType),
          feeTypeOptions,
          'fee_type'
        )}

        {renderInputWithIndicator(
          'Estimated Fee (R)',
          formData.estimated_fee,
          (value) => onInputChange('estimated_fee', value),
          'estimated_fee',
          'number',
          '0',
          errors.estimated_fee
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInputWithIndicator(
          'Fee Cap (R)',
          formData.fee_cap,
          (value) => onInputChange('fee_cap', value),
          'fee_cap',
          'number',
          'Optional maximum fee',
          errors.fee_cap
        )}

        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="vat_exempt"
            checked={formData.vat_exempt}
            onChange={(e) => onInputChange('vat_exempt', e.target.checked)}
            className="rounded border-neutral-300 text-mpondo-gold focus:ring-mpondo-gold"
          />
          <label htmlFor="vat_exempt" className="text-sm text-neutral-700">
            VAT Exempt
            {prepopulatedFields.has('vat_exempt') && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Pre-filled
              </span>
            )}
          </label>
        </div>
      </div>

      <div>
        {renderInputWithIndicator(
          'Tags',
          formData.tags,
          (value) => onInputChange('tags', value),
          'tags',
          'text',
          'commercial, urgent, high-value (comma separated)',
          errors.tags
        )}
        <p className="mt-1 text-xs text-neutral-500">
          Separate multiple tags with commas
        </p>
      </div>
    </div>
  );
};