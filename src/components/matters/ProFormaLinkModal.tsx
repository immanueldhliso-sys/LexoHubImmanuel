import React, { useState } from 'react';
import { X, Link, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from '../../design-system/components';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Fixed: Removed step variable references

interface ProFormaLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProFormaLinkModal: React.FC<ProFormaLinkModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);

  const generateProFormaLink = async () => {
    if (expiryDays < 1 || expiryDays > 30) {
      toast.error('Expiry days must be between 1 and 30');
      return;
    }

    setIsLoading(true);
    try {
      // Generate a unique token
      const token = crypto.randomUUID();
      
      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      console.log('Inserting pro forma request with data:', {
        token,
        advocate_id: user?.id,
        client_name: 'To be provided',
        client_email: 'to-be-provided@example.com',
        matter_description: 'To be provided by instructing attorney',
        matter_type: 'general',
        urgency_level: 'medium',
        status: 'pending',
        expires_at: expiryDate.toISOString()
      });

      const { error } = await supabase
        .from('pro_forma_requests')
        .insert({
          token,
          advocate_id: user?.id,
          client_name: 'To be provided',
          client_email: 'to-be-provided@example.com',
          matter_description: 'To be provided by instructing attorney',
          matter_type: 'general',
          urgency_level: 'medium',
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
      toast.success('Pro forma link generated successfully!');
    } catch (error) {
      console.error('Error generating pro forma link:', error);
      toast.error('Failed to generate pro forma link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleClose = () => {
    setIsLoading(false);
    setGeneratedLink('');
    setLinkCopied(false);
    setExpiryDays(7);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            {generatedLink ? 'Pro Forma Link Generated' : 'Generate Pro Forma Link'}
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </ModalHeader>

      <ModalBody>
        {!generatedLink ? (
          <div className="space-y-6">
            <div className="bg-judicial-blue-50 border border-judicial-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Link className="h-5 w-5 text-judicial-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-judicial-blue-900">Quick Pro Forma Link</h3>
                  <p className="text-sm text-judicial-blue-700 mt-1">
                    Generate a secure link to send to instructing attorneys. They'll provide all details when they access the link.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-xs">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Link Expires In (Days)
              </label>
              <Input
                type="number"
                min="1"
                max="30"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                className="w-full"
              />
              <p className="text-xs text-neutral-500 mt-1">Between 1 and 30 days</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Link Generated Successfully!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your pro forma request link is ready to share with instructing attorneys.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Generated Link
              </label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1 bg-neutral-50"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-mpondo-gold-50 border border-mpondo-gold-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-mpondo-gold-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-mpondo-gold-900">Next Steps</h4>
                  <ul className="text-sm text-mpondo-gold-700 mt-1 space-y-1">
                    <li>• Share this link with the instructing attorney</li>
                    <li>• They will fill out the pro forma request form</li>
                    <li>• You'll receive a notification when submitted</li>
                    <li>• Review and process the request in your dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            {generatedLink ? 'Close' : 'Cancel'}
          </Button>
          {!generatedLink && (
            <Button
              onClick={generateProFormaLink}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4" />
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