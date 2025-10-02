import React, { useState, useEffect } from 'react';
import { Upload, Building2, FileText, Image, Save, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Input } from '../../design-system/components';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Advocate } from '../../types';

interface FirmBrandingData {
  firm_name: string;
  firm_tagline: string;
  firm_logo_url: string;
  vat_number: string;
  banking_details: {
    bank_name: string;
    account_name: string;
    account_number: string;
    branch_code: string;
    swift_code?: string;
  };
}

export const FirmBrandingSettings: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FirmBrandingData>({
    firm_name: '',
    firm_tagline: '',
    firm_logo_url: '',
    vat_number: '',
    banking_details: {
      bank_name: 'Standard Bank',
      account_name: 'Legal Practice Trust Account',
      account_number: '',
      branch_code: '',
      swift_code: ''
    }
  });

  useEffect(() => {
    if (user?.id) {
      loadFirmBranding();
    }
  }, [user?.id]);

  const loadFirmBranding = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('advocates')
        .select('firm_name, firm_tagline, firm_logo_url, vat_number, banking_details')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          firm_name: data.firm_name || '',
          firm_tagline: data.firm_tagline || '',
          firm_logo_url: data.firm_logo_url || '',
          vat_number: data.vat_number || '',
          banking_details: data.banking_details || formData.banking_details
        });
      }
    } catch (error) {
      console.error('Error loading firm branding:', error);
      toast.error('Failed to load firm branding settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('advocates')
        .update({
          firm_name: formData.firm_name || null,
          firm_tagline: formData.firm_tagline || null,
          firm_logo_url: formData.firm_logo_url || null,
          vat_number: formData.vat_number || null,
          banking_details: formData.banking_details
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Firm branding settings saved successfully');
    } catch (error) {
      console.error('Error saving firm branding:', error);
      toast.error('Failed to save firm branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be less than 2MB');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `firm-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, firm_logo_url: publicUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-mpondo-gold-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Firm Branding</h2>
          </div>
          <p className="text-sm text-neutral-600 mt-2">
            Customize how your firm appears on invoices and documents
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Firm Name
              </label>
              <Input
                type="text"
                value={formData.firm_name}
                onChange={(e) => setFormData(prev => ({ ...prev, firm_name: e.target.value }))}
                placeholder="e.g., Groenkloof Attorneys"
              />
              <p className="mt-1 text-xs text-neutral-500">
                This will appear at the top of your invoices
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Firm Tagline
              </label>
              <Input
                type="text"
                value={formData.firm_tagline}
                onChange={(e) => setFormData(prev => ({ ...prev, firm_tagline: e.target.value }))}
                placeholder="e.g., Excellence in Legal Services"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Optional tagline below firm name
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Image className="w-4 h-4 inline mr-1" />
              Firm Logo
            </label>
            <div className="flex items-center gap-4">
              {formData.firm_logo_url && (
                <div className="w-20 h-20 border-2 border-neutral-200 rounded-lg overflow-hidden">
                  <img
                    src={formData.firm_logo_url}
                    alt="Firm logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg hover:border-mpondo-gold-500 transition-colors">
                    <Upload className="w-5 h-5 text-neutral-500" />
                    <span className="text-sm text-neutral-700">
                      {formData.firm_logo_url ? 'Change Logo' : 'Upload Logo'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-xs text-neutral-500">
                  PNG or JPG, max 2MB. Recommended: 200x200px
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              VAT Registration Number
            </label>
            <Input
              type="text"
              value={formData.vat_number}
              onChange={(e) => setFormData(prev => ({ ...prev, vat_number: e.target.value }))}
              placeholder="e.g., 4123456789"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Your VAT registration number for invoices
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-judicial-blue-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Banking Details</h2>
          </div>
          <p className="text-sm text-neutral-600 mt-2">
            Payment information displayed on invoices
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                These banking details will appear on all your invoices. Ensure they are accurate and up to date.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Bank Name
              </label>
              <Input
                type="text"
                value={formData.banking_details.bank_name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  banking_details: { ...prev.banking_details, bank_name: e.target.value }
                }))}
                placeholder="e.g., Standard Bank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Account Name
              </label>
              <Input
                type="text"
                value={formData.banking_details.account_name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  banking_details: { ...prev.banking_details, account_name: e.target.value }
                }))}
                placeholder="e.g., Legal Practice Trust Account"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Account Number
              </label>
              <Input
                type="text"
                value={formData.banking_details.account_number}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  banking_details: { ...prev.banking_details, account_number: e.target.value }
                }))}
                placeholder="e.g., 123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Branch Code
              </label>
              <Input
                type="text"
                value={formData.banking_details.branch_code}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  banking_details: { ...prev.banking_details, branch_code: e.target.value }
                }))}
                placeholder="e.g., 051001"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Swift Code (Optional)
              </label>
              <Input
                type="text"
                value={formData.banking_details.swift_code || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  banking_details: { ...prev.banking_details, swift_code: e.target.value }
                }))}
                placeholder="e.g., SBZAZAJJ"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Required for international payments
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </div>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Firm Branding
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
