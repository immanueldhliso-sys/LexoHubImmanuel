import React, { useState } from 'react';
import { X, Link, Copy, Check, AlertCircle } from 'lucide-react';
import { Button, Input, Modal, ModalBody, ModalFooter } from '../../design-system/components';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ProFormaLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProFormaLinkModal: React.FC<ProFormaLinkModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [matterDescription, setMatterDescription] = useState('');
  const [matterType, setMatterType] = useState('general');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (!clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }
    
    if (!matterDescription.trim()) {
      newErrors.matterDescription = 'Matter description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateProFormaLink = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors before generating the link');
      return;
    }

    try {
      setIsGenerating(true);
      
      const token = crypto.randomUUID();
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      console.log('Inserting pro forma request with data:', {
        token,
        advocate_id: user?.id,
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        matter_description: matterDescription.trim(),
        matter_type: matterType,
        urgency_level: urgencyLevel,
        status: 'pending',
        expires_at: expiryDate.toISOString()
      });

      const { error } = await supabase
        .from('pro_forma_requests')
        .insert({
          token,
          advocate_id: user?.id,
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          matter_description: matterDescription.trim(),
          matter_type: matterType,
          urgency_level: urgencyLevel,
          status: 'pending',
          expires_at: expiryDate.toISOString()
        });

      console.log('Insert result error:', error);

      if (error) {
        throw error;
      }

      // Generate the public link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/pro-forma-request/${token}`;
      setGeneratedLink(link);
      
      toast.success('Pro forma request link generated successfully!');
    } catch (error) {
      console.error('Error generating pro forma link:', error);
      toast.error('Failed to generate pro forma link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      toast.success('Link copied to clipboard!');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleClose = () => {
    setClientName('');
    setClientEmail('');
    setMatterDescription('');
    setMatterType('general');
    setUrgencyLevel('medium');
    setGeneratedLink('');
    setErrors({});
    setLinkCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalBody>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-mpondo-gold/10 rounded-lg">
              <Link className="w-5 h-5 text-mpondo-gold-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Generate Pro Forma Request Link
              </h2>
              <p className="text-sm text-neutral-600">
                Create a secure link for clients to request pro forma invoices
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {!generatedLink ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Client Name *
              </label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                error={errors.clientName}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Client Email *
              </label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Enter client email address"
                error={errors.clientEmail}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Matter Type
              </label>
              <select
                value={matterType}
                onChange={(e) => setMatterType(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
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

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Matter Description *
              </label>
              <textarea
                value={matterDescription}
                onChange={(e) => setMatterDescription(e.target.value)}
                placeholder="Brief description of the legal matter"
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent resize-none ${
                  errors.matterDescription ? 'border-red-300' : 'border-neutral-300'
                }`}
              />
              {errors.matterDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.matterDescription}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Urgency Level
              </label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              >
                <option value="low">Low - Standard processing</option>
                <option value="medium">Medium - Priority processing</option>
                <option value="high">High - Urgent processing</option>
              </select>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How it works:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• A secure link will be generated for your client</li>
                    <li>• The client can access the form without logging in</li>
                    <li>• You'll receive the request in your dashboard</li>
                    <li>• Process the request to create a matter or invoice</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Link Generated Successfully!</span>
              </div>
              <p className="text-sm text-green-700">
                Share this secure link with {clientName} to request a pro forma invoice.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Pro Forma Request Link
              </label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1 bg-neutral-50"
                />
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <h4 className="font-medium text-neutral-900 mb-2">Next Steps:</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>1. Share this link with your client via email or messaging</li>
                <li>2. Monitor incoming requests in your Dashboard</li>
                <li>3. Process requests to create matters or generate invoices</li>
              </ul>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            {generatedLink ? 'Close' : 'Cancel'}
          </Button>
          {!generatedLink && (
            <Button
              variant="primary"
              onClick={generateProFormaLink}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  Generate Link
                </>
              )}
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
};