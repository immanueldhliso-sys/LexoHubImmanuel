import React from 'react';
import { Input } from '../../../design-system/components';
import { RiskLevel } from '../../../types';

interface RiskAssessmentSectionProps {
  formData: {
    risk_level: RiskLevel;
    settlement_probability: string;
    expected_completion_date: string;
  };
  errors: {
    settlement_probability?: string;
    expected_completion_date?: string;
  };
  onInputChange: (field: string, value: any) => void;
  prepopulatedFields?: Set<string>;
}

export const RiskAssessmentSection: React.FC<RiskAssessmentSectionProps> = ({
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

  const riskLevelOptions = [
    { value: RiskLevel.LOW, label: 'Low Risk' },
    { value: RiskLevel.MEDIUM, label: 'Medium Risk' },
    { value: RiskLevel.HIGH, label: 'High Risk' },
    { value: RiskLevel.CRITICAL, label: 'Critical Risk' }
  ];

  const getRiskLevelColor = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case RiskLevel.LOW:
        return 'text-green-600 bg-green-50 border-green-200';
      case RiskLevel.MEDIUM:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case RiskLevel.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case RiskLevel.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200';
    }
  };

  const getRiskDescription = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case RiskLevel.LOW:
        return 'Minimal risk with high probability of favorable outcome';
      case RiskLevel.MEDIUM:
        return 'Moderate risk requiring standard precautions';
      case RiskLevel.HIGH:
        return 'Significant risk requiring careful management';
      case RiskLevel.CRITICAL:
        return 'High risk requiring immediate attention and mitigation';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Risk Assessment</h3>
        <p className="text-sm text-neutral-600 mt-1">
          Evaluate the risk level and expected outcomes for this matter
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {renderSelectWithIndicator(
            'Risk Level',
            formData.risk_level,
            (value) => onInputChange('risk_level', value as RiskLevel),
            riskLevelOptions,
            'risk_level'
          )}
          {formData.risk_level && (
            <div className={`mt-2 p-3 rounded-md border ${getRiskLevelColor(formData.risk_level)}`}>
              <p className="text-sm font-medium">
                {getRiskDescription(formData.risk_level)}
              </p>
            </div>
          )}
        </div>

        {renderInputWithIndicator(
          'Settlement Probability (%)',
          formData.settlement_probability,
          (value) => onInputChange('settlement_probability', value),
          'settlement_probability',
          'number',
          '0-100',
          errors.settlement_probability,
          '0',
          '100'
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInputWithIndicator(
          'Expected Completion Date',
          formData.expected_completion_date,
          (value) => onInputChange('expected_completion_date', value),
          'expected_completion_date',
          'date',
          undefined,
          errors.expected_completion_date
        )}

        <div className="flex items-center justify-center">
          {formData.settlement_probability && (
            <div className="text-center p-4 bg-neutral-50 rounded-lg border">
              <div className="text-2xl font-bold text-mpondo-gold">
                {formData.settlement_probability}%
              </div>
              <div className="text-sm text-neutral-600">
                Settlement Likelihood
              </div>
            </div>
          )}
        </div>
      </div>

      {formData.expected_completion_date && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                Timeline Planning
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Expected completion: {new Date(formData.expected_completion_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};