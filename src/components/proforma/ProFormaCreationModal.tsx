import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, DollarSign, AlertCircle, Settings } from 'lucide-react';
import { Button, Input, Modal, ModalBody, ModalFooter } from '../../design-system/components';
import { MatterService } from '../../services/api/matters.service';
import type { ProFormaGenerationRequest, Matter } from '../../types';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface ProFormaCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProFormaGenerationRequest) => Promise<void>;
  onProFormaCreated?: (data: ProFormaGenerationRequest) => Promise<void>;
  isLoading?: boolean;
}

export const ProFormaCreationModal: React.FC<ProFormaCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ProFormaGenerationRequest>({
    matter_id: '',
    fee_narrative: '',
    total_amount: 0,
    valid_until: '',
    quote_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [matters, setMatters] = useState<Matter[]>([]);
  const [loadingMatters, setLoadingMatters] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Service selection state
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Load matters when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMatters();
      loadServices();
      // Reset form when modal opens
      setFormData({
        matter_id: '',
        fee_narrative: '',
        total_amount: 0,
        valid_until: '',
        quote_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setSelectedServices([]);
      setErrors({});
    }
  }, [isOpen]);

  const loadMatters = async () => {
    setLoadingMatters(true);
    try {
      const response = await MatterService.getMatters({ 
        page: 1, 
        pageSize: 100,
        status: ['active', 'pending'],
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      setMatters(response.data || []);
    } catch (error) {
      console.error('Error loading matters:', error);
      toast.error('Failed to load matters');
      setMatters([]);
    } finally {
      setLoadingMatters(false);
    }
  };

  const loadServices = async () => {
    setLoadingServices(true);
    try {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.matter_id) {
      newErrors.matter_id = 'Please select a matter';
    }

    if (!formData.fee_narrative.trim()) {
      newErrors.fee_narrative = 'Fee narrative is required';
    } else if (formData.fee_narrative.trim().length < 10) {
      newErrors.fee_narrative = 'Fee narrative must be at least 10 characters';
    }

    if (!formData.total_amount || formData.total_amount <= 0) {
      newErrors.total_amount = 'Total amount must be greater than 0';
    }

    if (!formData.valid_until) {
      newErrors.valid_until = 'Valid until date is required';
    } else {
      const validUntilDate = new Date(formData.valid_until);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (validUntilDate <= today) {
        newErrors.valid_until = 'Valid until date must be in the future';
      }
    }

    if (!formData.quote_date) {
      newErrors.quote_date = 'Quote date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    try {
      // Include selected services in the submission
      const submissionData = {
        ...formData,
        services: selectedServices
      };
      await onSubmit(submissionData);
      onClose();
      // Reset form after successful submission
      setFormData({
        matter_id: '',
        fee_narrative: '',
        total_amount: 0,
        valid_until: '',
        quote_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting pro forma:', error);
      // Error handling is done in the parent component
    }
  };

  const handleInputChange = (field: keyof ProFormaGenerationRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateFeeNarrativeFromServices = () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service to generate fee narrative');
      return;
    }

    const selectedServiceObjects = services.filter(service => 
      selectedServices.includes(service.id)
    );

    // Group services by category
    const servicesByCategory = selectedServiceObjects.reduce((acc, service) => {
      const categoryName = service.service_categories?.name || 'Other';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {} as Record<string, any[]>);

    // Generate narrative
    let narrative = 'Professional legal services to be rendered:\n\n';
    
    Object.entries(servicesByCategory).forEach(([category, categoryServices]) => {
      narrative += `${category}:\n`;
      categoryServices.forEach(service => {
        narrative += `• ${service.name}`;
        if (service.description) {
          narrative += ` - ${service.description}`;
        }
        narrative += '\n';
      });
      narrative += '\n';
    });

    narrative += 'All services will be rendered in accordance with professional standards and the Rules of the Bar.';

    setFormData(prev => ({
      ...prev,
      fee_narrative: narrative
    }));

    toast.success('Fee narrative generated from selected services');
  };

  const selectedMatter = matters.find(m => m.id === formData.matter_id);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBody>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-judicial-blue-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Create New Pro Forma</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Matter Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Matter <span className="text-red-500">*</span>
            </label>
            {loadingMatters ? (
              <div className="flex items-center justify-center py-3 border border-neutral-300 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-judicial-blue-600"></div>
                <span className="ml-2 text-sm text-neutral-600">Loading matters...</span>
              </div>
            ) : (
              <select
                value={formData.matter_id}
                onChange={(e) => handleInputChange('matter_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-judicial-blue-500 focus:border-transparent ${
                  errors.matter_id ? 'border-red-500' : 'border-neutral-300'
                }`}
                required
              >
                <option value="">Select a matter...</option>
                {matters.map((matter) => (
                  <option key={matter.id} value={matter.id}>
                    {matter.reference_number} - {matter.title} ({matter.client_name})
                  </option>
                ))}
              </select>
            )}
            {errors.matter_id && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.matter_id}
              </div>
            )}
            {selectedMatter && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Client:</strong> {selectedMatter.client_name}<br />
                  <strong>Type:</strong> {selectedMatter.matter_type}<br />
                  <strong>Instructing Attorney:</strong> {selectedMatter.instructing_attorney}
                </p>
              </div>
            )}
          </div>

          {/* Service Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                <Settings className="w-4 h-4 inline mr-1" />
                Services to be Rendered
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateFeeNarrativeFromServices}
                disabled={selectedServices.length === 0}
                className="text-xs"
              >
                Generate Fee Narrative
              </Button>
            </div>
            
            {loadingServices ? (
              <div className="flex items-center justify-center py-4 border border-neutral-300 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-judicial-blue-600"></div>
                <span className="ml-2 text-sm text-neutral-600">Loading services...</span>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-neutral-300 rounded-lg p-3 space-y-3">
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
                              className="mt-0.5 rounded border-neutral-300 text-judicial-blue-600 focus:ring-judicial-blue-500"
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
              Select services to include in this pro forma. Use "Generate Fee Narrative" to auto-populate the description.
            </p>
          </div>

          {/* Fee Narrative */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Fee Narrative <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.fee_narrative}
              onChange={(e) => handleInputChange('fee_narrative', e.target.value)}
              placeholder="Describe the services and fees in detail..."
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-judicial-blue-500 focus:border-transparent ${
                errors.fee_narrative ? 'border-red-500' : 'border-neutral-300'
              }`}
              required
            />
            {errors.fee_narrative && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.fee_narrative}
              </div>
            )}
            <p className="mt-1 text-xs text-neutral-500">
              Minimum 10 characters. Be specific about the services to be rendered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Total Amount (R) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={errors.total_amount ? 'border-red-500' : ''}
                required
              />
              {errors.total_amount && (
                <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.total_amount}
                </div>
              )}
              {formData.total_amount > 0 && (
                <p className="mt-1 text-xs text-neutral-500">
                  Incl. VAT: R{(formData.total_amount * 1.15).toFixed(2)}
                </p>
              )}
            </div>

            {/* Valid Until */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Valid Until <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => handleInputChange('valid_until', e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                className={errors.valid_until ? 'border-red-500' : ''}
                required
              />
              {errors.valid_until && (
                <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.valid_until}
                </div>
              )}
            </div>
          </div>

          {/* Quote Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Pro Forma Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.quote_date}
              onChange={(e) => handleInputChange('quote_date', e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Today or earlier
              className={errors.quote_date ? 'border-red-500' : ''}
              required
            />
            {errors.quote_date && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.quote_date}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Internal Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any internal notes (optional)..."
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-judicial-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-neutral-500">
              These notes are for internal use only and will not appear on the pro forma.
            </p>
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading || loadingMatters}
            className="bg-judicial-blue-600 hover:bg-judicial-blue-700"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </div>
            ) : (
              'Create Pro Forma'
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};