import React, { useState } from 'react';
import { X, Plus, Save, RotateCcw, Download, FileText } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Icon } from '../design-system/components';
import { toast } from 'react-hot-toast';
import { DataExportModal } from '../components/data-export';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'practice' | 'integrations' | 'compliance' | 'billing' | 'templates'>('practice');
  const [practiceSettings, setPracticeSettings] = useState({
    firmName: 'Mpondo & Associates',
    practiceAreas: ['Commercial Litigation', 'Employment Law', 'Mining Law'],
    defaultHourlyRate: 2500,
    currency: 'ZAR',
    timeZone: 'Africa/Johannesburg',
    workingHours: { start: '08:00', end: '17:00' },
    billingCycle: 'monthly'
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handlePracticeSettingChange = (key: keyof typeof practiceSettings, value: string | number | string[]) => {
    setPracticeSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would make actual API calls to save settings
      toast.success('Settings saved successfully!');
      setHasUnsavedChanges(false);
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      setPracticeSettings({
        firmName: 'Mpondo & Associates',
        practiceAreas: ['Commercial Litigation', 'Employment Law', 'Mining Law'],
        defaultHourlyRate: 2500,
        currency: 'ZAR',
        timeZone: 'Africa/Johannesburg',
        workingHours: { start: '08:00', end: '17:00' },
        billingCycle: 'monthly'
      });
      setHasUnsavedChanges(true);
      toast.success('Settings reset to defaults');
    }
  };

  const addPracticeArea = () => {
    const newArea = prompt('Enter new practice area:');
    if (newArea && newArea.trim()) {
      setPracticeSettings(prev => ({
        ...prev,
        practiceAreas: [...prev.practiceAreas, newArea.trim()]
      }));
      setHasUnsavedChanges(true);
    }
  };

  const removePracticeArea = (index: number) => {
    setPracticeSettings(prev => ({
      ...prev,
      practiceAreas: prev.practiceAreas.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        {/* Header */}
        <div>
          <h1 className="heading-2 text-neutral-900">Settings</h1>
          <p className="text-neutral-600 mt-1">Manage your practice configuration and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
          {(['practice', 'integrations', 'compliance', 'billing', 'templates'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab === 'practice' ? 'Practice' :
               tab === 'integrations' ? 'Integrations' :
               tab === 'compliance' ? 'Compliance' :
               tab === 'billing' ? 'Billing' :
               'Templates'}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="heading-4 text-neutral-900">Practice Information</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Firm Name
                  </label>
                  <input
                    type="text"
                    value={practiceSettings.firmName}
                    onChange={(e) => handlePracticeSettingChange('firmName', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Practice Areas
                  </label>
                  <div className="space-y-2">
                    {practiceSettings.practiceAreas.map((area, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={area}
                          onChange={(e) => {
                            const newAreas = [...practiceSettings.practiceAreas];
                            newAreas[index] = e.target.value;
                            handlePracticeSettingChange('practiceAreas', newAreas);
                          }}
                          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => removePracticeArea(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={addPracticeArea}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Practice Area</span>
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Default Hourly Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-500">R</span>
                      <input
                        type="number"
                        value={practiceSettings.defaultHourlyRate}
                        onChange={(e) => setPracticeSettings(prev => ({ 
                          ...prev, 
                          defaultHourlyRate: parseInt(e.target.value) 
                        }))}
                        className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={practiceSettings.currency}
                      onChange={(e) => setPracticeSettings(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                    >
                      <option value="ZAR">South African Rand (ZAR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="heading-4 text-neutral-900">Working Hours & Billing</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Time Zone
                  </label>
                  <select
                    value={practiceSettings.timeZone}
                    onChange={(e) => setPracticeSettings(prev => ({ ...prev, timeZone: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                  >
                    <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                    <option value="Africa/Cape_Town">Africa/Cape_Town (SAST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={practiceSettings.workingHours.start}
                      onChange={(e) => setPracticeSettings(prev => ({ 
                        ...prev, 
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={practiceSettings.workingHours.end}
                      onChange={(e) => setPracticeSettings(prev => ({ 
                        ...prev, 
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={practiceSettings.billingCycle}
                    onChange={(e) => setPracticeSettings(prev => ({ ...prev, billingCycle: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Data Export Section */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Liberate Your Data</h2>
                <p className="text-sm text-neutral-600">Export your complete practice data for backup, migration, or analysis</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-mpondo-gold-50 border border-mpondo-gold-200 rounded-lg">
                  <Download className="h-5 w-5 text-mpondo-gold-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 mb-1">Complete Data Export</h4>
                    <p className="text-sm text-neutral-600 mb-3">
                      Export all your matters, time entries, invoices, payments, documents, and notes in your preferred format. 
                      Perfect for data portability, backup, or transitioning to another system.
                    </p>
                    <ul className="text-xs text-neutral-500 space-y-1 mb-4">
                      <li>• Comprehensive matter records with all metadata</li>
                      <li>• Time tracking and billing data</li>
                      <li>• Financial records and payment history</li>
                      <li>• Document references and notes</li>
                      <li>• Multiple export formats (CSV, Excel, JSON)</li>
                    </ul>
                    <Button
                      onClick={() => setIsExportModalOpen(true)}
                      className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Practice Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Available Integrations</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'QuickBooks', description: 'Sync financial data and invoices', connected: true, icon: '📊' },
                  { name: 'Xero', description: 'Accounting and bookkeeping integration', connected: false, icon: '💼' },
                  { name: 'DocuSign', description: 'Electronic signature management', connected: true, icon: '✍️' },
                  { name: 'Microsoft 365', description: 'Email and document collaboration', connected: true, icon: '📧' },
                  { name: 'Slack', description: 'Team communication and notifications', connected: false, icon: '💬' },
                  { name: 'Zoom', description: 'Video conferencing integration', connected: false, icon: '📹' }
                ].map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <h4 className="font-medium text-neutral-900">{integration.name}</h4>
                        <p className="text-sm text-neutral-600">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        integration.connected 
                          ? 'bg-status-success-100 text-status-success-800' 
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {integration.connected ? 'Connected' : 'Not Connected'}
                      </span>
                      <Button
                        variant={integration.connected ? 'secondary' : 'primary'}
                        size="sm"
                      >
                        {integration.connected ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">API Configuration</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    API Key
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      value="••••••••••••••••"
                      readOnly
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
                    />
                    <Button variant="secondary" size="sm">
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">
                    Use this API key to integrate with external systems
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://your-domain.com/webhooks"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-600 mt-1">
                    Receive real-time notifications about events
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Rate Limit
                  </label>
                  <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent">
                    <option value="100">100 requests/hour</option>
                    <option value="500">500 requests/hour</option>
                    <option value="1000">1000 requests/hour</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Regulatory Compliance</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    { name: 'POPIA Compliance', status: 'compliant', description: 'Protection of Personal Information Act compliance' },
                    { name: 'Legal Practice Act', status: 'compliant', description: 'Compliance with Legal Practice Act requirements' },
                    { name: 'Trust Account Rules', status: 'warning', description: 'Trust account management and reporting' },
                    { name: 'CPD Requirements', status: 'pending', description: 'Continuing Professional Development tracking' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-neutral-900">{item.name}</h4>
                        <p className="text-sm text-neutral-600">{item.description}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        item.status === 'compliant' ? 'bg-status-success-100 text-status-success-800' :
                        item.status === 'warning' ? 'bg-status-warning-100 text-status-warning-800' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        {item.status === 'compliant' ? 'Compliant' :
                         item.status === 'warning' ? 'Needs Attention' :
                         'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Data Security</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Two-Factor Authentication
                    </label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Secure your account with 2FA</span>
                      <Button variant="primary" size="sm">Enable</Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Data Encryption
                    </label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">End-to-end encryption enabled</span>
                      <span className="px-2 py-1 text-xs bg-status-success-100 text-status-success-800 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Backup Frequency
                    </label>
                    <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Session Timeout
                    </label>
                    <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent">
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Billing Configuration</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Invoice Template
                  </label>
                  <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent">
                    <option value="standard">Standard Template</option>
                    <option value="detailed">Detailed Template</option>
                    <option value="minimal">Minimal Template</option>
                    <option value="custom">Custom Template</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Payment Terms
                  </label>
                  <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent">
                    <option value="net15">Net 15 days</option>
                    <option value="net30">Net 30 days</option>
                    <option value="net45">Net 45 days</option>
                    <option value="net60">Net 60 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Late Fee Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      defaultValue="2"
                      min="0"
                      max="10"
                      step="0.5"
                      className="w-full px-3 py-2 pr-8 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-2 text-neutral-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Auto-send Reminders
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-neutral-700">7 days before due date</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-neutral-700">On due date</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-neutral-700">7 days after due date</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Payment Methods</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    { name: 'Bank Transfer', enabled: true, description: 'Direct bank transfers' },
                    { name: 'Credit Card', enabled: true, description: 'Visa, Mastercard, American Express' },
                    { name: 'PayPal', enabled: false, description: 'PayPal payments' },
                    { name: 'Cryptocurrency', enabled: false, description: 'Bitcoin, Ethereum' }
                  ].map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-neutral-900">{method.name}</h4>
                        <p className="text-sm text-neutral-600">{method.description}</p>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          method.enabled ? 'bg-mpondo-gold-500' : 'bg-neutral-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            method.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={handleResetToDefaults}
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveSettings}
              disabled={!hasUnsavedChanges || isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Template Settings</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Default Template Category
                  </label>
                  <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent">
                    <option value="General">General</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Employment">Employment</option>
                    <option value="Mining">Mining</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Auto-save Templates
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                    />
                    <span className="text-sm text-neutral-700">
                      Automatically save frequently used matter configurations as templates
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Template Sharing
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                    />
                    <span className="text-sm text-neutral-700">
                      Allow sharing templates with other advocates in your organization
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Template Library</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Total Templates</span>
                    <span className="text-sm text-neutral-900">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Shared Templates</span>
                    <span className="text-sm text-neutral-900">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">Most Used</span>
                    <span className="text-sm text-neutral-900">Commercial Litigation</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-neutral-200">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Manage Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-neutral-900">Template Categories</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'General', count: 3, description: 'General purpose matter templates' },
                  { name: 'Commercial', count: 4, description: 'Commercial litigation and contracts' },
                  { name: 'Employment', count: 2, description: 'Employment law matters' },
                  { name: 'Mining', count: 2, description: 'Mining law and regulations' },
                  { name: 'Personal', count: 1, description: 'Personal legal matters' }
                ].map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-neutral-900">{category.name}</h4>
                      <p className="text-sm text-neutral-600">{category.description}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                        {category.count} templates
                      </span>
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={handleResetToDefaults}
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveSettings}
              disabled={!hasUnsavedChanges || isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </div>
      )}


      {/* Data Export Modal */}
      <DataExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default SettingsPage;