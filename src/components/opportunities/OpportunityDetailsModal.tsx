/**
 * Opportunity Details Modal
 * Displays comprehensive information about an opportunity
 * Follows LEXO Constitution principles for clear information presentation
 */

import React from 'react';
import { Edit, ArrowRight, Calendar, DollarSign, Percent, User, Building, Phone, Mail, FileText, Tag, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type Opportunity } from '@/services/api/opportunities.service';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';

interface OpportunityDetailsModalProps {
  open: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  onEdit: () => void;
  onConvert: () => void;
}

export function OpportunityDetailsModal({ 
  open, 
  onClose, 
  opportunity, 
  onEdit, 
  onConvert 
}: OpportunityDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-blue-100 text-blue-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProbabilityColor = (probability?: number) => {
    if (!probability) return 'text-gray-500';
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const InfoRow = ({ icon: Icon, label, value, className = '' }: {
    icon: React.ElementType;
    label: string;
    value: string | number | undefined;
    className?: string;
  }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-center gap-3 py-2">
        <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-sm text-gray-600">{label}:</span>
          <span className={`ml-2 font-medium ${className}`}>{value}</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                {opportunity.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(opportunity.status)}>
                  {opportunity.status}
                </Badge>
                {opportunity.source && (
                  <Badge variant="outline">{opportunity.source}</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {opportunity.status === 'active' && (
                <Button onClick={onConvert}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Convert to Matter
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {opportunity.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {opportunity.description}
                  </p>
                </div>
              )}

              <InfoRow
                icon={Calendar}
                label="Created"
                value={formatDate(opportunity.created_at)}
              />

              <InfoRow
                icon={Clock}
                label="Last Updated"
                value={formatRelativeTime(opportunity.updated_at)}
              />

              {opportunity.expected_instruction_date && (
                <InfoRow
                  icon={Calendar}
                  label="Expected Instruction"
                  value={formatDate(opportunity.expected_instruction_date)}
                />
              )}

              {opportunity.tags && opportunity.tags.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                icon={User}
                label="Client Name"
                value={opportunity.client_name}
              />

              <InfoRow
                icon={Mail}
                label="Email"
                value={opportunity.client_email}
              />

              <InfoRow
                icon={Phone}
                label="Phone"
                value={opportunity.client_phone}
              />

              <InfoRow
                icon={User}
                label="Instructing Attorney"
                value={opportunity.instructing_attorney}
              />

              <InfoRow
                icon={Building}
                label="Instructing Firm"
                value={opportunity.instructing_firm}
              />
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                icon={DollarSign}
                label="Estimated Value"
                value={opportunity.estimated_value ? formatCurrency(opportunity.estimated_value) : undefined}
                className="text-green-600"
              />

              <InfoRow
                icon={Percent}
                label="Probability"
                value={opportunity.probability_percentage ? `${opportunity.probability_percentage}%` : undefined}
                className={getProbabilityColor(opportunity.probability_percentage)}
              />

              {opportunity.estimated_value && opportunity.probability_percentage && (
                <div className="pt-2 border-t">
                  <InfoRow
                    icon={Target}
                    label="Expected Value"
                    value={formatCurrency(opportunity.estimated_value * (opportunity.probability_percentage / 100))}
                    className="text-blue-600 font-semibold"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {opportunity.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {opportunity.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversion Information */}
          {opportunity.status === 'converted' && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Conversion Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow
                  icon={Calendar}
                  label="Converted On"
                  value={opportunity.converted_at ? formatDate(opportunity.converted_at) : undefined}
                />

                {opportunity.converted_to_matter_id && (
                  <InfoRow
                    icon={FileText}
                    label="Matter ID"
                    value={opportunity.converted_to_matter_id}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {formatDate(opportunity.created_at)}
                  </span>
                </div>
              </div>

              {opportunity.updated_at !== opportunity.created_at && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">Last Updated</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {formatDate(opportunity.updated_at)}
                    </span>
                  </div>
                </div>
              )}

              {opportunity.converted_at && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">Converted to Matter</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {formatDate(opportunity.converted_at)}
                    </span>
                  </div>
                </div>
              )}

              {opportunity.expected_instruction_date && opportunity.status === 'active' && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">Expected Instruction</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {formatDate(opportunity.expected_instruction_date)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}