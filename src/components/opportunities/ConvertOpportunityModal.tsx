/**
 * Convert Opportunity Modal
 * Handles conversion of opportunities to matters with pre-populated data
 * Follows LEXO Constitution principles for seamless workflow integration
 */

import React, { useState } from 'react';
import { ArrowRight, User, Building, FileText, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';
import { type Opportunity, OpportunityService } from '@/services/api/opportunities.service';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ConvertOpportunityModalProps {
  open: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  onSuccess: () => void;
}

export function ConvertOpportunityModal({ 
  open, 
  onClose, 
  opportunity, 
  onSuccess 
}: ConvertOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [showNewMatterModal, setShowNewMatterModal] = useState(false);

  const handleConvert = async () => {
    setLoading(true);
    try {
      // First, mark the opportunity as converted
      const response = await OpportunityService.convertToMatter(opportunity.id, {});
      
      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      // Prepare data for the NewMatterModal
      const matterData = {
        title: opportunity.name,
        description: opportunity.description || '',
        client_name: opportunity.client_name || '',
        client_email: opportunity.client_email || '',
        client_phone: opportunity.client_phone || '',
        instructing_attorney: opportunity.instructing_attorney || '',
        instructing_firm: opportunity.instructing_firm || '',
        estimated_value: opportunity.estimated_value,
        notes: opportunity.notes || '',
        tags: opportunity.tags || []
      };

      // Store the data in sessionStorage for the NewMatterModal to pick up
      sessionStorage.setItem('convertedOpportunityData', JSON.stringify(matterData));
      sessionStorage.setItem('convertedOpportunityId', opportunity.id);

      toast.success('Opportunity marked for conversion. Opening matter creation form...');
      
      // Close this modal and trigger the NewMatterModal
      onClose();
      onSuccess();
      
      // Trigger the NewMatterModal to open
      // This will be handled by the parent component
      window.dispatchEvent(new CustomEvent('openNewMatterModal', { 
        detail: { fromOpportunity: true, opportunityData: matterData } 
      }));

    } catch (error) {
      console.error('Error converting opportunity:', error);
      toast.error('Failed to convert opportunity');
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ icon: Icon, label, value }: {
    icon: React.ElementType;
    label: string;
    value: string | number | undefined;
  }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-center gap-3 py-2">
        <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm text-gray-600">{label}:</span>
          <span className="ml-2 font-medium">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Convert Opportunity to Matter
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Opportunity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opportunity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{opportunity.name}</h3>
                    {opportunity.description && (
                      <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {opportunity.status}
                  </Badge>
                </div>

                <InfoRow
                  icon={User}
                  label="Client"
                  value={opportunity.client_name}
                />

                <InfoRow
                  icon={Building}
                  label="Instructing Firm"
                  value={opportunity.instructing_firm}
                />

                <InfoRow
                  icon={DollarSign}
                  label="Estimated Value"
                  value={opportunity.estimated_value ? formatCurrency(opportunity.estimated_value) : undefined}
                />

                <InfoRow
                  icon={Calendar}
                  label="Expected Instruction"
                  value={opportunity.expected_instruction_date ? formatDate(opportunity.expected_instruction_date) : undefined}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Transfer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Transfer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  The following information will be transferred to the new matter:
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Matter Title</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Description</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Client Information</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Contact Details</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Instructing Attorney</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Estimated Value</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Notes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Tags</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Converting this opportunity will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Mark the opportunity as "Converted"</li>
                <li>Open the matter creation form with pre-populated data</li>
                <li>Link the new matter to this opportunity for tracking</li>
                <li>Preserve the opportunity record for reporting purposes</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={loading}>
              {loading ? (
                'Converting...'
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Convert to Matter
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}