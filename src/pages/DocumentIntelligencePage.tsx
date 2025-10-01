import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  FileText, 
  Zap, 
  Search,
  Upload,
  BookOpen,
  TrendingUp,
  Star,
  Download,
  Filter,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import { DocumentIntelligenceService, type PrecedentDocument, type GeneratedFeeNarrative } from '../services/api/document-intelligence.service';
import { BriefAnalysisModal } from '../components/document-intelligence/BriefAnalysisModal';
import { FeeNarrativeGeneratorModal } from '../components/document-intelligence/FeeNarrativeGeneratorModal';
import { PrecedentBankModal } from '../components/document-intelligence/PrecedentBankModal';
import { UploadPrecedentModal } from '../components/document-intelligence/UploadPrecedentModal';

export const DocumentIntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'narratives' | 'precedents'>('analysis');
  const [precedents, setPrecedents] = useState<PrecedentDocument[]>([]);
  const [recentNarratives, setRecentNarratives] = useState<GeneratedFeeNarrative[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showNarrativeModal, setShowNarrativeModal] = useState(false);
  const [showPrecedentModal, setShowPrecedentModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Filters
  const [precedentSearch, setPrecedentSearch] = useState('');
  const [precedentType, setPrecedentType] = useState<PrecedentType | ''>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, precedentSearch, precedentType, verifiedOnly]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'precedents') {
        const results = await DocumentIntelligenceService.searchPrecedents({
          search: precedentSearch || undefined,
          precedentType: precedentType || undefined,
          verifiedOnly
        });
        setPrecedents(results);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPrecedent = async (precedentId: string) => {
    try {
      const url = await DocumentIntelligenceService.downloadPrecedent(precedentId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading precedent:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Document Intelligence</h1>
              <p className="text-neutral-600 mt-1">
                AI-powered document analysis, fee narratives, and precedent management
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'analysis' && (
                <Button
                  onClick={() => setShowAnalysisModal(true)}
                  className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Document
                </Button>
              )}
              {activeTab === 'narratives' && (
                <Button
                  onClick={() => setShowNarrativeModal(true)}
                  className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Narrative
                </Button>
              )}
              {activeTab === 'precedents' && (
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Precedent
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-6 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'analysis'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Document Analysis
              </div>
            </button>
            <button
              onClick={() => setActiveTab('narratives')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'narratives'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Fee Narratives
              </div>
            </button>
            <button
              onClick={() => setActiveTab('precedents')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'precedents'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Precedent Bank
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Documents Analyzed</p>
                      <p className="text-2xl font-bold text-neutral-900">47</p>
                    </div>
                    <Brain className="w-8 h-8 text-mpondo-gold-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">This month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Briefs Processed</p>
                      <p className="text-2xl font-bold text-neutral-900">23</p>
                    </div>
                    <FileText className="w-8 h-8 text-judicial-blue-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Auto-populated matters</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Time Saved</p>
                      <p className="text-2xl font-bold text-neutral-900">18.5h</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-status-success-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Document processing</p>
                </CardContent>
              </Card>
            </div>

            {/* Getting Started Guide */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-900">AI Document Analysis</h3>
                <p className="text-neutral-600">Upload documents for intelligent analysis and automated matter creation</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-mpondo-gold-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-medium text-mpondo-gold-700">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900">Upload Brief Document</h4>
                        <p className="text-sm text-neutral-600">Upload PDF briefs, contracts, or legal documents</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-mpondo-gold-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-medium text-mpondo-gold-700">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900">AI Analysis</h4>
                        <p className="text-sm text-neutral-600">Extract parties, dates, issues, and key information</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-mpondo-gold-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-medium text-mpondo-gold-700">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900">Auto-Create Matter</h4>
                        <p className="text-sm text-neutral-600">Generate matter with pre-populated details</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <Button
                      onClick={() => setShowAnalysisModal(true)}
                      size="lg"
                      className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                    >
                      <Brain className="w-5 h-5 mr-2" />
                      Start Document Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'narratives' && (
          <div className="space-y-6">
            {/* Fee Narrative Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-neutral-900">AI Fee Narrative Generator</h3>
                  <p className="text-neutral-600">Generate professional fee narratives from time entries</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-mpondo-gold-500" />
                      <span className="text-sm text-neutral-700">Automatic categorization of work</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-mpondo-gold-500" />
                      <span className="text-sm text-neutral-700">Professional narrative generation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-mpondo-gold-500" />
                      <span className="text-sm text-neutral-700">Value proposition suggestions</span>
                    </div>
                    <Button
                      onClick={() => setShowNarrativeModal(true)}
                      className="w-full bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                    >
                      Generate Narrative
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-neutral-900">Narrative Templates</h3>
                  <p className="text-neutral-600">Community-shared templates for different practice areas</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">Commercial Litigation</p>
                        <p className="text-xs text-neutral-600">Used 15 times</p>
                      </div>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">Employment Law</p>
                        <p className="text-xs text-neutral-600">Used 8 times</p>
                      </div>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">Property Law</p>
                        <p className="text-xs text-neutral-600">Used 12 times</p>
                      </div>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'precedents' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700">Filter by:</span>
                </div>
                
                <select
                  value={precedentType}
                  onChange={(e) => setPrecedentType(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                >
                  <option value="">All Types</option>
                  <option value="pleadings">Pleadings</option>
                  <option value="notices">Notices</option>
                  <option value="affidavits">Affidavits</option>
                  <option value="heads_of_argument">Heads of Argument</option>
                  <option value="opinions">Opinions</option>
                  <option value="contracts">Contracts</option>
                  <option value="correspondence">Correspondence</option>
                  <option value="court_orders">Court Orders</option>
                </select>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                  />
                  <span className="text-sm text-neutral-700">Verified only</span>
                </label>

                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={precedentSearch}
                    onChange={(e) => setPrecedentSearch(e.target.value)}
                    placeholder="Search precedents..."
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                  />
                  <Button
                    onClick={() => setShowPrecedentModal(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Precedent Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
              </div>
            ) : precedents.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 mb-2">No precedents found</p>
                <p className="text-sm text-neutral-500">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {precedents.map(precedent => (
                  <Card key={precedent.id} hoverable>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-2">
                            {precedent.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded">
                              {precedent.precedentType.replace('_', ' ')}
                            </span>
                            {precedent.isVerified && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-neutral-600">
                            {precedent.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      
                      {precedent.description && (
                        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                          {precedent.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
                        <span>{precedent.downloadCount} downloads</span>
                        <span>{precedent.category}</span>
                      </div>
                      
                      <Button
                        onClick={() => handleDownloadPrecedent(precedent.id)}
                        size="sm"
                        className="w-full bg-mpondo-gold-600 hover:bg-mpondo-gold-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAnalysisModal && (
        <BriefAnalysisModal onClose={() => setShowAnalysisModal(false)} />
      )}
      
      {showNarrativeModal && (
        <FeeNarrativeGeneratorModal onClose={() => setShowNarrativeModal(false)} />
      )}
      
      {showPrecedentModal && (
        <PrecedentBankModal onClose={() => setShowPrecedentModal(false)} />
      )}
      
      {showUploadModal && (
        <UploadPrecedentModal 
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default DocumentIntelligencePage;
