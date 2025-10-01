/**
 * Edit Opportunity Modal
 * Handles editing of existing opportunities
 * Follows LEXO Constitution principles for user experience and data validation
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, DollarSign, Percent, User, Building, Phone, Mail, FileText, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { OpportunityService, type Opportunity, type UpdateOpportunityRequest } from '@/services/api/opportunities.service';

interface EditOpportunityModalProps {
  open: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  onSuccess: () => void;
}

export function EditOpportunityModal({ open, onClose, opportunity, onSuccess }: EditOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateOpportunityRequest>({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (opportunity) {
      setFormData({
        name: opportunity.name,
        description: opportunity.description || '',
        notes: opportunity.notes || '',
        client_name: opportunity.client_name || '',
        client_email: opportunity.client_email || '',
        client_phone: opportunity.client_phone || '',
        instructing_attorney: opportunity.instructing_attorney || '',
        instructing_firm: opportunity.instructing_firm || '',
        estimated_value: opportunity.estimated_value,
        probability_percentage: opportunity.probability_percentage,
        expected_instruction_date: opportunity.expected_instruction_date || '',
        source: opportunity.source || '',
        status: opportunity.status,
        tags: opportunity.tags || []
      });
    }
  }, [opportunity]);

  const handleInputChange = (field: keyof UpdateOpportunityRequest, value: any) => {
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
    
    if (!formData.name?.trim()) {
      toast.error('Opportunity name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await OpportunityService.update(opportunity.id, formData);
      
      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      toast.success('Opportunity updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast.error('Failed to update opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Edit Opportunity
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Opportunity Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
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
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of the opportunity..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
                        Client Name
                      </Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="client_name"
                          value={formData.client_name || ''}
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
                          value={formData.client_email || ''}
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
                          value={formData.client_phone || ''}
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
                        value={formData.instructing_attorney || ''}
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
                        value={formData.instructing_firm || ''}
                        onChange={(e) => handleInputChange('instructing_firm', e.target.value)}
                        placeholder="Law firm or company name"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial & Timeline Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        value={formData.expected_instruction_date || ''}
                        onChange={(e) => handleInputChange('expected_instruction_date', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {formData.estimated_value && formData.probability_percentage && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900">Expected Value:</span>
                        <span className="text-lg font-bold text-blue-600">
                          R{(formData.estimated_value * (formData.probability_percentage / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notes & Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                      Notes
                    </Label>
                    <div className="relative mt-1">
                      <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Additional notes, follow-up actions, or important details..."
                        className="pl-10"
                        rows={8}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Opportunity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}