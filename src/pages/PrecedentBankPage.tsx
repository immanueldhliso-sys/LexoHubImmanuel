import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Star,
  CheckCircle,
  TrendingUp,
  Calendar,
  Tag,
  Eye,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { DocumentIntelligenceService, type PrecedentDocument, type PrecedentType } from '../services/api/document-intelligence.service';
import { toast } from 'react-hot-toast';

const PRECEDENT_TYPES: { value: PrecedentType; label: string }[] = [
  { value: 'pleadings', label: 'Pleadings' },
  { value: 'notices', label: 'Notices' },
  { value: 'affidavits', label: 'Affidavits' },
  { value: 'heads_of_argument', label: 'Heads of Argument' },
  { value: 'opinions', label: 'Legal Opinions' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'court_orders', label: 'Court Orders' },
  { value: 'other', label: 'Other' }
];

const COURT_LEVELS = [
  { value: 'magistrate', label: 'Magistrate Court' },
  { value: 'high_court', label: 'High Court' },
  { value: 'sca', label: 'Supreme Court of Appeal' },
  { value: 'constitutional', label: 'Constitutional Court' }
];

export const PrecedentBankPage: React.FC = () => {
  const [precedents, setPrecedents] = useState<PrecedentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    precedentType: '' as PrecedentType | '',
    category: '',
    bar: '',
    courtLevel: '',
    verifiedOnly: false
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPrecedent, setSelectedPrecedent] = useState<PrecedentDocument | null>(null);

  useEffect(() => {
    loadPrecedents();
  }, [filters]);

  const loadPrecedents = async () => {
    setLoading(true);
    try {
      const results = await DocumentIntelligenceService.searchPrecedents({
        search: filters.search || undefined,
        precedentType: filters.precedentType || undefined,
        category: filters.category || undefined,
        bar: filters.bar || undefined,
        courtLevel: filters.courtLevel || undefined,
        verifiedOnly: filters.verifiedOnly
      });
      setPrecedents(results);
    } catch (error) {
      console.error('Error loading precedents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (precedent: PrecedentDocument) => {
    try {
      const url = await DocumentIntelligenceService.downloadPrecedent(precedent.id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading precedent:', error);
    }
  };

  const handleRating = async (precedentId: string, rating: number) => {
    try {
      await DocumentIntelligenceService.ratePrecedent(precedentId, rating);
      loadPrecedents(); // Refresh to show updated rating
    } catch (error) {
      console.error('Error rating precedent:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Precedent Bank</h1>
              <p className="text-neutral-600 mt-1">
                Community-driven legal document templates and precedents
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Precedent
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-mpondo-gold-600" />
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{precedents.length}</p>
                  <p className="text-sm text-neutral-600">Total Precedents</p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success-600" />
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {precedents.filter(p => p.isVerified).length}
                  </p>
                  <p className="text-sm text-neutral-600">Verified Documents</p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-judicial-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {precedents.reduce((sum, p) => sum + p.downloadCount, 0)}
                  </p>
                  <p className="text-sm text-neutral-600">Total Downloads</p>
                </div>
              </div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-mpondo-gold-600" />
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {(precedents.reduce((sum, p) => sum + p.averageRating, 0) / precedents.length || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-neutral-600">Average Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Filter by:</span>
            </div>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search precedents..."
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              />
            </div>

            <select
              value={filters.precedentType}
              onChange={(e) => setFilters({ ...filters, precedentType: e.target.value as PrecedentType | '' })}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            >
              <option value="">All Types</option>
              {PRECEDENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={filters.courtLevel}
              onChange={(e) => setFilters({ ...filters, courtLevel: e.target.value })}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            >
              <option value="">All Courts</option>
              {COURT_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>

            <select
              value={filters.bar}
              onChange={(e) => setFilters({ ...filters, bar: e.target.value })}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            >
              <option value="">All Bars</option>
              <option value="johannesburg">Johannesburg Bar</option>
              <option value="cape_town">Cape Town Bar</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                className="w-4 h-4 text-mpondo-gold-600 border-neutral-300 rounded focus:ring-mpondo-gold-500"
              />
              <span className="text-sm text-neutral-700">Verified only</span>
            </label>
          </div>
        </div>

        {/* Precedents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
          </div>
        ) : precedents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-2">No precedents found</p>
            <p className="text-sm text-neutral-500">Try adjusting your filters or upload the first one</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {precedents.map(precedent => (
              <div
                key={precedent.id}
                className="bg-white rounded-lg border border-neutral-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedPrecedent(precedent)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {precedent.isVerified && (
                          <CheckCircle className="w-4 h-4 text-success-600" />
                        )}
                        <span className="text-xs font-medium text-neutral-500">
                          {PRECEDENT_TYPES.find(t => t.value === precedent.precedentType)?.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-neutral-900 mb-1">{precedent.title}</h3>
                      {precedent.description && (
                        <p className="text-sm text-neutral-600 line-clamp-2">{precedent.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {precedent.courtLevel && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Scale className="w-4 h-4 text-neutral-400" />
                        <span>{COURT_LEVELS.find(c => c.value === precedent.courtLevel)?.label}</span>
                      </div>
                    )}
                    {precedent.yearCreated && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span>Created {precedent.yearCreated}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>{precedent.downloadCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        <span>{precedent.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(precedent);
                      }}
                      className="px-3 py-1.5 text-sm text-mpondo-gold-600 hover:bg-mpondo-gold-50 rounded-lg transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Precedent Detail Modal */}
      {selectedPrecedent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">{selectedPrecedent.title}</h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    {PRECEDENT_TYPES.find(t => t.value === selectedPrecedent.precedentType)?.label}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPrecedent(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {selectedPrecedent.description && (
                <div className="mb-6">
                  <h3 className="font-medium text-neutral-900 mb-2">Description</h3>
                  <p className="text-neutral-700">{selectedPrecedent.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedPrecedent.courtLevel && (
                  <div>
                    <p className="text-sm text-neutral-600">Court Level</p>
                    <p className="font-medium text-neutral-900">
                      {COURT_LEVELS.find(c => c.value === selectedPrecedent.courtLevel)?.label}
                    </p>
                  </div>
                )}
                {selectedPrecedent.bar && (
                  <div>
                    <p className="text-sm text-neutral-600">Bar</p>
                    <p className="font-medium text-neutral-900">
                      {selectedPrecedent.bar === 'johannesburg' ? 'Johannesburg' : 'Cape Town'} Bar
                    </p>
                  </div>
                )}
                {selectedPrecedent.yearCreated && (
                  <div>
                    <p className="text-sm text-neutral-600">Year Created</p>
                    <p className="font-medium text-neutral-900">{selectedPrecedent.yearCreated}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-neutral-600">Version</p>
                  <p className="font-medium text-neutral-900">v{selectedPrecedent.version}</p>
                </div>
              </div>

              {selectedPrecedent.tags && selectedPrecedent.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-neutral-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrecedent.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-medium text-neutral-900 mb-2">Usage Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <Download className="w-5 h-5 text-neutral-600 mx-auto mb-1" />
                    <p className="text-lg font-semibold text-neutral-900">{selectedPrecedent.downloadCount}</p>
                    <p className="text-xs text-neutral-600">Downloads</p>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <Eye className="w-5 h-5 text-neutral-600 mx-auto mb-1" />
                    <p className="text-lg font-semibold text-neutral-900">{selectedPrecedent.usageCount}</p>
                    <p className="text-xs text-neutral-600">Uses</p>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded-lg">
                    <Star className="w-5 h-5 text-neutral-600 mx-auto mb-1" />
                    <p className="text-lg font-semibold text-neutral-900">{selectedPrecedent.averageRating.toFixed(1)}</p>
                    <p className="text-xs text-neutral-600">Rating</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-neutral-900 mb-2">Rate this precedent</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => handleRating(selectedPrecedent.id, rating)}
                      className="p-1 hover:bg-neutral-100 rounded transition-colors"
                    >
                      <Star className={`w-6 h-6 ${
                        rating <= Math.round(selectedPrecedent.averageRating)
                          ? 'text-mpondo-gold-500 fill-current'
                          : 'text-neutral-300'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPrecedent(null)}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(selectedPrecedent)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

