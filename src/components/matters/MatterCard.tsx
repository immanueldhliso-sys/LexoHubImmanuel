import React from 'react';
import { 
  Briefcase, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  Clock,
  User,
  Building,
  Phone,
  Mail,
  FileText,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, Button } from '../../design-system/components';
import { formatRand } from '../../lib/currency';
import { format } from 'date-fns';
import type { Matter } from '../../types';
import { MatterStatus, RiskLevel, FeeType } from '../../types';

interface MatterCardProps {
  matter: Matter;
  onViewDetails?: (matter: Matter) => void;
  onGenerateInvoice?: (matter: Matter) => void;
  onEdit?: (matter: Matter) => void;
  showInvoiceCount?: boolean;
  invoiceCount?: number;
}

const getStatusColor = (status: MatterStatus): string => {
  switch (status) {
    case MatterStatus.ACTIVE:
      return 'bg-green-100 text-green-800';
    case MatterStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case MatterStatus.SETTLED:
      return 'bg-blue-100 text-blue-800';
    case MatterStatus.CLOSED:
      return 'bg-gray-100 text-gray-800';
    case MatterStatus.ON_HOLD:
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRiskColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case RiskLevel.LOW:
      return 'text-green-600';
    case RiskLevel.MEDIUM:
      return 'text-yellow-600';
    case RiskLevel.HIGH:
      return 'text-orange-600';
    case RiskLevel.CRITICAL:
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const getFeeTypeLabel = (feeType: FeeType): string => {
  switch (feeType) {
    case FeeType.STANDARD:
      return 'Hourly';
    case FeeType.CONTINGENCY:
      return 'Contingency';
    case FeeType.SUCCESS:
      return 'Success Fee';
    case FeeType.RETAINER:
      return 'Retainer';
    case FeeType.PRO_BONO:
      return 'Pro Bono';
    default:
      return 'Standard';
  }
};

export const MatterCard: React.FC<MatterCardProps> = ({
  matter,
  onViewDetails,
  onGenerateInvoice,
  onEdit,
  showInvoiceCount = false,
  invoiceCount = 0
}) => {
  const isOverdue = matter.is_overdue;
  const hasNextCourtDate = matter.next_court_date;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Briefcase className="h-5 w-5 text-mpondo-gold" />
              <h3 className="text-lg font-semibold text-neutral-900 truncate">
                {matter.title}
              </h3>
              {isOverdue && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-2">
              <span className="font-medium">{matter.reference_number}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(matter.status)}`}>
                {matter.status.charAt(0).toUpperCase() + matter.status.slice(1)}
              </span>
              <span className="flex items-center space-x-1">
                <AlertTriangle className={`h-3 w-3 ${getRiskColor(matter.risk_level)}`} />
                <span className={getRiskColor(matter.risk_level)}>
                  {matter.risk_level.charAt(0).toUpperCase() + matter.risk_level.slice(1)} Risk
                </span>
              </span>
            </div>

            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
              {matter.description || 'No description provided'}
            </p>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(matter)}
              className="p-2"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600 mb-1">
              <User className="h-4 w-4" />
              <span className="font-medium">Client:</span>
              <span>{matter.client_name}</span>
            </div>
            
            {matter.client_email && (
              <div className="flex items-center space-x-2 text-sm text-neutral-600 mb-1">
                <Mail className="h-4 w-4" />
                <span>{matter.client_email}</span>
              </div>
            )}
            
            {matter.client_phone && (
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Phone className="h-4 w-4" />
                <span>{matter.client_phone}</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600 mb-1">
              <Building className="h-4 w-4" />
              <span className="font-medium">Attorney:</span>
              <span>{matter.instructing_attorney}</span>
            </div>
            
            {matter.instructing_firm && (
              <div className="flex items-center space-x-2 text-sm text-neutral-600 mb-1">
                <span className="font-medium">Firm:</span>
                <span>{matter.instructing_firm}</span>
              </div>
            )}
            
            {matter.instructing_firm_ref && (
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <FileText className="h-4 w-4" />
                <span>Ref: {matter.instructing_firm_ref}</span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-neutral-50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-neutral-500 mb-1">Fee Type</div>
            <div className="text-sm font-medium text-neutral-900">
              {getFeeTypeLabel(matter.fee_type)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-neutral-500 mb-1">WIP Value</div>
            <div className="text-sm font-medium text-neutral-900">
              {formatRand(matter.wip_value)}
            </div>
          </div>
          
          {matter.estimated_fee && (
            <div className="text-center">
              <div className="text-xs text-neutral-500 mb-1">Est. Fee</div>
              <div className="text-sm font-medium text-neutral-900">
                {formatRand(matter.estimated_fee)}
              </div>
            </div>
          )}
          
          {matter.settlement_probability && (
            <div className="text-center">
              <div className="text-xs text-neutral-500 mb-1">Settlement %</div>
              <div className="text-sm font-medium text-neutral-900">
                {matter.settlement_probability}%
              </div>
            </div>
          )}
        </div>

        {/* Important Dates */}
        <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Instructed: {format(new Date(matter.date_instructed), 'dd MMM yyyy')}</span>
            </div>
            
            {hasNextCourtDate && (
              <div className="flex items-center space-x-1 text-orange-600">
                <Clock className="h-4 w-4" />
                <span>Court: {format(new Date(matter.next_court_date), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-neutral-500">
            {matter.days_active} days active
          </div>
        </div>

        {/* Tags */}
        {matter.tags && matter.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {matter.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-mpondo-gold/10 text-mpondo-gold text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {matter.tags.length > 3 && (
              <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                +{matter.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div className="flex items-center space-x-4">
            {showInvoiceCount && (
              <span className="text-sm text-neutral-600">
                {invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(matter)}
            >
              View Details
            </Button>
            
            {(matter.status === MatterStatus.ACTIVE || matter.status === MatterStatus.PENDING) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onGenerateInvoice?.(matter)}
                className="flex items-center space-x-1"
              >
                <DollarSign className="h-4 w-4" />
                <span>Invoice</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};