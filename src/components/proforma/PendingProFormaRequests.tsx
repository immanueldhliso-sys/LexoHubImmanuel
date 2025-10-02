import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Building, 
  Mail, 
  Phone, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Plus,
  Calculator,
  Calendar,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, Button } from '../../design-system/components';
import { NewMatterModal } from '../matters/NewMatterModal';
import { InvoiceGenerationModal } from '../invoices/InvoiceGenerationModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import type { Matter } from '../../types';

interface ProFormaRequest {
  id: string;
  token: string;
  advocate_id: string;
  instructing_attorney_name?: string;
  instructing_attorney_firm?: string;
  instructing_attorney_email?: string;
  instructing_attorney_phone?: string;
  matter_description?: string;
  requested_action?: 'matter' | 'pro_forma';
  matter_title?: string;
  client_name?: string;
  status: 'pending' | 'submitted' | 'processed' | 'declined';
  created_at: string;
  submitted_at?: string;
  processed_at?: string;
}

interface PendingProFormaRequestsProps {
  onNavigate?: (page: string) => void;
}

export const PendingProFormaRequests: React.FC<PendingProFormaRequestsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ProFormaRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewMatterModal, setShowNewMatterModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [prepopulationData, setPrepopulationData] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<ProFormaRequest | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, [user?.id]);

  const fetchPendingRequests = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pro_forma_requests')
        .select('*')
        .eq('advocate_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching pro forma requests:', error);
      toast.error('Failed to load pro forma requests');
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return { color: 'bg-status-error-100 text-status-error-700 border-status-error-200', icon: AlertTriangle };
      case 'high':
        return { color: 'bg-mpondo-gold-100 text-mpondo-gold-700 border-mpondo-gold-200', icon: Zap };
      case 'medium':
        return { color: 'bg-judicial-blue-100 text-judicial-blue-700 border-judicial-blue-200', icon: Clock };
      case 'low':
        return { color: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: Clock };
      default:
        return { color: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: Clock };
    }
  };

  const handleProcessRequest = async (request: ProFormaRequest) => {
    const initialData = {
      title: request.matter_title || `Matter for ${request.client_name || request.instructing_attorney_name}`,
      description: request.matter_description || '',
      client_name: request.client_name || '',
      instructing_attorney: request.instructing_attorney_name || '',
      instructing_firm: request.instructing_attorney_firm || '',
      instructing_attorney_email: request.instructing_attorney_email || '',
      instructing_attorney_phone: request.instructing_attorney_phone || '',
      estimated_value: 0,
      additional_notes: ''
    };

    setPrepopulationData(initialData);
    setSelectedRequest(request);

    if (request.requested_action === 'matter') {
      setShowNewMatterModal(true);
    } else {
      // For pro forma requests, create a temporary matter object
      const tempMatterForInvoice: Matter = {
        id: `temp-pro-forma-${request.id}`,
        title: initialData.title,
        description: initialData.description,
        client_name: initialData.client_name,
        instructing_attorney: initialData.instructing_attorney,
        instructing_firm: initialData.instructing_firm,
        instructing_attorney_email: initialData.instructing_attorney_email,
        instructing_attorney_phone: initialData.instructing_attorney_phone,
        estimated_value: initialData.estimated_value,
        status: 'active' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        advocate_id: user?.id || '',
        matter_type: 'Other',
        client_type: 'individual' as any,
        fee_type: 'hourly' as any,
        hourly_rate: 0,
        risk_level: 'medium' as any,
        bar_association: 'johannesburg' as any
      };
      setPrepopulationData(tempMatterForInvoice);
      setShowInvoiceModal(true);
    }
  };

  const markRequestAsProcessed = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('pro_forma_requests')
        .update({ 
          status: 'processed', 
          processed_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      // Remove the processed request from the list
      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast.success('Request processed successfully');
    } catch (error) {
      console.error('Error marking request as processed:', error);
      toast.error('Failed to mark request as processed');
    }
  };

  const handleModalClose = () => {
    setShowNewMatterModal(false);
    setShowInvoiceModal(false);
    setPrepopulationData(null);
    setSelectedRequest(null);
  };

  const handleMatterCreated = (newMatter: Matter) => {
    if (selectedRequest) {
      markRequestAsProcessed(selectedRequest.id);
    }
    handleModalClose();
    toast.success(`Matter "${newMatter.title}" created successfully from pro forma request`);
  };

  const handleInvoiceGenerated = () => {
    if (selectedRequest) {
      markRequestAsProcessed(selectedRequest.id);
    }
    handleModalClose();
    toast.success('Pro forma invoice generated successfully');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-judicial-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neutral-600">Loading pro forma requests...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Pending Pro Forma Requests</h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-neutral-900 mb-2">No pending requests</h4>
            <p className="text-neutral-600 mb-4">
              You don't have any pending pro forma requests at the moment.
            </p>
            <Button
              onClick={() => onNavigate?.('matters')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Generate Pro Forma Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">
              Pending Pro Forma Requests ({requests.length})
            </h3>
            <Button
              onClick={fetchPendingRequests}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-6">
            {requests.map((request) => {
              // Default urgency level since it's not in the database schema
              const defaultUrgencyLevel = 'medium';
              const urgencyConfig = getUrgencyConfig(defaultUrgencyLevel);
              const UrgencyIcon = urgencyConfig.icon;
              // Calculate expiry based on created_at + 7 days since expires_at doesn't exist
              const expiryDate = new Date(new Date(request.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
              const isExpiringSoon = expiryDate < new Date(Date.now() + 24 * 60 * 60 * 1000);

              return (
                <div
                  key={request.id}
                  className={`border rounded-lg p-4 transition-colors hover:bg-neutral-50 ${
                    isExpiringSoon ? 'border-mpondo-gold-300 bg-mpondo-gold-50' : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${urgencyConfig.color}`}>
                          <UrgencyIcon className="h-3 w-3" />
                          {defaultUrgencyLevel.charAt(0).toUpperCase() + defaultUrgencyLevel.slice(1)}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {request.created_at && !isNaN(new Date(request.created_at).getTime()) 
                            ? formatDistanceToNow(new Date(request.created_at), { addSuffix: true })
                            : 'Recently created'
                          }
                        </span>
                        {isExpiringSoon && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-mpondo-gold-100 text-mpondo-gold-700 border border-mpondo-gold-200">
                            <AlertTriangle className="h-3 w-3" />
                            Expires soon
                          </span>
                        )}
                      </div>

                      {/* Attorney Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {request.instructing_attorney_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-neutral-400" />
                            <span className="font-medium">{request.instructing_attorney_name}</span>
                          </div>
                        )}
                        {request.instructing_attorney_firm && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-neutral-400" />
                            <span>{request.instructing_attorney_firm}</span>
                          </div>
                        )}
                        {request.instructing_attorney_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-neutral-400" />
                            <span>{request.instructing_attorney_email}</span>
                          </div>
                        )}
                        {request.instructing_attorney_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-neutral-400" />
                            <span>{request.instructing_attorney_phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Matter Details */}
                      {request.matter_title && (
                        <div>
                          <h4 className="font-medium text-neutral-900 mb-1">{request.matter_title}</h4>
                        </div>
                      )}
                      
                      <div className="text-sm text-neutral-600">
                        <p className="line-clamp-2">{request.matter_description}</p>
                      </div>

                      {request.client_name && (
                        <div className="text-sm">
                          <span className="font-medium text-neutral-700">Client: </span>
                          <span className="text-neutral-600">{request.client_name}</span>
                        </div>
                      )}



                      {/* Expiry Info */}
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Expires {formatDistanceToNow(expiryDate, { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleProcessRequest(request)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {request.requested_action === 'matter' ? (
                          <>
                            <Plus className="h-4 w-4" />
                            Create Matter
                          </>
                        ) : (
                          <>
                            <Calculator className="h-4 w-4" />
                            Generate Pro Forma
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          // TODO: Implement view details modal
                          toast.info('View details functionality coming soon');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* New Matter Modal */}
      {showNewMatterModal && prepopulationData && (
        <NewMatterModal
          isOpen={showNewMatterModal}
          onClose={handleModalClose}
          onMatterCreated={handleMatterCreated}
          initialData={prepopulationData}
        />
      )}

      {/* Invoice Generation Modal */}
      {showInvoiceModal && prepopulationData && (
        <InvoiceGenerationModal
          isOpen={showInvoiceModal}
          onClose={handleModalClose}
          matter={prepopulationData}
          onInvoiceGenerated={handleInvoiceGenerated}
          defaultToProForma={true}
        />
      )}
    </>
  );
};