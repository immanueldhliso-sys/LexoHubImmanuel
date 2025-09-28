import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'practice' | 'integrations' | 'compliance' | 'billing'>('profile');
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsAlerts: false,
    invoiceUpdates: true,
    matterDeadlines: true,
    paymentReceived: true
  });
  const [practiceSettings, setPracticeSettings] = useState({
    firmName: 'Mpondo & Associates',
    practiceAreas: ['Commercial Litigation', 'Employment Law', 'Mining Law'],
    defaultHourlyRate: 2500,
    currency: 'ZAR',
    timeZone: 'Africa/Johannesburg',
    workingHours: { start: '08:00', end: '17:00' },
    billingCycle: 'monthly'
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
          <p className="text-neutral-600 mt-1">Manage your practice configuration and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
          {(['profile', 'practice', 'integrations', 'compliance', 'billing'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab === 'profile' ? 'Profile' :
               tab === 'practice' ? 'Practice' :
               tab === 'integrations' ? 'Integrations' :
               tab === 'compliance' ? 'Compliance' :
               'Billing'}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-neutral-900">Personal Information</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Thabo"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Mpondo"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue="thabo@mpondolaw.co.za"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      defaultValue="+27 11 123 4567"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      defaultValue="Senior Partner & Advocate"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-neutral-900">Notification Preferences</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-neutral-900">
                          {key === 'emailReminders' ? 'Email Reminders' :
                           key === 'smsAlerts' ? 'SMS Alerts' :
                           key === 'invoiceUpdates' ? 'Invoice Updates' :
                           key === 'matterDeadlines' ? 'Matter Deadlines' :
                           'Payment Received'}
                        </label>
                        <p className="text-xs text-neutral-600">
                          {key === 'emailReminders' ? 'Receive email notifications for important events' :
                           key === 'smsAlerts' ? 'Get SMS alerts for urgent matters' :
                           key === 'invoiceUpdates' ? 'Notifications when invoices are paid or overdue' :
                           key === 'matterDeadlines' ? 'Alerts for upcoming matter deadlines' :
                           'Notifications when payments are received'}
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-mpondo-gold-500' : 'bg-neutral-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

          <div className="flex justify-end space-x-4">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Save Changes</Button>
          </div>
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-900">Practice Information</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Firm Name
                  </label>
                  <input
                    type="text"
                    value={practiceSettings.firmName}
                    onChange={(e) => setPracticeSettings(prev => ({ ...prev, firmName: e.target.value }))}
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
                            setPracticeSettings(prev => ({ ...prev, practiceAreas: newAreas }));
                          }}
                          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const newAreas = practiceSettings.practiceAreas.filter((_, i) => i !== index);
                            setPracticeSettings(prev => ({ ...prev, practiceAreas: newAreas }));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPracticeSettings(prev => ({ 
                        ...prev, 
                        practiceAreas: [...prev.practiceAreas, 'New Practice Area'] 
                      }))}
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
                <h2 className="text-xl font-semibold text-neutral-900">Working Hours & Billing</h2>
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
            <Button variant="secondary">Reset to Defaults</Button>
            <Button variant="primary">Save All Settings</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;