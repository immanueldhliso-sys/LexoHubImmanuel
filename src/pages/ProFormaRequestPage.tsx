/**
 * ProFormaRequestPage Component
 * 
 * Public-facing page for instructing attorneys to submit pro forma requests.
 * Accessible via /pro-forma-request/:token without authentication.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, 
  User, 
  CheckCircle, 
  AlertCircle,
  Scale
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, Input } from '../design-system/components';
import { LoadingSpinner } from '../components/design-system/components/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

// Using actual schema from migration instead of outdated types
type ProFormaStatus = 'pending' | 'submitted' | 'processed' | 'declined';

interface FormData {
  client_name: string;
  client_email: string;
  client_phone: string;
  matter_description: string;
  matter_type: string;
  urgency_level: string;
}

interface ProFormaRequestPageProps {
  token?: string;
}

const ProFormaRequestPage: React.FC<ProFormaRequestPageProps> = ({ token: tokenProp }) => {
  const params = useParams<{ token: string }>();
  const token = tokenProp || params.token;
  const [formData, setFormData] = useState<FormData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    matter_description: '',
    matter_type: 'general',
    urgency_level: 'medium'
  });
  const [requestStatus, setRequestStatus] = useState<'loading' | 'pending' | 'submitted' | 'processed' | 'declined' | 'not_found'>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advocateInfo, setAdvocateInfo] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    const checkRequest = async () => {
      if (!token) {
        console.log('No token provided');
        setRequestStatus('not_found');
        return;
      }

      console.log('Checking pro forma request with token:', token);

      try {
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('pro_forma_requests')
          .select(`
            status,
            advocate_id,
            expires_at
          `)
          .eq('token', token)
          .maybeSingle();
          
        const endTime = Date.now();
        console.log('Query completed in:', endTime - startTime, 'ms');
        console.log('Query result:', { data, error });
          
        if (error) {
          console.error('Query error:', error);
          setRequestStatus('not_found');
          return;
        }
        
        if (!data) {
          console.log('No data returned for token');
          setRequestStatus('not_found');
          return;
        }

        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          console.log('Request has expired');
          setRequestStatus('not_found');
          return;
        }

        if (data.advocate_id) {
          const { data: advocateData } = await supabase
            .from('advocates')
            .select('full_name, email')
            .eq('id', data.advocate_id)
            .single();
            
          if (advocateData) {
            setAdvocateInfo({
              full_name: advocateData.full_name,
              email: advocateData.email
            });
          }
        }
        
        if (data.status === 'processed') {
          setRequestStatus('processed');
        } else if (data.status === 'declined') {
          setRequestStatus('declined');
        } else if (data.status === 'submitted') {
          setRequestStatus('submitted');
        } else if (data.status === 'pending') {
          setRequestStatus('pending');
        }
      } catch (error) {
        console.error('Exception during request check:', error);
        setRequestStatus('not_found');
      }
    };

    checkRequest();
  }, [token]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof FormData)[] = [
      'client_name',
      'client_email',
      'matter_description'
    ];

    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        toast.error(`Please fill in ${field.replace(/_/g, ' ')}`);
        return false;
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.client_email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('pro_forma_requests')
        .update({ 
          ...formData,
          status: 'submitted' as ProFormaStatus
        })
        .eq('token', token);

      if (error) {
        throw error;
      }

      setRequestStatus('submitted');
      toast.success('Your request has been submitted successfully!');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (requestStatus === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error states
  if (requestStatus === 'not_found') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-neutral-900 mb-2">Request Not Found</h1>
            <p className="text-neutral-600">
              This pro forma request link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requestStatus === 'submitted') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-neutral-900 mb-2">Request Submitted</h1>
            <p className="text-neutral-600 mb-4">
              Your pro forma request has been submitted successfully. The advocate will review your request and respond accordingly.
            </p>
            {advocateInfo && (
              <p className="text-sm text-neutral-500">
                You can expect to hear from {advocateInfo.full_name} at {advocateInfo.email}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requestStatus === 'processed') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-neutral-900 mb-2">Request Processed</h1>
            <p className="text-neutral-600 mb-4">
              Your pro forma request has been processed by the advocate. You should receive further communication shortly.
            </p>
            {advocateInfo && (
              <p className="text-sm text-neutral-500">
                Processed by {advocateInfo.full_name} at {advocateInfo.email}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requestStatus === 'declined') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-neutral-900 mb-2">Request Declined</h1>
            <p className="text-neutral-600">
              This pro forma request has been declined. Please contact the advocate directly for more information.
            </p>
            {advocateInfo && (
              <p className="text-sm text-neutral-500">
                Contact {advocateInfo.full_name} at {advocateInfo.email}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mpondo-gold-100 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-mpondo-gold-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Pro Forma Request</h1>
              {advocateInfo && (
                <p className="text-sm text-neutral-600">
                  Request from {advocateInfo.full_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-neutral-900">Request Details</h2>
            <p className="text-sm text-neutral-600">
              Please provide the following information for your legal matter.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Information */}
              <div>
                <h3 className="text-base font-medium text-neutral-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Client Name *"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    placeholder="Enter client name"
                    required
                  />
                  <Input
                    label="Client Email *"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                    placeholder="Enter client email address"
                    required
                  />
                  <Input
                    label="Client Phone"
                    type="tel"
                    value={formData.client_phone}
                    onChange={(e) => handleInputChange('client_phone', e.target.value)}
                    placeholder="Enter client phone number"
                  />
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Matter Type *
                    </label>
                    <select
                      value={formData.matter_type}
                      onChange={(e) => handleInputChange('matter_type', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                      required
                    >
                      <option value="general">General Legal Matter</option>
                      <option value="litigation">Litigation</option>
                      <option value="corporate">Corporate Law</option>
                      <option value="property">Property Law</option>
                      <option value="family">Family Law</option>
                      <option value="criminal">Criminal Law</option>
                      <option value="employment">Employment Law</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Matter Information */}
              <div>
                <h3 className="text-base font-medium text-neutral-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Matter Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Matter Description *
                    </label>
                    <textarea
                      value={formData.matter_description}
                      onChange={(e) => handleInputChange('matter_description', e.target.value)}
                      placeholder="Provide detailed information about the matter, including key facts, issues, and any specific requirements..."
                      rows={6}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500 resize-vertical"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Urgency Level *
                    </label>
                    <select
                      value={formData.urgency_level}
                      onChange={(e) => handleInputChange('urgency_level', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                      required
                    >
                      <option value="low">Low - Standard processing</option>
                      <option value="medium">Medium - Priority processing</option>
                      <option value="high">High - Urgent processing</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-neutral-200">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            This form is secure and your information will only be shared with the requesting advocate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProFormaRequestPage;