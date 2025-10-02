import React, { useState } from 'react';
import { CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent } from '../design-system/components';
import { BarAssociation, FeeType, RiskLevel, ClientType, Matter, NewMatterForm } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { matterApiService } from '../services/api';
import { authService } from '../services/auth.service';
import { toast } from 'react-hot-toast';

// Import section components
import { BasicInfoSection } from '../components/matters/workbench/BasicInfoSection';
import { PartiesSection } from '../components/matters/workbench/PartiesSection';
import { FeeStructureSection } from '../components/matters/workbench/FeeStructureSection';
import { RiskAssessmentSection } from '../components/matters/workbench/RiskAssessmentSection';
import { ServicesSection } from '../components/matters/workbench/ServicesSection';

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

interface MatterWorkbenchPageProps {
  onNavigateBack?: () => void;
  onMatterCreated?: (matter: Matter) => void;
}

const defaultFormData: NewMatterFormData = {
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
};

export const MatterWorkbenchPage: React.FC<MatterWorkbenchPageProps> = ({
  onNavigateBack,
  onMatterCreated
}) => {
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<NewMatterFormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof NewMatterFormData, string>>>({});
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sectionValidation, setSectionValidation] = useState<boolean[]>([false, false, false, false, false]);

  const sections = [
    { id: 'basic', title: 'Basic Information', description: 'Matter title, type, and description' },
    { id: 'parties', title: 'Parties', description: 'Client and instructing attorney details' },
    { id: 'fee', title: 'Fee Structure', description: 'Fee arrangement and financial terms' },
    { id: 'risk', title: 'Risk Assessment', description: 'Risk level and expected outcomes' },
    { id: 'services', title: 'Services', description: 'Associated services and categories' },
    { id: 'review', title: 'Review & Submit', description: 'Final review and matter creation' }
  ];

  const handleInputChange = (field: keyof NewMatterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateSection = (sectionIndex: number): boolean => {
    const newErrors: Partial<Record<keyof NewMatterFormData, string>> = {};

    switch (sectionIndex) {
      case 0: // Basic Information
        if (!formData.title.trim()) newErrors.title = 'Matter title is required';
        if (!formData.matter_type) newErrors.matter_type = 'Matter type is required';
        break;
      
      case 1: // Parties
        if (!formData.client_name.trim()) newErrors.client_name = 'Client name is required';
        if (!formData.instructing_attorney.trim()) newErrors.instructing_attorney = 'Instructing attorney is required';
        if (formData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
          newErrors.client_email = 'Invalid email format';
        }
        if (formData.instructing_attorney_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.instructing_attorney_email)) {
          newErrors.instructing_attorney_email = 'Invalid email format';
        }
        break;
      
      case 2: // Fee Structure
        if (formData.estimated_fee && isNaN(Number(formData.estimated_fee))) {
          newErrors.estimated_fee = 'Must be a valid number';
        }
        if (formData.fee_cap && isNaN(Number(formData.fee_cap))) {
          newErrors.fee_cap = 'Must be a valid number';
        }
        break;
      
      case 3: // Risk Assessment
        if (formData.settlement_probability && (isNaN(Number(formData.settlement_probability)) || Number(formData.settlement_probability) < 0 || Number(formData.settlement_probability) > 100)) {
          newErrors.settlement_probability = 'Must be a number between 0 and 100';
        }
        break;
      
      case 4: // Services
        // Services are optional, no validation needed
        break;
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    // Update section validation state
    setSectionValidation(prev => {
      const updated = [...prev];
      updated[sectionIndex] = isValid;
      return updated;
    });

    return isValid;
  };

  const handleSectionChange = (sectionIndex: number) => {
    // Validate current section before allowing navigation
    if (validateSection(currentSection)) {
      setCurrentSection(sectionIndex);
    }
  };

  const handleNext = () => {
    if (validateSection(currentSection) && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a matter');
      return;
    }

    // Validate all sections
    let allValid = true;
    for (let i = 0; i < 5; i++) {
      if (!validateSection(i)) {
        allValid = false;
      }
    }

    if (!allValid) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    // Validate advocate profile
    let practiceNumber = user?.advocate_profile?.practice_number ?? user?.user_metadata?.practice_number;
    if (!practiceNumber) {
      try {
        await authService.refreshSession();
        const refreshed = authService.getCurrentUser();
        practiceNumber = refreshed?.advocate_profile?.practice_number ?? refreshed?.user_metadata?.practice_number;
      } catch (e) {
        console.warn('Auth refresh failed when validating advocate profile:', e);
      }

      if (!practiceNumber) {
        toast.error('Please complete your advocate profile setup first');
        return;
      }
    }

    setIsLoading(true);
    try {
      // Generate reference number
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
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        services: selectedServices
      };

      // Create matter using API service
      const response = await matterApiService.createFromForm(newMatterForm);
      
      if (response.error) {
        if (response.error.code === '23503') {
          throw new Error('Your advocate profile is not set up in the database. Please contact support or complete profile setup.');
        }
        throw new Error(response.error.message);
      }

      if (response.data) {
        toast.success('Matter created successfully');
        onMatterCreated?.(response.data);
        onNavigateBack?.();
      }
    } catch (error) {
      console.error('Error creating matter:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create matter');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSectionContent = () => {
    switch (currentSection) {
      case 0:
        return (
          <BasicInfoSection
            data={{
              title: formData.title,
              description: formData.description,
              matter_type: formData.matter_type,
              court_case_number: formData.court_case_number
            }}
            errors={{
              title: errors.title,
              description: errors.description,
              matter_type: errors.matter_type,
              court_case_number: errors.court_case_number
            }}
            onChange={handleInputChange}
          />
        );
      
      case 1:
        return (
          <PartiesSection
            data={{
              client_name: formData.client_name,
              client_email: formData.client_email,
              client_phone: formData.client_phone,
              client_address: formData.client_address,
              client_type: formData.client_type,
              bar: formData.bar,
              instructing_attorney: formData.instructing_attorney,
              instructing_attorney_email: formData.instructing_attorney_email,
              instructing_attorney_phone: formData.instructing_attorney_phone,
              instructing_firm: formData.instructing_firm,
              instructing_firm_ref: formData.instructing_firm_ref
            }}
            errors={{
              client_name: errors.client_name,
              client_email: errors.client_email,
              client_phone: errors.client_phone,
              client_address: errors.client_address,
              instructing_attorney: errors.instructing_attorney,
              instructing_attorney_email: errors.instructing_attorney_email,
              instructing_attorney_phone: errors.instructing_attorney_phone,
              instructing_firm: errors.instructing_firm,
              instructing_firm_ref: errors.instructing_firm_ref
            }}
            onChange={handleInputChange}
          />
        );
      
      case 2:
        return (
          <FeeStructureSection
            formData={{
              fee_type: formData.fee_type,
              estimated_fee: formData.estimated_fee,
              fee_cap: formData.fee_cap,
              vat_exempt: formData.vat_exempt,
              tags: formData.tags
            }}
            errors={{
              estimated_fee: errors.estimated_fee,
              fee_cap: errors.fee_cap,
              tags: errors.tags
            }}
            onInputChange={(field, value) => handleInputChange(field as keyof NewMatterFormData, value)}
          />
        );
      
      case 3:
        return (
          <RiskAssessmentSection
            formData={{
              risk_level: formData.risk_level,
              settlement_probability: formData.settlement_probability,
              expected_completion_date: formData.expected_completion_date
            }}
            errors={{
              settlement_probability: errors.settlement_probability,
              expected_completion_date: errors.expected_completion_date
            }}
            onInputChange={(field, value) => handleInputChange(field as keyof NewMatterFormData, value)}
          />
        );
      
      case 4:
        return (
          <ServicesSection
            selectedServices={selectedServices}
            onServicesChange={setSelectedServices}
          />
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Review & Submit</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Review all information before creating the matter
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-neutral-900">Basic Information</h4>
                  <div className="mt-2 text-sm text-neutral-600">
                    <p><strong>Title:</strong> {formData.title}</p>
                    <p><strong>Type:</strong> {formData.matter_type}</p>
                    {formData.description && <p><strong>Description:</strong> {formData.description}</p>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-neutral-900">Client Information</h4>
                  <div className="mt-2 text-sm text-neutral-600">
                    <p><strong>Name:</strong> {formData.client_name}</p>
                    <p><strong>Type:</strong> {formData.client_type}</p>
                    {formData.client_email && <p><strong>Email:</strong> {formData.client_email}</p>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-neutral-900">Fee Structure</h4>
                  <div className="mt-2 text-sm text-neutral-600">
                    <p><strong>Fee Type:</strong> {formData.fee_type}</p>
                    {formData.estimated_fee && <p><strong>Estimated Fee:</strong> R{formData.estimated_fee}</p>}
                    <p><strong>VAT Exempt:</strong> {formData.vat_exempt ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-neutral-900">Risk Assessment</h4>
                  <div className="mt-2 text-sm text-neutral-600">
                    <p><strong>Risk Level:</strong> {formData.risk_level}</p>
                    {formData.settlement_probability && <p><strong>Settlement Probability:</strong> {formData.settlement_probability}%</p>}
                  </div>
                </div>
              </div>
            </div>
            
            {selectedServices.length > 0 && (
              <div>
                <h4 className="font-medium text-neutral-900">Selected Services</h4>
                <p className="mt-2 text-sm text-neutral-600">
                  {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Progress</h2>
                <nav className="space-y-2">
                  {sections.map((section, index) => {
                    const isCompleted = sectionValidation[index];
                    const isCurrent = index === currentSection;
                    const hasErrors = index < 5 && Object.keys(errors).some(key => {
                      switch (index) {
                        case 0: return ['title', 'matter_type', 'description', 'court_case_number'].includes(key);
                        case 1: return ['client_name', 'client_email', 'client_phone', 'client_address', 'instructing_attorney', 'instructing_attorney_email', 'instructing_attorney_phone', 'instructing_firm', 'instructing_firm_ref'].includes(key);
                        case 2: return ['fee_type', 'estimated_fee', 'fee_cap', 'tags'].includes(key);
                        case 3: return ['risk_level', 'settlement_probability', 'expected_completion_date'].includes(key);
                        case 4: return false; // Services have no validation errors
                        default: return false;
                      }
                    });

                    return (
                      <button
                        key={section.id}
                        onClick={() => handleSectionChange(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isCurrent
                            ? 'bg-mpondo-gold text-white'
                            : isCompleted
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : hasErrors
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {hasErrors ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className={`h-5 w-5 ${isCurrent ? 'text-white' : 'text-neutral-400'}`} />
                          )}
                          <div>
                            <div className="font-medium">{section.title}</div>
                            <div className={`text-xs ${
                              isCurrent ? 'text-white/80' : 'text-neutral-500'
                            }`}>
                              {section.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900">
                    {sections[currentSection].title}
                  </h2>
                  <p className="text-neutral-600 mt-1">
                    {sections[currentSection].description}
                  </p>
                </div>

                {/* Section Content */}
                <div className="mb-8">
                  {renderSectionContent()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentSection === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={currentSection === sections.length - 1 ? handleSubmit : handleNext}
                    disabled={isLoading}
                    loading={isLoading && currentSection === sections.length - 1}
                  >
                    {currentSection === sections.length - 1 ? 'Create Matter' : 'Next'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatterWorkbenchPage;