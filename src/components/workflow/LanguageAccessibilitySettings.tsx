import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Volume2, 
  VolumeX,
  Eye, 
  Type,
  Mic,
  Languages,
  Settings,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { getEnhancedSpeechService, type SpeechRequest } from '../../services/enhanced-speech.service';
import VoicePlaybackComponent from '../voice/VoicePlaybackComponent';

export const LanguageAccessibilitySettings: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('medium');

  const supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', status: 'complete', progress: 100 },
    { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', status: 'complete', progress: 100 },
    { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', status: 'partial', progress: 85 },
    { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', status: 'partial', progress: 82 },
    { code: 'st', name: 'Sotho', nativeName: 'Sesotho', status: 'partial', progress: 78 },
    { code: 'tn', name: 'Tswana', nativeName: 'Setswana', status: 'partial', progress: 75 },
    { code: 've', name: 'Venda', nativeName: 'Tshivenḓa', status: 'in-progress', progress: 65 },
    { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga', status: 'in-progress', progress: 60 },
    { code: 'ss', name: 'Swati', nativeName: 'siSwati', status: 'in-progress', progress: 58 },
    { code: 'nr', name: 'Ndebele', nativeName: 'isiNdebele', status: 'in-progress', progress: 55 },
    { code: 'nso', name: 'Northern Sotho', nativeName: 'Sepedi', status: 'planned', progress: 45 }
  ];

  const accessibilityFeatures = [
    {
      id: 'screen-reader',
      name: 'Screen Reader Support',
      description: 'Full compatibility with NVDA, JAWS, and VoiceOver',
      enabled: true,
      category: 'vision'
    },
    {
      id: 'high-contrast',
      name: 'High Contrast Mode',
      description: 'Enhanced color contrast for better visibility',
      enabled: highContrast,
      category: 'vision'
    },
    {
      id: 'text-to-speech',
      name: 'Text-to-Speech',
      description: 'Audio narration of interface elements and content',
      enabled: speechEnabled,
      category: 'hearing'
    },
    {
      id: 'voice-navigation',
      name: 'Voice Navigation',
      description: 'Navigate the interface using voice commands',
      enabled: false,
      category: 'mobility'
    },
    {
      id: 'keyboard-navigation',
      name: 'Keyboard Navigation',
      description: 'Full keyboard accessibility without mouse',
      enabled: true,
      category: 'mobility'
    },
    {
      id: 'focus-indicators',
      name: 'Enhanced Focus Indicators',
      description: 'Clear visual indicators for keyboard focus',
      enabled: true,
      category: 'vision'
    }
  ];

  const translationStats = {
    totalStrings: 2847,
    translatedStrings: 2653,
    reviewedStrings: 2401,
    approvedStrings: 2398
  };

  const getLanguageStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-success-600 bg-success-100';
      case 'partial':
        return 'text-warning-600 bg-warning-100';
      case 'in-progress':
        return 'text-judicial-blue-600 bg-judicial-blue-100';
      case 'planned':
        return 'text-neutral-600 bg-neutral-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vision':
        return <Eye className="w-4 h-4" />;
      case 'hearing':
        return <Volume2 className="w-4 h-4" />;
      case 'mobility':
        return <Mic className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Interface Language</h3>
              <p className="text-neutral-600">Select your preferred language for the application interface</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Translations
              </Button>
              <Button className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Contribute Translation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedLanguages.map((language) => (
              <div
                key={language.code}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedLanguage === language.code
                    ? 'border-mpondo-gold-500 bg-mpondo-gold-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                onClick={() => setSelectedLanguage(language.code)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-neutral-900">{language.name}</h4>
                    <p className="text-sm text-neutral-600">{language.nativeName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLanguageStatusColor(language.status)}`}>
                    {language.status === 'complete' ? 'Complete' :
                     language.status === 'partial' ? 'Partial' :
                     language.status === 'in-progress' ? 'In Progress' : 'Planned'}
                  </span>
                </div>
                
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                    <span>Translation Progress</span>
                    <span>{language.progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-1.5">
                    <div 
                      className="bg-mpondo-gold-500 h-1.5 rounded-full" 
                      style={{ width: `${language.progress}%` }}
                    />
                  </div>
                </div>

                {selectedLanguage === language.code && (
                  <div className="flex gap-2 mt-3">
                    <VoicePlaybackComponent
                      text={`Hello, this is a voice test in ${language.name}. LexoHub supports natural voice synthesis for all South African languages.`}
                      language={language.code}
                      useCase="accessibility"
                      showControls={true}
                      className="flex-1"
                    />
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Translation Progress */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Translation Progress</h3>
          <p className="text-neutral-600">Current status of interface translations across all languages</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{translationStats.totalStrings}</p>
              <p className="text-sm text-neutral-600">Total Strings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-judicial-blue-600">{translationStats.translatedStrings}</p>
              <p className="text-sm text-neutral-600">Translated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning-600">{translationStats.reviewedStrings}</p>
              <p className="text-sm text-neutral-600">Reviewed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success-600">{translationStats.approvedStrings}</p>
              <p className="text-sm text-neutral-600">Approved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Features */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Accessibility Features</h3>
              <p className="text-neutral-600">Configure accessibility options for better usability</p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Advanced Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {accessibilityFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                    {getCategoryIcon(feature.category)}
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-900">{feature.name}</h4>
                    <p className="text-sm text-neutral-600">{feature.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {feature.enabled ? (
                    <CheckCircle className="w-5 h-5 text-success-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-neutral-400" />
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feature.enabled}
                      onChange={() => {}}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mpondo-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mpondo-gold-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display & Font Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Display & Font Settings</h3>
          <p className="text-neutral-600">Customize visual appearance for better readability</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Font Size
              </label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              >
                <option value="small">Small (14px)</option>
                <option value="medium">Medium (16px)</option>
                <option value="large">Large (18px)</option>
                <option value="x-large">Extra Large (20px)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                High Contrast Mode
              </label>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mpondo-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mpondo-gold-600"></div>
                </label>
                <span className="text-sm text-neutral-600">
                  {highContrast ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice & Audio Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Voice & Audio Settings</h3>
          <p className="text-neutral-600">Configure text-to-speech and voice interaction features</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
              <div>
                <h4 className="font-medium text-neutral-900">Text-to-Speech</h4>
                <p className="text-sm text-neutral-600">Read interface elements and content aloud</p>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline">
                  <Play className="w-3 h-3 mr-1" />
                  Test Voice
                </Button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={speechEnabled}
                    onChange={(e) => setSpeechEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mpondo-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mpondo-gold-600"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Voice Speed
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  defaultValue="1"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Voice Language
                </label>
                <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500">
                  <option value="en-ZA">English (South Africa)</option>
                  <option value="af-ZA">Afrikaans (South Africa)</option>
                  <option value="zu-ZA">Zulu (South Africa)</option>
                  <option value="xh-ZA">Xhosa (South Africa)</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Languages className="w-12 h-12 text-mpondo-gold-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Real-time Translation</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Translate documents and content between supported languages instantly
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Try Translation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Volume2 className="w-12 h-12 text-judicial-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Multi-language Voice</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Text-to-speech support in all 11 official South African languages
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Voice Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Type className="w-12 h-12 text-success-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Cultural Adaptation</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Culturally appropriate translations and localized legal terminology
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Learn More
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
