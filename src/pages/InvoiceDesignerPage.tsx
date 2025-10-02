import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Eye, 
  RotateCcw, 
  FileText, 
  Palette, 
  Type, 
  Layout,
  Image as ImageIcon,
  Settings,
  Upload
} from 'lucide-react';
import { Card, CardContent, Button } from '../design-system/components';
import { toast } from 'react-hot-toast';

interface PDFDesignSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    family: string;
    titleSize: number;
    headingSize: number;
    bodySize: number;
    smallSize: number;
  };
  layout: {
    headerStyle: 'centered' | 'left' | 'right';
    logoPosition: 'left' | 'center' | 'right' | 'none';
    showWatermark: boolean;
    pageSize: 'a4' | 'letter';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
  branding: {
    firmName: string;
    logo: string | null;
    tagline: string;
    showLogo: boolean;
  };
  content: {
    showLineNumbers: boolean;
    showTaxBreakdown: boolean;
    showPaymentTerms: boolean;
    showBankingDetails: boolean;
    customFooterText: string;
    paymentTermsText: string;
  };
  bankingDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    swiftCode: string;
  };
}

const defaultSettings: PDFDesignSettings = {
  colors: {
    primary: '#1e40af',
    secondary: '#64748b',
    accent: '#059669',
    text: '#1f2937',
    background: '#ffffff'
  },
  fonts: {
    family: 'helvetica',
    titleSize: 20,
    headingSize: 14,
    bodySize: 10,
    smallSize: 8
  },
  layout: {
    headerStyle: 'centered',
    logoPosition: 'left',
    showWatermark: false,
    pageSize: 'a4',
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    }
  },
  branding: {
    firmName: 'Your Law Firm',
    logo: null,
    tagline: 'Excellence in Legal Services',
    showLogo: true
  },
  content: {
    showLineNumbers: true,
    showTaxBreakdown: true,
    showPaymentTerms: true,
    showBankingDetails: true,
    customFooterText: '',
    paymentTermsText: 'Payment is due within 30 days of invoice date.'
  },
  bankingDetails: {
    bankName: 'Standard Bank',
    accountName: 'Legal Practice Trust Account',
    accountNumber: '',
    branchCode: '',
    swiftCode: ''
  }
};

export const InvoiceDesignerPage: React.FC = () => {
  const [settings, setSettings] = useState<PDFDesignSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'colors' | 'fonts' | 'layout' | 'branding' | 'content' | 'banking'>('colors');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'invoice' | 'proforma'>('invoice');
  const [showLivePreview, setShowLivePreview] = useState(true);

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = () => {
    const saved = localStorage.getItem('invoiceDesignSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved settings:', error);
      }
    }
  };

  const handleSettingChange = (category: keyof PDFDesignSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('invoiceDesignSettings', JSON.stringify(settings));
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('PDF design settings saved successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all design settings to defaults?')) {
      setSettings(defaultSettings);
      setHasUnsavedChanges(true);
      toast.success('Settings reset to defaults');
    }
  };

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${previewMode === 'invoice' ? 'Invoice' : 'Pro Forma'} Preview</title>
              <style>
                body {
                  font-family: ${settings.fonts.family}, sans-serif;
                  margin: ${settings.layout.margins.top}mm ${settings.layout.margins.right}mm ${settings.layout.margins.bottom}mm ${settings.layout.margins.left}mm;
                  color: ${settings.colors.text};
                  background: ${settings.colors.background};
                }
                .header {
                  text-align: ${settings.layout.headerStyle};
                  margin-bottom: 30px;
                  padding-bottom: 15px;
                  border-bottom: 2px solid ${settings.colors.primary};
                }
                .title {
                  font-size: ${settings.fonts.titleSize}pt;
                  color: ${settings.colors.primary};
                  font-weight: bold;
                  margin: 0;
                }
                .logo {
                  max-width: 150px;
                  margin-bottom: 10px;
                }
                .firm-name {
                  font-size: ${settings.fonts.headingSize}pt;
                  font-weight: bold;
                  margin: 10px 0 5px 0;
                }
                .tagline {
                  font-size: ${settings.fonts.bodySize}pt;
                  color: ${settings.colors.secondary};
                  margin: 0;
                }
                .section {
                  margin: 20px 0;
                }
                .section-title {
                  font-size: ${settings.fonts.headingSize}pt;
                  color: ${settings.colors.primary};
                  font-weight: bold;
                  margin-bottom: 10px;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin: 20px 0;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                th {
                  background: ${settings.colors.primary};
                  color: white;
                  padding: 10px;
                  text-align: left;
                  font-size: ${settings.fonts.bodySize}pt;
                }
                td {
                  padding: 8px 10px;
                  border-bottom: 1px solid #e0e0e0;
                  font-size: ${settings.fonts.bodySize}pt;
                }
                .totals {
                  margin-top: 20px;
                  text-align: right;
                }
                .total-row {
                  display: flex;
                  justify-content: flex-end;
                  margin: 5px 0;
                  font-size: ${settings.fonts.bodySize}pt;
                }
                .total-label {
                  margin-right: 20px;
                  min-width: 100px;
                }
                .total-amount {
                  min-width: 120px;
                  text-align: right;
                }
                .grand-total {
                  font-size: ${settings.fonts.headingSize}pt;
                  font-weight: bold;
                  color: ${settings.colors.primary};
                  border-top: 2px solid ${settings.colors.primary};
                  padding-top: 10px;
                  margin-top: 10px;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #e0e0e0;
                  font-size: ${settings.fonts.smallSize}pt;
                  color: ${settings.colors.secondary};
                }
                .banking-details {
                  margin-top: 20px;
                }
                .payment-terms {
                  margin-top: 20px;
                  font-size: ${settings.fonts.smallSize}pt;
                  line-height: 1.6;
                }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                ${settings.branding.showLogo && settings.branding.logo ? `<img src="${settings.branding.logo}" alt="Logo" class="logo" style="display: block; margin: ${settings.layout.logoPosition === 'center' ? '0 auto' : settings.layout.logoPosition === 'right' ? '0 0 0 auto' : '0'};" />` : ''}
                <h1 class="title">${previewMode === 'invoice' ? 'INVOICE' : 'PRO FORMA INVOICE'}</h1>
                ${settings.branding.firmName ? `<div class="firm-name">${settings.branding.firmName}</div>` : ''}
                ${settings.branding.tagline ? `<p class="tagline">${settings.branding.tagline}</p>` : ''}
              </div>

              <div class="info-grid">
                <div>
                  <div class="section-title">BILL TO:</div>
                  <p><strong>Client Name</strong><br>
                  client@example.com<br>
                  123 Client Street<br>
                  Johannesburg, 2000</p>
                </div>
                <div>
                  <div class="section-title">${previewMode === 'invoice' ? 'INVOICE' : 'PRO FORMA'} DETAILS:</div>
                  <p><strong>Number:</strong> ${previewMode === 'invoice' ? 'INV-2024-001' : 'PF-2024-001'}<br>
                  <strong>Date:</strong> ${new Date().toLocaleDateString('en-ZA')}<br>
                  <strong>Matter:</strong> Sample Legal Matter</p>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    ${settings.content.showLineNumbers ? '<th style="width: 50px;">#</th>' : ''}
                    <th>Description</th>
                    <th style="width: 80px; text-align: center;">Qty</th>
                    <th style="width: 120px; text-align: right;">Rate</th>
                    <th style="width: 120px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    ${settings.content.showLineNumbers ? '<td>1</td>' : ''}
                    <td>Legal consultation and advice</td>
                    <td style="text-align: center;">2</td>
                    <td style="text-align: right;">R 2,500.00</td>
                    <td style="text-align: right;">R 5,000.00</td>
                  </tr>
                  <tr>
                    ${settings.content.showLineNumbers ? '<td>2</td>' : ''}
                    <td>Document preparation and review</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">R 3,500.00</td>
                    <td style="text-align: right;">R 3,500.00</td>
                  </tr>
                  <tr>
                    ${settings.content.showLineNumbers ? '<td>3</td>' : ''}
                    <td>Court appearance</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">R 7,500.00</td>
                    <td style="text-align: right;">R 7,500.00</td>
                  </tr>
                </tbody>
              </table>

              <div class="totals">
                <div class="total-row">
                  <span class="total-label">Subtotal:</span>
                  <span class="total-amount">R 16,000.00</span>
                </div>
                ${settings.content.showTaxBreakdown ? `
                <div class="total-row">
                  <span class="total-label">VAT (15%):</span>
                  <span class="total-amount">R 2,400.00</span>
                </div>
                ` : ''}
                <div class="total-row grand-total">
                  <span class="total-label">TOTAL:</span>
                  <span class="total-amount">R 18,400.00</span>
                </div>
              </div>

              ${settings.content.showPaymentTerms ? `
              <div class="section payment-terms">
                <div class="section-title">PAYMENT TERMS:</div>
                <p>${settings.content.paymentTermsText || 'Payment is due within 30 days of invoice date.'}</p>
              </div>
              ` : ''}

              ${settings.content.showBankingDetails ? `
              <div class="footer banking-details">
                <div class="section-title">BANKING DETAILS:</div>
                <p>
                  <strong>Bank:</strong> ${settings.bankingDetails.bankName}<br>
                  <strong>Account Name:</strong> ${settings.bankingDetails.accountName}<br>
                  <strong>Account Number:</strong> ${settings.bankingDetails.accountNumber || 'Not set'}<br>
                  <strong>Branch Code:</strong> ${settings.bankingDetails.branchCode || 'Not set'}
                  ${settings.bankingDetails.swiftCode ? `<br><strong>SWIFT Code:</strong> ${settings.bankingDetails.swiftCode}` : ''}
                </p>
              </div>
              ` : ''}

              ${settings.content.customFooterText ? `
              <div class="footer">
                <p>${settings.content.customFooterText}</p>
              </div>
              ` : ''}
            </body>
          </html>
        `);
        previewWindow.document.close();
        toast.success('Preview opened in new window');
      } else {
        toast.error('Please allow pop-ups to preview the PDF');
      }
    } catch (error) {
      toast.error('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSettings(prev => ({
          ...prev,
          branding: {
            ...prev.branding,
            logo: result
          }
        }));
        setHasUnsavedChanges(true);
        toast.success('Logo uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const renderColorsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Color Scheme</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Customize the colors used in your invoice and pro forma PDFs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Primary Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={settings.colors.primary}
              onChange={(e) => handleSettingChange('colors', 'primary', e.target.value)}
              className="h-10 w-20 rounded border border-neutral-300 cursor-pointer"
            />
            <input
              type="text"
              value={settings.colors.primary}
              onChange={(e) => handleSettingChange('colors', 'primary', e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              placeholder="#1e40af"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Used for headers and important elements</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Secondary Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={settings.colors.secondary}
              onChange={(e) => handleSettingChange('colors', 'secondary', e.target.value)}
              className="h-10 w-20 rounded border border-neutral-300 cursor-pointer"
            />
            <input
              type="text"
              value={settings.colors.secondary}
              onChange={(e) => handleSettingChange('colors', 'secondary', e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              placeholder="#64748b"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Used for subtitles and secondary text</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Accent Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={settings.colors.accent}
              onChange={(e) => handleSettingChange('colors', 'accent', e.target.value)}
              className="h-10 w-20 rounded border border-neutral-300 cursor-pointer"
            />
            <input
              type="text"
              value={settings.colors.accent}
              onChange={(e) => handleSettingChange('colors', 'accent', e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              placeholder="#059669"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Used for highlights and success states</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Text Color
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={settings.colors.text}
              onChange={(e) => handleSettingChange('colors', 'text', e.target.value)}
              className="h-10 w-20 rounded border border-neutral-300 cursor-pointer"
            />
            <input
              type="text"
              value={settings.colors.text}
              onChange={(e) => handleSettingChange('colors', 'text', e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              placeholder="#1f2937"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Main text color throughout the document</p>
        </div>
      </div>

      <div className="pt-6 border-t border-neutral-200">
        <h4 className="text-sm font-semibold text-neutral-900 mb-3">Color Preview</h4>
        <div className="flex space-x-4">
          <div className="flex-1 h-20 rounded-lg border border-neutral-200 flex items-center justify-center" style={{ backgroundColor: settings.colors.primary }}>
            <span className="text-white font-medium">Primary</span>
          </div>
          <div className="flex-1 h-20 rounded-lg border border-neutral-200 flex items-center justify-center" style={{ backgroundColor: settings.colors.secondary }}>
            <span className="text-white font-medium">Secondary</span>
          </div>
          <div className="flex-1 h-20 rounded-lg border border-neutral-200 flex items-center justify-center" style={{ backgroundColor: settings.colors.accent }}>
            <span className="text-white font-medium">Accent</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFontsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Typography</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Configure font sizes for different text elements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Font Family
          </label>
          <select
            value={settings.fonts.family}
            onChange={(e) => handleSettingChange('fonts', 'family', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          >
            <option value="helvetica">Helvetica</option>
            <option value="times">Times New Roman</option>
            <option value="courier">Courier</option>
          </select>
          <p className="text-xs text-neutral-500 mt-1">Base font family for the document</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Title Size (pt)
          </label>
          <input
            type="number"
            value={settings.fonts.titleSize}
            onChange={(e) => handleSettingChange('fonts', 'titleSize', parseInt(e.target.value))}
            min="14"
            max="32"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-500 mt-1">Size for main title (14-32pt)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Heading Size (pt)
          </label>
          <input
            type="number"
            value={settings.fonts.headingSize}
            onChange={(e) => handleSettingChange('fonts', 'headingSize', parseInt(e.target.value))}
            min="10"
            max="20"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-500 mt-1">Size for section headings (10-20pt)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Body Text Size (pt)
          </label>
          <input
            type="number"
            value={settings.fonts.bodySize}
            onChange={(e) => handleSettingChange('fonts', 'bodySize', parseInt(e.target.value))}
            min="8"
            max="14"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-500 mt-1">Size for body text (8-14pt)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Small Text Size (pt)
          </label>
          <input
            type="number"
            value={settings.fonts.smallSize}
            onChange={(e) => handleSettingChange('fonts', 'smallSize', parseInt(e.target.value))}
            min="6"
            max="10"
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-500 mt-1">Size for footnotes and fine print (6-10pt)</p>
        </div>
      </div>

      <div className="pt-6 border-t border-neutral-200">
        <h4 className="text-sm font-semibold text-neutral-900 mb-3">Typography Preview</h4>
        <div className="space-y-3 p-4 bg-neutral-50 rounded-lg">
          <div style={{ fontSize: `${settings.fonts.titleSize}px`, fontFamily: settings.fonts.family }}>
            Invoice Title - {settings.fonts.titleSize}pt
          </div>
          <div style={{ fontSize: `${settings.fonts.headingSize}px`, fontFamily: settings.fonts.family }}>
            Section Heading - {settings.fonts.headingSize}pt
          </div>
          <div style={{ fontSize: `${settings.fonts.bodySize}px`, fontFamily: settings.fonts.family }}>
            Body text content - {settings.fonts.bodySize}pt
          </div>
          <div style={{ fontSize: `${settings.fonts.smallSize}px`, fontFamily: settings.fonts.family }}>
            Small text and footnotes - {settings.fonts.smallSize}pt
          </div>
        </div>
      </div>
    </div>
  );

  const renderLayoutTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Layout Configuration</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Adjust the layout and spacing of your PDF documents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Header Style
          </label>
          <select
            value={settings.layout.headerStyle}
            onChange={(e) => handleSettingChange('layout', 'headerStyle', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          >
            <option value="centered">Centered</option>
            <option value="left">Left Aligned</option>
            <option value="right">Right Aligned</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Logo Position
          </label>
          <select
            value={settings.layout.logoPosition}
            onChange={(e) => handleSettingChange('layout', 'logoPosition', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="none">No Logo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Page Size
          </label>
          <select
            value={settings.layout.pageSize}
            onChange={(e) => handleSettingChange('layout', 'pageSize', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          >
            <option value="a4">A4 (210 x 297 mm)</option>
            <option value="letter">Letter (8.5 x 11 in)</option>
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.layout.showWatermark}
              onChange={(e) => handleSettingChange('layout', 'showWatermark', e.target.checked)}
              className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
            />
            <span className="text-sm font-medium text-neutral-700">Show Watermark</span>
          </label>
          <p className="text-xs text-neutral-500 mt-1 ml-6">Add a subtle watermark to the document</p>
        </div>
      </div>

      <div className="pt-6 border-t border-neutral-200">
        <h4 className="text-sm font-semibold text-neutral-900 mb-4">Page Margins (mm)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Top</label>
            <input
              type="number"
              value={settings.layout.margins.top}
              onChange={(e) => handleSettingChange('layout', 'margins', { ...settings.layout.margins, top: parseInt(e.target.value) })}
              min="10"
              max="50"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Bottom</label>
            <input
              type="number"
              value={settings.layout.margins.bottom}
              onChange={(e) => handleSettingChange('layout', 'margins', { ...settings.layout.margins, bottom: parseInt(e.target.value) })}
              min="10"
              max="50"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Left</label>
            <input
              type="number"
              value={settings.layout.margins.left}
              onChange={(e) => handleSettingChange('layout', 'margins', { ...settings.layout.margins, left: parseInt(e.target.value) })}
              min="10"
              max="50"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Right</label>
            <input
              type="number"
              value={settings.layout.margins.right}
              onChange={(e) => handleSettingChange('layout', 'margins', { ...settings.layout.margins, right: parseInt(e.target.value) })}
              min="10"
              max="50"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrandingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Branding & Identity</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Add your firm's branding elements to invoices and pro forma
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Firm Name
          </label>
          <input
            type="text"
            value={settings.branding.firmName}
            onChange={(e) => handleSettingChange('branding', 'firmName', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            placeholder="Your Law Firm Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Tagline
          </label>
          <input
            type="text"
            value={settings.branding.tagline}
            onChange={(e) => handleSettingChange('branding', 'tagline', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            placeholder="Excellence in Legal Services"
          />
          <p className="text-xs text-neutral-500 mt-1">Optional tagline displayed below firm name</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Firm Logo
          </label>
          <div className="space-y-3">
            {settings.branding.logo && (
              <div className="relative w-48 h-48 border border-neutral-300 rounded-lg overflow-hidden bg-neutral-50">
                <img 
                  src={settings.branding.logo} 
                  alt="Firm logo" 
                  className="w-full h-full object-contain p-4"
                />
              </div>
            )}
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  {settings.branding.logo ? 'Change Logo' : 'Upload Logo'}
                </div>
              </label>
              {settings.branding.logo && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSettingChange('branding', 'logo', null)}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Recommended: PNG or JPG, max 2MB, transparent background preferred
            </p>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.branding.showLogo}
              onChange={(e) => handleSettingChange('branding', 'showLogo', e.target.checked)}
              className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
            />
            <span className="text-sm font-medium text-neutral-700">Display logo on PDFs</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Content Options</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Configure what information appears on your invoices and pro forma
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.content.showLineNumbers}
            onChange={(e) => handleSettingChange('content', 'showLineNumbers', e.target.checked)}
            className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
          />
          <div>
            <span className="text-sm font-medium text-neutral-700">Show Line Numbers</span>
            <p className="text-xs text-neutral-500">Display line numbers in the items table</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.content.showTaxBreakdown}
            onChange={(e) => handleSettingChange('content', 'showTaxBreakdown', e.target.checked)}
            className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
          />
          <div>
            <span className="text-sm font-medium text-neutral-700">Show Tax Breakdown</span>
            <p className="text-xs text-neutral-500">Display detailed VAT/tax calculations</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.content.showPaymentTerms}
            onChange={(e) => handleSettingChange('content', 'showPaymentTerms', e.target.checked)}
            className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
          />
          <div>
            <span className="text-sm font-medium text-neutral-700">Show Payment Terms</span>
            <p className="text-xs text-neutral-500">Include payment terms and conditions</p>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.content.showBankingDetails}
            onChange={(e) => handleSettingChange('content', 'showBankingDetails', e.target.checked)}
            className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
          />
          <div>
            <span className="text-sm font-medium text-neutral-700">Show Banking Details</span>
            <p className="text-xs text-neutral-500">Display bank account information in footer</p>
          </div>
        </label>
      </div>

      <div className="pt-6 border-t border-neutral-200">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Payment Terms Text
        </label>
        <textarea
          value={settings.content.paymentTermsText}
          onChange={(e) => handleSettingChange('content', 'paymentTermsText', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          placeholder="Enter your payment terms..."
        />
        <p className="text-xs text-neutral-500 mt-1">
          Customize the payment terms text that appears on invoices
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Custom Footer Text
        </label>
        <textarea
          value={settings.content.customFooterText}
          onChange={(e) => handleSettingChange('content', 'customFooterText', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
          placeholder="Optional custom text for the footer..."
        />
        <p className="text-xs text-neutral-500 mt-1">
          Additional text to display in the document footer
        </p>
      </div>
    </div>
  );

  const renderBankingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Banking Details</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Configure banking information displayed on invoices
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Bank Name
          </label>
          <input
            type="text"
            value={settings.bankingDetails.bankName}
            onChange={(e) => handleSettingChange('bankingDetails', 'bankName', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            placeholder="Standard Bank"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Account Name
          </label>
          <input
            type="text"
            value={settings.bankingDetails.accountName}
            onChange={(e) => handleSettingChange('bankingDetails', 'accountName', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            placeholder="Legal Practice Trust Account"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={settings.bankingDetails.accountNumber}
              onChange={(e) => handleSettingChange('bankingDetails', 'accountNumber', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              placeholder="123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Branch Code
            </label>
            <input
              type="text"
              value={settings.bankingDetails.branchCode}
              onChange={(e) => handleSettingChange('bankingDetails', 'branchCode', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
              placeholder="051001"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            SWIFT Code (Optional)
          </label>
          <input
            type="text"
            value={settings.bankingDetails.swiftCode}
            onChange={(e) => handleSettingChange('bankingDetails', 'swiftCode', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
            placeholder="SBZAZAJJ"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Required for international payments
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-neutral-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Banking Details Preview</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <p><strong>Bank:</strong> {settings.bankingDetails.bankName || 'Not set'}</p>
                <p><strong>Account Name:</strong> {settings.bankingDetails.accountName || 'Not set'}</p>
                <p><strong>Account Number:</strong> {settings.bankingDetails.accountNumber || 'Not set'}</p>
                <p><strong>Branch Code:</strong> {settings.bankingDetails.branchCode || 'Not set'}</p>
                {settings.bankingDetails.swiftCode && (
                  <p><strong>SWIFT Code:</strong> {settings.bankingDetails.swiftCode}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Invoice & Pro Forma Designer</h1>
              <p className="text-neutral-600 mt-2">
                Customize the appearance of your PDF invoices and pro forma
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLivePreview(!showLivePreview)}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showLivePreview ? 'Hide' : 'Show'} Live Preview
              </button>
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                disabled={isLoading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              <button
                onClick={handlePreview}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4 mr-2" />
                Full Preview
              </button>
              <Button
                variant="primary"
                onClick={handleSaveSettings}
                disabled={!hasUnsavedChanges || isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Design'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className={showLivePreview ? "xl:col-span-3" : "xl:col-span-4"}>
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {[
                    { id: 'colors', label: 'Colors', icon: Palette },
                    { id: 'fonts', label: 'Typography', icon: Type },
                    { id: 'layout', label: 'Layout', icon: Layout },
                    { id: 'branding', label: 'Branding', icon: ImageIcon },
                    { id: 'content', label: 'Content', icon: FileText },
                    { id: 'banking', label: 'Banking', icon: Settings }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-mpondo-gold text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <h4 className="text-sm font-semibold text-neutral-900 mb-3">Preview Mode</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={previewMode === 'invoice'}
                        onChange={() => setPreviewMode('invoice')}
                        className="text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                      />
                      <span className="text-sm text-neutral-700">Invoice</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={previewMode === 'proforma'}
                        onChange={() => setPreviewMode('proforma')}
                        className="text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                      />
                      <span className="text-sm text-neutral-700">Pro Forma</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className={showLivePreview ? "xl:col-span-5" : "xl:col-span-8"}>
            <Card>
              <CardContent className="p-8">
                {activeTab === 'colors' && renderColorsTab()}
                {activeTab === 'fonts' && renderFontsTab()}
                {activeTab === 'layout' && renderLayoutTab()}
                {activeTab === 'branding' && renderBrandingTab()}
                {activeTab === 'content' && renderContentTab()}
                {activeTab === 'banking' && renderBankingTab()}
              </CardContent>
            </Card>
          </div>

          {showLivePreview && (
            <div className="xl:col-span-4">
              <Card className="sticky top-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">Live Preview</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPreviewMode('invoice')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          previewMode === 'invoice'
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        Invoice
                      </button>
                      <button
                        onClick={() => setPreviewMode('proforma')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          previewMode === 'proforma'
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        Pro Forma
                      </button>
                    </div>
                  </div>
                  
                  <div 
                    className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-inner"
                    style={{ 
                      height: '800px',
                      transform: 'scale(0.7)',
                      transformOrigin: 'top left',
                      width: '142.857%'
                    }}
                  >
                    <div 
                      style={{
                        fontFamily: settings.fonts.family,
                        padding: `${settings.layout.margins.top}mm ${settings.layout.margins.right}mm ${settings.layout.margins.bottom}mm ${settings.layout.margins.left}mm`,
                        color: settings.colors.text,
                        background: settings.colors.background,
                        minHeight: '100%'
                      }}
                    >
                      <div 
                        style={{
                          textAlign: settings.layout.headerStyle,
                          marginBottom: '20px',
                          paddingBottom: '10px',
                          borderBottom: `2px solid ${settings.colors.primary}`
                        }}
                      >
                        {settings.branding.showLogo && settings.branding.logo && (
                          <img 
                            src={settings.branding.logo} 
                            alt="Logo" 
                            style={{
                              maxWidth: '100px',
                              marginBottom: '8px',
                              display: 'block',
                              margin: settings.layout.logoPosition === 'center' ? '0 auto 8px' : 
                                     settings.layout.logoPosition === 'right' ? '0 0 8px auto' : '0 0 8px 0'
                            }}
                          />
                        )}
                        <h1 
                          style={{
                            fontSize: `${settings.fonts.titleSize}pt`,
                            color: settings.colors.primary,
                            fontWeight: 'bold',
                            margin: 0
                          }}
                        >
                          {previewMode === 'invoice' ? 'INVOICE' : 'PRO FORMA INVOICE'}
                        </h1>
                        {settings.branding.firmName && (
                          <div style={{ fontSize: `${settings.fonts.headingSize}pt`, fontWeight: 'bold', margin: '8px 0 4px 0' }}>
                            {settings.branding.firmName}
                          </div>
                        )}
                        {settings.branding.tagline && (
                          <p style={{ fontSize: `${settings.fonts.bodySize}pt`, color: settings.colors.secondary, margin: 0 }}>
                            {settings.branding.tagline}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', margin: '15px 0' }}>
                        <div>
                          <div style={{ fontSize: `${settings.fonts.headingSize}pt`, color: settings.colors.primary, fontWeight: 'bold', marginBottom: '8px' }}>
                            BILL TO:
                          </div>
                          <p style={{ fontSize: `${settings.fonts.bodySize}pt`, margin: 0, lineHeight: 1.6 }}>
                            <strong>Client Name</strong><br />
                            client@example.com
                          </p>
                        </div>
                        <div>
                          <div style={{ fontSize: `${settings.fonts.headingSize}pt`, color: settings.colors.primary, fontWeight: 'bold', marginBottom: '8px' }}>
                            {previewMode === 'invoice' ? 'INVOICE' : 'PRO FORMA'} DETAILS:
                          </div>
                          <p style={{ fontSize: `${settings.fonts.bodySize}pt`, margin: 0, lineHeight: 1.6 }}>
                            <strong>Number:</strong> {previewMode === 'invoice' ? 'INV-001' : 'PF-001'}<br />
                            <strong>Date:</strong> {new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '15px 0', fontSize: `${settings.fonts.bodySize}pt` }}>
                        <thead>
                          <tr>
                            {settings.content.showLineNumbers && <th style={{ background: settings.colors.primary, color: 'white', padding: '6px', textAlign: 'left', width: '30px' }}>#</th>}
                            <th style={{ background: settings.colors.primary, color: 'white', padding: '6px', textAlign: 'left' }}>Description</th>
                            <th style={{ background: settings.colors.primary, color: 'white', padding: '6px', textAlign: 'center', width: '50px' }}>Qty</th>
                            <th style={{ background: settings.colors.primary, color: 'white', padding: '6px', textAlign: 'right', width: '80px' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {settings.content.showLineNumbers && <td style={{ padding: '5px', borderBottom: '1px solid #e0e0e0' }}>1</td>}
                            <td style={{ padding: '5px', borderBottom: '1px solid #e0e0e0' }}>Legal consultation</td>
                            <td style={{ padding: '5px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>2</td>
                            <td style={{ padding: '5px', borderBottom: '1px solid #e0e0e0', textAlign: 'right' }}>R 5,000</td>
                          </tr>
                          <tr>
                            {settings.content.showLineNumbers && <td style={{ padding: '5px', borderBottom: '1px solid #e0e0e0' }}>2</td>}
                            <td style={{ padding: '5px', borderBottom: '1px solid #e0e0e0' }}>Document prep</td>
                            <td style={{ padding: '5px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>1</td>
                            <td style={{ padding: '5px', borderBottom: '1px solid #e0e0e0', textAlign: 'right' }}>R 3,500</td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ marginTop: '15px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '4px 0', fontSize: `${settings.fonts.bodySize}pt` }}>
                          <span style={{ marginRight: '15px', minWidth: '80px' }}>Subtotal:</span>
                          <span style={{ minWidth: '80px', textAlign: 'right' }}>R 8,500</span>
                        </div>
                        {settings.content.showTaxBreakdown && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '4px 0', fontSize: `${settings.fonts.bodySize}pt` }}>
                            <span style={{ marginRight: '15px', minWidth: '80px' }}>VAT (15%):</span>
                            <span style={{ minWidth: '80px', textAlign: 'right' }}>R 1,275</span>
                          </div>
                        )}
                        <div 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            margin: '8px 0 0 0', 
                            fontSize: `${settings.fonts.headingSize}pt`,
                            fontWeight: 'bold',
                            color: settings.colors.primary,
                            borderTop: `2px solid ${settings.colors.primary}`,
                            paddingTop: '8px'
                          }}
                        >
                          <span style={{ marginRight: '15px', minWidth: '80px' }}>TOTAL:</span>
                          <span style={{ minWidth: '80px', textAlign: 'right' }}>R 9,775</span>
                        </div>
                      </div>

                      {settings.content.showBankingDetails && (
                        <div style={{ marginTop: '20px', fontSize: `${settings.fonts.smallSize}pt`, color: settings.colors.secondary }}>
                          <div style={{ fontSize: `${settings.fonts.bodySize}pt`, color: settings.colors.primary, fontWeight: 'bold', marginBottom: '6px' }}>
                            BANKING DETAILS:
                          </div>
                          <p style={{ margin: 0, lineHeight: 1.5 }}>
                            <strong>Bank:</strong> {settings.bankingDetails.bankName}<br />
                            <strong>Account:</strong> {settings.bankingDetails.accountName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {hasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  You have unsaved changes
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Don't forget to save your design settings
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDesignerPage;
