import React, { useEffect, useState, useMemo } from 'react';
import { X, AlertTriangle, Save, FileText, RotateCcw, Library, Bookmark, Mic, Brain, Sparkles } from 'lucide-react';
import { Button, Card, CardContent, Input, Modal, ModalBody, ModalFooter, Icon } from '../../design-system/components';
import { matterApiService } from '../../services/api';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { BarAssociation, FeeType, RiskLevel, ClientType, MatterStatus } from '../../types';
import type { Matter, NewMatterForm } from '../../types';
import { TemplateLibraryModal, SaveTemplateModal } from './templates';
import type { MatterTemplateData } from '../../types/matter-templates';
import { templateSuggestionService, type TemplateSuggestion, type VoiceTemplateAnalysis } from '../../services/template-suggestion.service';
import { speechToTextService } from '../../services/speech-to-text.service';

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

// Export prepopulation data type for use by other components
export interface MatterPrepopulationData {
  title?: string;
  description?: string;
  matter_type?: string;
  court_case_number?: string;
  bar?: BarAssociation;
  client_name?: string;
  client?: string; // Alias for client_name
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_type?: ClientType;
  instructing_attorney?: string;
  attorney?: string; // Alias for instructing_attorney
  instructing_attorney_email?: string;
  instructing_attorney_phone?: string;
  instructing_firm?: string;
  firm?: string; // Alias for instructing_firm
  instructing_firm_ref?: string;
  fee_type?: FeeType;
  estimated_fee?: string | number;
  fee_cap?: string | number;
  risk_level?: RiskLevel;
  settlement_probability?: string | number;
  expected_completion_date?: string;
  vat_exempt?: boolean;
  tags?: string | string[];
  // Voice integration specific fields
  work_type?: string; // Maps to matter_type
  duration?: string; // Could be used for estimated_fee calculation
  billable?: boolean; // Maps to fee_type
}

interface NewMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatterCreated?: (matter: Matter) => void;
  initialData?: MatterPrepopulationData; // New prop for prepopulation
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

// Smart field mapping function
const normalizeInitialData = (initialData?: MatterPrepopulationData): Partial<NewMatterFormData> => {
  if (!initialData) return {};

  const normalized: Partial<NewMatterFormData> = {};

  // Direct field mappings
  if (initialData.title) normalized.title = initialData.title;
  if (initialData.description) normalized.description = initialData.description;
  if (initialData.matter_type) normalized.matter_type = initialData.matter_type;
  if (initialData.court_case_number) normalized.court_case_number = initialData.court_case_number;
  if (initialData.bar) normalized.bar = initialData.bar;
  if (initialData.client_email) normalized.client_email = initialData.client_email;
  if (initialData.client_phone) normalized.client_phone = initialData.client_phone;
  if (initialData.client_address) normalized.client_address = initialData.client_address;
  if (initialData.client_type) normalized.client_type = initialData.client_type;
  if (initialData.instructing_attorney_email) normalized.instructing_attorney_email = initialData.instructing_attorney_email;
  if (initialData.instructing_attorney_phone) normalized.instructing_attorney_phone = initialData.instructing_attorney_phone;
  if (initialData.instructing_firm_ref) normalized.instructing_firm_ref = initialData.instructing_firm_ref;
  if (initialData.fee_type) normalized.fee_type = initialData.fee_type;
  if (initialData.risk_level) normalized.risk_level = initialData.risk_level;
  if (initialData.expected_completion_date) normalized.expected_completion_date = initialData.expected_completion_date;
  if (initialData.vat_exempt !== undefined) normalized.vat_exempt = initialData.vat_exempt;

  // Handle aliases and smart mappings
  if (initialData.client_name) normalized.client_name = initialData.client_name;
  else if (initialData.client) normalized.client_name = initialData.client;

  if (initialData.instructing_attorney) normalized.instructing_attorney = initialData.instructing_attorney;
  else if (initialData.attorney) normalized.instructing_attorney = initialData.attorney;

  if (initialData.instructing_firm) normalized.instructing_firm = initialData.instructing_firm;
  else if (initialData.firm) normalized.instructing_firm = initialData.firm;

  // Voice integration specific mappings
  if (initialData.work_type && !normalized.matter_type) {
    // Map common work types to matter types
    const workTypeMapping: Record<string, string> = {
      'research': 'Commercial Litigation',
      'drafting': 'Contract Law',
      'consultation': 'Other',
      'court appearance': 'Commercial Litigation',
      'negotiation': 'Contract Law',
      'due diligence': 'Commercial Litigation'
    };
    normalized.matter_type = workTypeMapping[initialData.work_type.toLowerCase()] || 'Other';
  }

  // Handle numeric fields
  if (initialData.estimated_fee !== undefined) {
    normalized.estimated_fee = String(initialData.estimated_fee);
  }
  if (initialData.fee_cap !== undefined) {
    normalized.fee_cap = String(initialData.fee_cap);
  }
  if (initialData.settlement_probability !== undefined) {
    normalized.settlement_probability = String(initialData.settlement_probability);
  }

  // Handle tags (array or string)
  if (initialData.tags) {
    if (Array.isArray(initialData.tags)) {
      normalized.tags = initialData.tags.join(', ');
    } else {
      normalized.tags = initialData.tags;
    }
  }

  // Handle billable status mapping to fee type
  if (initialData.billable !== undefined && !normalized.fee_type) {
    normalized.fee_type = initialData.billable ? FeeType.STANDARD : FeeType.PRO_BONO;
  }

  return normalized;
};

export const NewMatterModal: React.FC<NewMatterModalProps> = ({
  isOpen,
  onClose,
  onMatterCreated,
  initialData
}) => {
  const { user } = useAuth();
  
  // Default form data
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

  // Memoize the initial form data to prevent unnecessary re-renders
  const initialFormData = useMemo(() => {
    const normalized = normalizeInitialData(initialData);
    return { ...defaultFormData, ...normalized };
  }, [initialData]);

  const [formData, setFormData] = useState<NewMatterFormData>(initialFormData);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof NewMatterFormData, string>>>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Conflict check state
  const [conflictCheckResults, setConflictCheckResults] = useState<{
    hasConflict: boolean;
    conflictingMatters: Matter[];
    conflictReason?: string;
  } | null>(null);
  const [manualConflictCheck, setManualConflictCheck] = useState('');
  const [isPerformingConflictCheck, setIsPerformingConflictCheck] = useState(false);
  const [conflictCheckCompleted, setConflictCheckCompleted] = useState(false);

  // Template functionality state
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Voice-powered template suggestions state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceTemplateAnalysis | null>(null);
  const [showVoiceSuggestions, setShowVoiceSuggestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Service selection state
  const [serviceCategories, setServiceCategories] = useState<unknown[]>([]);
  const [services, setServices] = useState<unknown[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Track which fields were prepopulated for visual indicators
  const prepopulatedFields = useMemo(() => {
    if (!initialData) return new Set<string>();
    const normalized = normalizeInitialData(initialData);
    return new Set(Object.keys(normalized));
  }, [initialData]);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      const newFormData = { ...defaultFormData, ...normalizeInitialData(initialData) };
      setFormData(newFormData);
      setCurrentStep(1);
      setErrors({});
      setSelectedServices([]);
      // Reset conflict check state
      setConflictCheckResults(null);
      setManualConflictCheck('');
      setConflictCheckCompleted(false);
    }
  }, [isOpen, initialData]);

  // Fetch services when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      
      // Fetch service categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
      
      if (categoriesError) {
        console.error('Error fetching service categories:', categoriesError);
        toast.error('Failed to load service categories');
        return;
      }
      
      // Fetch services with their categories
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          name,
          description,
          category_id,
          service_categories (
            id,
            name
          )
        `)
        .order('name');
      
      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        toast.error('Failed to load services');
        return;
      }
      
      setServiceCategories(categoriesData || []);
      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  };

  // Clear prepopulated data function
  const handleClearPrepopulatedData = () => {
    setFormData(defaultFormData);
    setErrors({});
  };

  // Check if any data was prepopulated
  const hasPrepopulatedData = prepopulatedFields.size > 0;

  // Helper function to render input with prepopulation indicator
  const renderInputWithIndicator = (
    field: keyof NewMatterFormData,
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
          value={formData[field] as string}
          onChange={(e) => handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
    field: keyof NewMatterFormData,
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
          value={formData[field] as string}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

  const handleInputChange = (field: keyof NewMatterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Template functionality handlers
  const handleTemplateSelect = (templateData: MatterTemplateData) => {
    const normalized = normalizeInitialData(templateData);
    setFormData(prev => ({ ...prev, ...normalized }));
    setShowTemplateLibrary(false);
    toast.success('Template applied successfully');
  };

  const handleSaveAsTemplate = () => {
    // Check if there's meaningful data to save
    const hasData = formData.title || formData.matter_type || formData.client_name || 
                   formData.instructing_attorney || formData.fee_type !== FeeType.STANDARD;
    
    if (!hasData) {
      toast.error('Please fill in some form data before saving as template');
      return;
    }
    
    setShowSaveTemplate(true);
  };

  const convertFormDataToTemplateData = (): MatterTemplateData => {
    return {
      matterTitle: formData.title,
      matterType: formData.matter_type,
      description: formData.description,
      courtCaseNumber: formData.court_case_number,
      bar: formData.bar,
      clientName: formData.client_name,
      clientEmail: formData.client_email,
      clientPhone: formData.client_phone,
      clientAddress: formData.client_address,
      clientType: formData.client_type,
      instructingAttorney: formData.instructing_attorney,
      instructingAttorneyEmail: formData.instructing_attorney_email,
      instructingAttorneyPhone: formData.instructing_attorney_phone,
      instructingFirm: formData.instructing_firm,
      instructingFirmRef: formData.instructing_firm_ref,
      feeType: formData.fee_type,
      estimatedFee: formData.estimated_fee,
      feeCap: formData.fee_cap,
      riskLevel: formData.risk_level,
      settlementProbability: formData.settlement_probability,
      expectedCompletionDate: formData.expected_completion_date,
      vatExempt: formData.vat_exempt,
      tags: formData.tags
    };
  };

  // Voice functionality handlers
  const handleVoiceInput = async () => {
    if (isListening) {
      // Stop listening
      speechToTextService.stopListening();
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      setVoiceTranscription('');
      setVoiceAnalysis(null);

      // Start voice recognition
      const transcription = await speechToTextService.startListening({
        onTranscript: (transcript) => {
          setVoiceTranscription(transcript);
        },
        onError: (error) => {
          console.error('Voice recognition error:', error);
          toast.error('Voice recognition failed. Please try again.');
          setIsListening(false);
        }
      });

      if (transcription) {
        setIsListening(false);
        setIsAnalyzing(true);
        
        // Analyze transcription for template suggestions
        const analysis = await templateSuggestionService.analyzeVoiceForTemplates(transcription);
        setVoiceAnalysis(analysis);
        
        if (analysis.suggestions.length > 0) {
          setShowVoiceSuggestions(true);
          toast.success(`Found ${analysis.suggestions.length} template suggestions!`);
        } else if (Object.keys(analysis.extractedMatterData).length > 0) {
          // Apply extracted data directly if no templates found
          handleApplyVoiceData(analysis.extractedMatterData);
          toast.success('Applied voice data to form');
        } else {
          toast('No template suggestions found, but transcription captured');
        }
        
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Voice input error:', error);
      toast.error('Voice input failed. Please try again.');
      setIsListening(false);
      setIsAnalyzing(false);
    }
  };

  const handleApplyVoiceData = (extractedData: unknown) => {
    setFormData(prev => ({
      ...prev,
      ...extractedData
    }));
  };

  const handleApplyTemplateSuggestion = (suggestion: TemplateSuggestion) => {
    const templateData = suggestion.template.data;
    
    setFormData(prev => ({
      ...prev,
      title: templateData.matterTitle || prev.title,
      description: templateData.description || prev.description,
      matter_type: templateData.matterType || prev.matter_type,
      court_case_number: templateData.courtCaseNumber || prev.court_case_number,
      bar: templateData.bar || prev.bar,
      client_name: templateData.clientName || prev.client_name,
      client_email: templateData.clientEmail || prev.client_email,
      client_phone: templateData.clientPhone || prev.client_phone,
      client_address: templateData.clientAddress || prev.client_address,
      client_type: templateData.clientType || prev.client_type,
      instructing_attorney: templateData.instructingAttorney || prev.instructing_attorney,
      instructing_attorney_email: templateData.instructingAttorneyEmail || prev.instructing_attorney_email,
      instructing_attorney_phone: templateData.instructingAttorneyPhone || prev.instructing_attorney_phone,
      instructing_firm: templateData.instructingFirm || prev.instructing_firm,
      instructing_firm_ref: templateData.instructingFirmRef || prev.instructing_firm_ref,
      fee_type: templateData.feeType || prev.fee_type,
      estimated_fee: templateData.estimatedFee || prev.estimated_fee,
      fee_cap: templateData.feeCap || prev.fee_cap,
      risk_level: templateData.riskLevel || prev.risk_level,
      settlement_probability: templateData.settlementProbability || prev.settlement_probability,
      expected_completion_date: templateData.expectedCompletionDate || prev.expected_completion_date,
      vat_exempt: templateData.vatExempt !== undefined ? templateData.vatExempt : prev.vat_exempt,
      tags: templateData.tags || prev.tags
    }));

    // Apply any voice-extracted data on top of template
    if (voiceAnalysis?.extractedMatterData) {
      handleApplyVoiceData(voiceAnalysis.extractedMatterData);
    }

    setShowVoiceSuggestions(false);
    toast.success(`Applied template: ${suggestion.template.name}`);
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

  // Perform conflict check
  const performConflictCheck = async () => {
    if (!user?.id || !formData.client_name.trim()) {
      toast.error('Client name is required for conflict check');
      return;
    }

    setIsPerformingConflictCheck(true);
    try {
      const response = await matterApiService.performConflictCheck(
        user.id,
        formData.client_name.trim(),
        [] // Could extract opposing parties from description in future
      );

      if (response.error) {
        toast.error('Failed to perform conflict check');
        console.error('Conflict check error:', response.error);
        return;
      }

      setConflictCheckResults(response.data);
      setConflictCheckCompleted(true);
      
      if (response.data?.hasConflict) {
        toast.warning('Potential conflicts detected. Please review and provide manual verification.');
      } else {
        toast.success('No conflicts detected.');
      }
    } catch (error) {
      console.error('Error performing conflict check:', error);
      toast.error('Failed to perform conflict check');
    } finally {
      setIsPerformingConflictCheck(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4)); // Updated to 4 steps
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
    
    // Validate conflict check step
    if (!conflictCheckCompleted) {
      setCurrentStep(4);
      toast.error('Please complete the conflict check before creating the matter');
      return;
    }
    
    if (!manualConflictCheck.trim()) {
      setCurrentStep(4);
      toast.error('Please describe the manual conflict checks performed');
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
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        services: selectedServices // Include selected services
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
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Brief description of the matter"
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : prepopulatedFields.has('description') ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description}</p>
        )}
      </div>

      {renderInputWithIndicator('client_name', 'Client Name', 'text', 'Client or company name', true)}

      {renderInputWithIndicator('instructing_attorney', 'Instructing Attorney', 'text', 'Name of instructing attorney', true)}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {renderSelectWithIndicator('client_type', 'Client Type', [
            { value: ClientType.INDIVIDUAL, label: 'Individual' },
            { value: ClientType.COMPANY, label: 'Company' },
            { value: ClientType.TRUST, label: 'Trust' },
            { value: ClientType.GOVERNMENT, label: 'Government' },
            { value: ClientType.NGO, label: 'NGO' }
          ])}
        </div>

        <div>
          {renderSelectWithIndicator('bar', 'Bar Association', [
            { value: BarAssociation.JOHANNESBURG, label: 'Johannesburg Bar' },
            { value: BarAssociation.CAPE_TOWN, label: 'Cape Town Bar' }
          ])}
        </div>
      </div>

      {renderInputWithIndicator('client_email', 'Client Email', 'email', 'client@example.com')}

      {renderInputWithIndicator('client_phone', 'Client Phone', 'text', '+27 11 123 4567')}

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

      {/* Service Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Associated Services
        </label>
        {loadingServices ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mpondo-gold"></div>
            <span className="ml-2 text-sm text-neutral-600">Loading services...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto border border-neutral-200 rounded-md p-3">
            {serviceCategories.map(category => {
              const categoryServices = services.filter(service => service.category_id === category.id);
              if (categoryServices.length === 0) return null;
              
              return (
                <div key={category.id} className="space-y-2">
                  <h4 className="font-medium text-sm text-neutral-800 border-b border-neutral-200 pb-1">
                    {category.name}
                  </h4>
                  <div className="space-y-1 pl-2">
                    {categoryServices.map(service => (
                      <label key={service.id} className="flex items-start space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices(prev => [...prev, service.id]);
                            } else {
                              setSelectedServices(prev => prev.filter(id => id !== service.id));
                            }
                          }}
                          className="mt-0.5 rounded border-neutral-300 text-mpondo-gold focus:ring-mpondo-gold"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-neutral-700">{service.name}</span>
                          {service.description && (
                            <p className="text-xs text-neutral-500 mt-0.5">{service.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            {serviceCategories.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-4">
                No services available. Please contact your administrator.
              </p>
            )}
          </div>
        )}
        <p className="mt-1 text-xs text-neutral-500">
          Select the services that will be provided for this matter
        </p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Conflict Check</h3>
      
      {/* Automated Conflict Check */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Automated Conflict Check</h4>
          <Button
            onClick={performConflictCheck}
            disabled={isPerformingConflictCheck || !formData.client_name.trim()}
            variant="outline"
            size="sm"
          >
            {isPerformingConflictCheck ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mpondo-gold mr-2"></div>
                Checking...
              </>
            ) : (
              'Run Conflict Check'
            )}
          </Button>
        </div>
        
        {!conflictCheckCompleted && (
          <p className="text-sm text-gray-600">
            Click "Run Conflict Check" to automatically scan for potential conflicts with existing matters.
          </p>
        )}
        
        {conflictCheckCompleted && conflictCheckResults && (
          <div className={`p-3 rounded-md ${
            conflictCheckResults.hasConflict 
              ? 'bg-amber-50 border border-amber-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-center">
              {conflictCheckResults.hasConflict ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
              ) : (
                <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center mr-2">
                  <div className="h-2 w-2 bg-white rounded-full"></div>
                </div>
              )}
              <span className={`font-medium ${
                conflictCheckResults.hasConflict ? 'text-amber-800' : 'text-green-800'
              }`}>
                {conflictCheckResults.hasConflict 
                  ? `Potential conflicts detected: ${conflictCheckResults.conflictReason}`
                  : 'No conflicts detected'
                }
              </span>
            </div>
            
            {conflictCheckResults.hasConflict && conflictCheckResults.conflictingMatters.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-amber-800 mb-2">Conflicting matters:</p>
                <ul className="space-y-1">
                  {conflictCheckResults.conflictingMatters.map((matter) => (
                    <li key={matter.id} className="text-sm text-amber-700">
                      • {matter.title} (Client: {matter.client_name})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Mandatory Manual Verification */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">Manual Conflict Verification (Required)</h4>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-blue-800">
            What manual conflict checks were also performed? *
          </label>
          <textarea
            value={manualConflictCheck}
            onChange={(e) => setManualConflictCheck(e.target.value)}
            placeholder="Describe the manual conflict checks you performed (e.g., checked client database, reviewed previous matters, consulted with colleagues, etc.)"
            rows={4}
            className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required
          />
          {!manualConflictCheck.trim() && (
            <p className="text-sm text-blue-700">
              This field is mandatory. Please describe the manual conflict checks you performed to ensure professional compliance.
            </p>
          )}
        </div>
      </div>
      
      {/* Professional Reminder */}
      <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Professional Reminder:</strong> Automated conflict checks are a tool to assist you, but they cannot replace your professional judgment and due diligence. Always perform manual verification to ensure compliance with professional conduct rules.
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
            {hasPrepopulatedData && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <RotateCcw className="w-3 h-3 mr-1" />
                Pre-filled data
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVoiceInput}
              disabled={isAnalyzing}
              className={`inline-flex items-center px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                isListening 
                  ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' 
                  : isAnalyzing
                  ? 'text-blue-600 bg-blue-50 border-blue-200'
                  : 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100'
              }`}
              title={isListening ? 'Stop voice input' : isAnalyzing ? 'Analyzing...' : 'Voice-powered templates'}
            >
              {isListening ? (
                <Icon icon={Mic} className="w-4 h-4 mr-1 animate-pulse" />
              ) : isAnalyzing ? (
                <Icon icon={Brain} className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Icon icon={Sparkles} className="w-4 h-4 mr-1" />
              )}
              {isListening ? 'Listening...' : isAnalyzing ? 'Analyzing...' : 'Voice'}
            </button>
            <button
              onClick={() => setShowTemplateLibrary(true)}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
              title="Load from template"
            >
              <Icon icon={Library} className="w-4 h-4 mr-1" />
              Templates
            </button>
            <button
              onClick={handleSaveAsTemplate}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
              title="Save as template"
            >
              <Icon icon={Bookmark} className="w-4 h-4 mr-1" />
              Save Template
            </button>
            {hasPrepopulatedData && (
              <button
                onClick={handleClearPrepopulatedData}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                <Icon icon={X} className="w-4 h-4 mr-1" noGradient />
                Clear Pre-filled
              </button>
            )}
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <Icon icon={X} className="h-6 w-6" noGradient />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
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
                {step < 4 && (
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
          {currentStep === 4 && renderStep4()}
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
            
            {currentStep < 4 ? (
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

      {/* Template Modals */}
      <TemplateLibraryModal
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onTemplateSelect={handleTemplateSelect}
        currentMatterData={convertFormDataToTemplateData()}
      />

      <SaveTemplateModal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        sourceData={convertFormDataToTemplateData()}
        onTemplateSaved={(templateId) => {
          setShowSaveTemplate(false);
          toast.success('Template saved successfully');
        }}
      />

      {/* Voice Transcription Display */}
      {voiceTranscription && (
        <div className="fixed bottom-4 right-4 max-w-md bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Voice Transcription</h4>
            <button
              onClick={() => setVoiceTranscription('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-3">{voiceTranscription}</p>
          {voiceAnalysis && (
            <div className="text-xs text-gray-500">
              Confidence: {Math.round(voiceAnalysis.confidence * 100)}%
            </div>
          )}
        </div>
      )}

      {/* Voice Template Suggestions Modal */}
      {showVoiceSuggestions && voiceAnalysis && (
        <Modal isOpen={true} onClose={() => setShowVoiceSuggestions(false)} size="lg">
          <ModalBody>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Voice-Powered Template Suggestions</h3>
              </div>

              {voiceAnalysis.extractedData && Object.keys(voiceAnalysis.extractedData).length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Extracted Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(voiceAnalysis.extractedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-blue-700 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="text-blue-900 font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {voiceAnalysis.suggestions.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Recommended Templates</h4>
                  {voiceAnalysis.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer"
                      onClick={() => handleApplyTemplateSuggestion(suggestion)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{suggestion.templateName}</h5>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {Math.round(suggestion.confidence * 100)}% match
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            suggestion.confidence > 0.8 ? 'bg-green-500' :
                            suggestion.confidence > 0.6 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.matchedKeywords.map((keyword, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No template suggestions found for this voice input.</p>
                  <p className="text-sm text-gray-500 mt-1">Try describing your matter type or legal area.</p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="secondary"
                onClick={() => {
                  if (voiceAnalysis?.extractedData) {
                    handleApplyVoiceData(voiceAnalysis.extractedData);
                  }
                  setShowVoiceSuggestions(false);
                }}
                disabled={!voiceAnalysis?.extractedData || Object.keys(voiceAnalysis.extractedData).length === 0}
              >
                Apply Extracted Data Only
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowVoiceSuggestions(false)}
              >
                Close
              </Button>
            </div>
          </ModalFooter>
        </Modal>
      )}
    </Modal>
  );
};