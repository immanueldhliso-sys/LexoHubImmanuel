import React, { useState } from 'react';
import { X, Search, Download, Star, Eye, Filter } from 'lucide-react';
import { DocumentIntelligenceService, type PrecedentDocument } from '../../services/api/document-intelligence.service';

interface PrecedentBankModalProps {
  onClose: () => void;
}

export const PrecedentBankModal: React.FC<PrecedentBankModalProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [precedentType, setPrecedentType] = useState('');
  const [category, setCategory] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [results, setResults] = useState<PrecedentDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim() && !precedentType && !category) {
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const searchResults = await DocumentIntelligenceService.searchPrecedents({
        search: searchTerm || undefined,
        precedentType: precedentType || undefined,
        category: category || undefined,
        verifiedOnly
      });
      setResults(searchResults);
    } catch (error: unknown) {
      console.error('Error searching precedents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (precedentId: string) => {
    try {
      const url = await DocumentIntelligenceService.downloadPrecedent(precedentId);
      window.open(url, '_blank');
    } catch (error: unknown) {
      console.error('Error downloading precedent:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Community Precedent Bank</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filters */}
        <div className="p-6 border-b border-neutral-200 bg-neutral-50">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search precedents by title, description, or content..."
                  className="w-full px-3 py-2 pr-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                />
                <Search className="w-5 h-5 text-neutral-400 absolute right-3 top-2.5" />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                <span className="text-sm font-medium text-neutral-700">Filters:</span>
              </div>
              
              <select
                value={precedentType}
                onChange={(e) => setPrecedentType(e.target.value)}
                className="px-3 py-1 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
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

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-1 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              >
                <option value="">All Categories</option>
                <option value="Commercial Law">Commercial Law</option>
                <option value="Employment Law">Employment Law</option>
                <option value="Property Law">Property Law</option>
                <option value="Criminal Law">Criminal Law</option>
                <option value="Family Law">Family Law</option>
                <option value="Constitutional Law">Constitutional Law</option>
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
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
            </div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-16 h-16 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Search Precedent Bank</h3>
              <p className="text-neutral-600 max-w-md">
                Search our community database of legal precedents, templates, and documents 
                shared by advocates across South Africa.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-16 h-16 text-neutral-300 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No Results Found</h3>
              <p className="text-neutral-600">
                Try adjusting your search terms or filters to find relevant precedents.
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-neutral-600">
                  Found {results.length} precedent{results.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="space-y-4">
                {results.map(precedent => (
                  <div key={precedent.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 mb-1">
                          {precedent.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded">
                            {precedent.precedentType.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {precedent.category}
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
                      <p className="text-sm text-neutral-600 mb-3">
                        {precedent.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>{precedent.downloadCount} downloads</span>
                        <span>{precedent.usageCount} uses</span>
                        {precedent.yearCreated && <span>{precedent.yearCreated}</span>}
                        {precedent.bar && <span>{precedent.bar}</span>}
                      </div>
                      
                      <button
                        onClick={() => handleDownload(precedent.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-mpondo-gold-600 text-white text-sm rounded hover:bg-mpondo-gold-700 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <p>Contribute to the community by sharing your own precedents</p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
