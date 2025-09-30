import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Save, FileText } from 'lucide-react';
import { Button, Card, CardContent, Input, Modal, ModalBody, ModalFooter } from '../../design-system/components';
import { matterApiService } from '../../services/api';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { BarAssociation, FeeType, RiskLevel, ClientType, MatterStatus } from '../../types';
import type { Matter, NewMatterForm } from '../../types';

interface NewMatterFormData {
  title: string;
  description: string;
  matter_type: string;
  court_case_number: string;
  bar: BarAssociation;
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
  fee_type: FeeType;
  estimated_fee: string;
  fee_cap: string;
  risk_level: RiskLevel;
  settlement_probability: string;
  expected_completion_date: string;
  vat_exempt: boolean;
  tags: string;
}

interface NewMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatterCreated?: (matter: Matter) => void;
}

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

export const NewMatterModal: React.FC<NewMatterModalProps> = ({
  isOpen,
  onClose,
  onMatterCreated
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<NewMatterFormData>({
    title: '',
    description: '',
    matter_type: '',
    court_case_number: '',
    bar: BarAssociation.JOHANNESBURG,
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    client_type: ClientType.INDIVIDUAL,
    instructing_attorney: '',
    instructing_attorney_email: '',
    instructing_attorney_phone: '',
    instructing_firm: '',
    instructing_firm_ref: '',
    fee_type: FeeType.STANDARD,
    estimated_fee: '',
    fee_cap: '',
    risk_level: RiskLevel.MEDIUM,
    settlement_probability: '',
    expected_completion_date: '',
    vat_exempt: false,
    tags: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof NewMatterFormData, string>>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (field: keyof NewMatterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof NewMatterFormData, string>> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Matter title is required';
      if (!formData.matter_type) newErrors.matter_type = 'Matter type is required';
      if (!formData.client_name.trim()) newErrors.client_name = 'Client name is required';
      if (!formData.instructing_attorney.trim()) newErrors.instructing_attorney = 'Instructing attorney is required';
    }

    if (step === 2) {
      if (formData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
        newErrors.client_email = 'Invalid email format';
      }
      if (formData.instructing_attorney_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.instructing_attorney_email)) {
        newErrors.instructing_attorney_email = 'Invalid email format';
      }
    }

    if (step === 3) {
      if (formData.estimated_fee && isNaN(Number(formData.estimated_fee))) {
        newErrors.estimated_fee = 'Must be a valid number';
      }
      if (formData.fee_cap && isNaN(Number(formData.fee_cap))) {
        newErrors.fee_cap = 'Must be a valid number';
      }
      if (formData.settlement_probability && (isNaN(Number(formData.settlement_probability)) || Number(formData.settlement_probability) < 0 || Number(formData.settlement_probability) > 100)) {
        newErrors.settlement_probability = 'Must be a number between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    console.debug('[NewMatterModal] Previous clicked', { currentStep });
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    console.debug('[NewMatterModal] Create Matter clicked', { currentStep, isLoading, formData });
    // Validate all steps, focusing the first step with errors for clearer feedback
    const v1 = validateStep(1);
    console.debug('[NewMatterModal] Validation step 1', { valid: v1, errors });
    if (!v1) {
      setCurrentStep(1);
      toast.error('Please complete required fields on Step 1');
      return;
    }
    const v2 = validateStep(2);
    console.debug('[NewMatterModal] Validation step 2', { valid: v2, errors });
    if (!v2) {
      setCurrentStep(2);
      toast.error('Please correct contact details on Step 2');
      return;
    }
    const v3 = validateStep(3);
    console.debug('[NewMatterModal] Validation step 3', { valid: v3, errors });
    if (!v3) {
      setCurrentStep(3);
      toast.error('Please fix fee/risk inputs on Step 3');
      return;
    }
    
    if (!user?.id) {
      toast.error('User not authenticated');
      console.warn('[NewMatterModal] No user ID, blocking submit');
      return;
    }

    // Check if user has advocate profile (prefer DB profile, fallback to auth metadata)
    let practiceNumber = user.advocate_profile?.practice_number ?? user.user_metadata?.practice_number;
    console.debug('[NewMatterModal] Initial practice number check', { practiceNumber, from: practiceNumber ? (user.advocate_profile?.practice_number ? 'advocate_profile' : 'user_metadata') : 'none' });
    if (!practiceNumber) {
      // Attempt a quick auth refresh to capture any recent profile updates
      try {
        await authService.refreshSession();
        const refreshed = authService.getCurrentUser();
        practiceNumber = refreshed?.advocate_profile?.practice_number ?? refreshed?.user_metadata?.practice_number;
        console.debug('[NewMatterModal] Practice number after refresh', { practiceNumber });
      } catch (e) {
        // Non-blocking: proceed to show the error below if still missing
        console.warn('Auth refresh failed when validating advocate profile:', e);
      }

      if (!practiceNumber) {
        toast.error('Please complete your advocate profile setup first');
        console.warn('[NewMatterModal] Missing practice number, blocking submit');
        return;
      }
    }

    setIsLoading(true);
    try {
      // Generate reference number (in real app, this would be done by the backend)
      const referenceNumber = `MAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1000).padStart(4, '0')}`;
      
      // Create form data object matching NewMatterForm interface
      const newMatterForm: NewMatterForm = {
        advocateId: user.id,
        referenceNumber,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        matterType: formData.matter_type,
        matter_type: formData.matter_type,
        courtCaseNumber: formData.court_case_number.trim() || undefined,
        clientName: formData.client_name.trim(),
        client_name: formData.client_name.trim(),
        clientEmail: formData.client_email.trim() || undefined,
        client_email: formData.client_email.trim() || undefined,
        clientPhone: formData.client_phone.trim() || undefined,
        client_phone: formData.client_phone.trim() || undefined,
        clientAddress: formData.client_address.trim() || undefined,
        client_address: formData.client_address.trim() || undefined,
        clientType: formData.client_type,
        client_type: formData.client_type,
        instructingAttorney: formData.instructing_attorney.trim(),
        instructing_attorney: formData.instructing_attorney.trim(),
        instructingAttorneyEmail: formData.instructing_attorney_email.trim() || undefined,
        instructing_attorney_email: formData.instructing_attorney_email.trim() || undefined,
        instructingAttorneyPhone: formData.instructing_attorney_phone.trim() || undefined,
        instructing_attorney_phone: formData.instructing_attorney_phone.trim() || undefined,
        instructingFirm: formData.instructing_firm.trim() || undefined,
        instructing_firm: formData.instructing_firm.trim() || undefined,
        instructingFirmRef: formData.instructing_firm_ref.trim() || undefined,
        instructing_firm_ref: formData.instructing_firm_ref.trim() || undefined,
        bar: formData.bar,
        feeType: formData.fee_type,
        fee_type: formData.fee_type,
        estimatedFee: formData.estimated_fee ? Number(formData.estimated_fee) : undefined,
        estimated_fee: formData.estimated_fee ? Number(formData.estimated_fee) : undefined,
        feeCap: formData.fee_cap ? Number(formData.fee_cap) : undefined,
        fee_cap: formData.fee_cap ? Number(formData.fee_cap) : undefined,
        vatExempt: formData.vat_exempt,
        riskLevel: formData.risk_level,
        risk_level: formData.risk_level,
        expectedCompletionDate: formData.expected_completion_date || undefined,
        expected_completion_date: formData.expected_completion_date || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      console.debug('[NewMatterModal] Submitting new matter form', { newMatterForm });

      // Create matter using API service
      const response = await matterApiService.createFromForm(newMatterForm);
      console.debug('[NewMatterModal] API response from createFromForm', { response });
      
      if (response.error) {
        console.error('API Error Details:', response.error);
        
        // Handle specific database constraint errors
        if (response.error.code === '23503') {
          throw new Error('Your advocate profile is not set up in the database. Please contact support or complete profile setup.');
        }
        
        throw new Error(response.error.message);
      }

      if (response.data) {
        toast.success('Matter created successfully');
        console.debug('[NewMatterModal] Matter created successfully', { matter: response.data });
        onMatterCreated?.(response.data);
        onClose();
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        matter_type: '',
        court_case_number: '',
        bar: BarAssociation.JOHANNESBURG,
        client_name: '',
        client_email: '',
        client_phone: '',
        client_address: '',
        client_type: ClientType.INDIVIDUAL,
        instructing_attorney: '',
        instructing_attorney_email: '',
        instructing_attorney_phone: '',
        instructing_firm: '',
        instructing_firm_ref: '',
        fee_type: FeeType.STANDARD,
        estimated_fee: '',
        fee_cap: '',
        risk_level: RiskLevel.MEDIUM,
        settlement_probability: '',
        expected_completion_date: '',
        vat_exempt: false,
        tags: ''
      });
      setCurrentStep(1);
      setErrors({});
      
    } catch (error) {
      console.error('Error creating matter:', error);
      toast.error('Failed to create matter');
    } finally {
      console.debug('[NewMatterModal] Submit finished, resetting loading state');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.debug('[NewMatterModal] isOpen changed', { isOpen });
  }, [isOpen]);

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Basic Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Matter Title *
        </label>
        <Input
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Smith v Jones Commercial Dispute"
          error={errors.title}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Matter Type *
        </label>
        <select
          value={formData.matter_type}
          onChange={(e) => handleInputChange('matter_type', e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent"
        >
          <option value="">Select matter type</option>
          {MATTER_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {errors.matter_type && (
          <p className="mt-1 text-sm text-red-600">{errors.matter_type}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Brief description of the matter"
          rows={3}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Client Name *
        </label>
        <Input
          value={formData.client_name}
          onChange={(e) => handleInputChange('client_name', e.target.value)}
          placeholder="Client or company name"
          error={errors.client_name}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Instructing Attorney *
        </label>
        <Input
          value={formData.instructing_attorney}
          onChange={(e) => handleInputChange('instructing_attorney', e.target.value)}
          placeholder="Name of instructing attorney"
          error={errors.instructing_attorney}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Client Type
          </label>
          <select
            value={formData.client_type}
            onChange={(e) => handleInputChange('client_type', e.target.value as ClientType)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent"
          >
            <option value={ClientType.INDIVIDUAL}>Individual</option>
            <option value={ClientType.COMPANY}>Company</option>
            <option value={ClientType.TRUST}>Trust</option>
            <option value={ClientType.GOVERNMENT}>Government</option>
            <option value={ClientType.NGO}>NGO</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Bar Association
          </label>
          <select
            value={formData.bar}
            onChange={(e) => handleInputChange('bar', e.target.value as BarAssociation)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent"
          >
            <option value={BarAssociation.JOHANNESBURG}>Johannesburg Bar</option>
            <option value={BarAssociation.CAPE_TOWN}>Cape Town Bar</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Client Email
        </label>
        <Input
          type="email"
          value={formData.client_email}
          onChange={(e) => handleInputChange('client_email', e.target.value)}
          placeholder="client@example.com"
          error={errors.client_email}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Client Phone
        </label>
        <Input
          value={formData.client_phone}
          onChange={(e) => handleInputChange('client_phone', e.target.value)}
          placeholder="+27 11 123 4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Client Address
        </label>
        <textarea
          value={formData.client_address}
          onChange={(e) => handleInputChange('client_address', e.target.value)}
          placeholder="Full address"
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Instructing Firm
        </label>
        <Input
          value={formData.instructing_firm}
          onChange={(e) => handleInputChange('instructing_firm', e.target.value)}
          placeholder="Law firm name"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Instructing Attorney Email
          </label>
          <Input
            type="email"
            value={formData.instructing_attorney_email}
            onChange={(e) => handleInputChange('instructing_attorney_email', e.target.value)}
            placeholder="attorney@firm.com"
            error={errors.instructing_attorney_email}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Instructing Attorney Phone
          </label>
          <Input
            value={formData.instructing_attorney_phone}
            onChange={(e) => handleInputChange('instructing_attorney_phone', e.target.value)}
            placeholder="+27 11 123 4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Firm Reference
        </label>
        <Input
          value={formData.instructing_firm_ref}
          onChange={(e) => handleInputChange('instructing_firm_ref', e.target.value)}
          placeholder="Internal reference number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Court Case Number
        </label>
        <Input
          value={formData.court_case_number}
          onChange={(e) => handleInputChange('court_case_number', e.target.value)}
          placeholder="Case number if applicable"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Fee Structure & Risk</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Fee Type
          </label>
          <select
            value={formData.fee_type}
            onChange={(e) => handleInputChange('fee_type', e.target.value as FeeType)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent"
          >
            <option value={FeeType.STANDARD}>Standard Hourly</option>
            <option value={FeeType.CONTINGENCY}>Contingency</option>
            <option value={FeeType.SUCCESS}>Success Fee</option>
            <option value={FeeType.RETAINER}>Retainer</option>
            <option value={FeeType.PRO_BONO}>Pro Bono</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Risk Level
          </label>
          <select
            value={formData.risk_level}
            onChange={(e) => handleInputChange('risk_level', e.target.value as RiskLevel)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold focus:border-transparent"
          >
            <option value={RiskLevel.LOW}>Low Risk</option>
            <option value={RiskLevel.MEDIUM}>Medium Risk</option>
            <option value={RiskLevel.HIGH}>High Risk</option>
            <option value={RiskLevel.CRITICAL}>Critical Risk</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Estimated Fee (R)
          </label>
          <Input
            type="number"
            value={formData.estimated_fee}
            onChange={(e) => handleInputChange('estimated_fee', e.target.value)}
            placeholder="0"
            error={errors.estimated_fee}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Fee Cap (R)
          </label>
          <Input
            type="number"
            value={formData.fee_cap}
            onChange={(e) => handleInputChange('fee_cap', e.target.value)}
            placeholder="Optional maximum fee"
            error={errors.fee_cap}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Settlement Probability (%)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.settlement_probability}
            onChange={(e) => handleInputChange('settlement_probability', e.target.value)}
            placeholder="0-100"
            error={errors.settlement_probability}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Expected Completion
          </label>
          <Input
            type="date"
            value={formData.expected_completion_date}
            onChange={(e) => handleInputChange('expected_completion_date', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="vat_exempt"
          checked={formData.vat_exempt}
          onChange={(e) => handleInputChange('vat_exempt', e.target.checked)}
          className="rounded border-neutral-300 text-mpondo-gold focus:ring-mpondo-gold"
        />
        <label htmlFor="vat_exempt" className="text-sm text-neutral-700">
          VAT Exempt
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Tags
        </label>
        <Input
          value={formData.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          placeholder="commercial, urgent, high-value (comma separated)"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Separate multiple tags with commas
        </p>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBody>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-mpondo-gold" />
            <h2 className="text-xl font-semibold text-neutral-900">New Matter</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep
                      ? 'bg-mpondo-gold text-white'
                      : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step < currentStep ? 'bg-green-500' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="max-h-96 overflow-y-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isLoading}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            {currentStep < 3 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                type="button"
                onClickCapture={(e) => {
                  console.debug('[NewMatterModal] onClickCapture fired for Create Matter', { eventPhase: e.eventPhase, isLoading, currentStep });
                }}
                onClick={(e) => {
                  console.debug('[NewMatterModal] Create Matter button clicked - event:', e);
                  console.debug('[NewMatterModal] Button state:', { isLoading, currentStep });
                  console.debug('[NewMatterModal] Form data at click:', formData);
                  handleSubmit();
                }}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Matter</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
};