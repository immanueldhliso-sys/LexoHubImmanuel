/**
 * New Opportunity Modal
 * Handles creation of new pre-matter opportunities
 * Follows LEXO Constitution principles for user experience and data validation
 */

import React, { useState } from 'react';
import { X, Plus, Calendar, DollarSign, Percent, User, Building, Phone, Mail, FileText, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { OpportunityService, type CreateOpportunityRequest } from '@/services/api/opportunities.service';

interface NewOpportunityModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewOpportunityModal({ open, onClose, onSuccess }: NewOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateOpportunityRequest>({
    name: '',
    description: '',
    notes: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    instructing_attorney: '',
    instructing_firm: '',
    estimated_value: undefined,
    probability_percentage: undefined,
    expected_instruction_date: '',
    source: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (field: keyof CreateOpportunityRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Opportunity name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await OpportunityService.create(formData);
      
      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      toast.success('Opportunity created successfully');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast.error('Failed to create opportunity');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      notes: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      instructing_attorney: '',
      instructing_firm: '',
      estimated_value: undefined,
      probability_percentage: undefined,
      expected_instruction_date: '',
      source: '',
      tags: []
    });
    setCurrentStep(1);
    setTagInput('');
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      toast.error('Opportunity name is required');
      return;
    }
    setCurrentStep(prev => Math.min(3, prev + 1));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === currentStep 
              ? 'bg-blue-600 text-white' 
              : step < currentStep 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 3 && (
            <div className={`w-12 h-1 mx-2 ${
              step < currentStep ? 'bg-green-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
          Opportunity Name *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., Commercial Litigation - ABC Corp"
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Brief description of the opportunity..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="source" className="text-sm font-medium text-gray-700">
          Source
        </Label>
        <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="How did you learn about this opportunity?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="existing_client">Existing Client</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="networking">Networking</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Tags</Label>
        <div className="mt-1 space-y-2">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
            Client Name
          </Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
              placeholder="Client or company name"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="client_email" className="text-sm font-medium text-gray-700">
            Client Email
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="client_email"
              type="email"
              value={formData.client_email}
              onChange={(e) => handleInputChange('client_email', e.target.value)}
              placeholder="client@example.com"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="client_phone" className="text-sm font-medium text-gray-700">
            Client Phone
          </Label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="client_phone"
              value={formData.client_phone}
              onChange={(e) => handleInputChange('client_phone', e.target.value)}
              placeholder="+27 11 123 4567"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="instructing_attorney" className="text-sm font-medium text-gray-700">
            Instructing Attorney
          </Label>
          <Input
            id="instructing_attorney"
            value={formData.instructing_attorney}
            onChange={(e) => handleInputChange('instructing_attorney', e.target.value)}
            placeholder="Attorney name"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="instructing_firm" className="text-sm font-medium text-gray-700">
          Instructing Firm
        </Label>
        <div className="relative mt-1">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="instructing_firm"
            value={formData.instructing_firm}
            onChange={(e) => handleInputChange('instructing_firm', e.target.value)}
            placeholder="Law firm or company name"
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimated_value" className="text-sm font-medium text-gray-700">
            Estimated Value (ZAR)
          </Label>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="estimated_value"
              type="number"
              value={formData.estimated_value || ''}
              onChange={(e) => handleInputChange('estimated_value', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="50000"
              className="pl-10"
              min="0"
              step="1000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="probability_percentage" className="text-sm font-medium text-gray-700">
            Probability (%)
          </Label>
          <div className="relative mt-1">
            <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="probability_percentage"
              type="number"
              value={formData.probability_percentage || ''}
              onChange={(e) => handleInputChange('probability_percentage', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="75"
              className="pl-10"
              min="0"
              max="100"
              step="5"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="expected_instruction_date" className="text-sm font-medium text-gray-700">
          Expected Instruction Date
        </Label>
        <div className="relative mt-1">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="expected_instruction_date"
            type="date"
            value={formData.expected_instruction_date}
            onChange={(e) => handleInputChange('expected_instruction_date', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
          Notes
        </Label>
        <div className="relative mt-1">
          <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes, follow-up actions, or important details..."
            className="pl-10"
            rows={4}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Create New Opportunity
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStepIndicator()}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentStep === 1 && 'Basic Information'}
                {currentStep === 2 && 'Contact Details'}
                {currentStep === 3 && 'Financial & Timeline'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              
              {currentStep < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Opportunity'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}