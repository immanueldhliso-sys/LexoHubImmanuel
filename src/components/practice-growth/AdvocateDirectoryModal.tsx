import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  Clock, 
  Award,
  Globe,
  Mail,
  Phone,
  CheckCircle
} from 'lucide-react';
import { PracticeGrowthService, type AdvocateProfileWithDetails, type SpecialisationCategory, type AdvocateSpecialisation } from '../../services/api/practice-growth.service';
import { toast } from 'react-hot-toast';

interface AdvocateDirectoryModalProps {
  onClose: () => void;
}

const SPECIALISATION_OPTIONS: { value: SpecialisationCategory; label: string }[] = [
  { value: 'administrative_law', label: 'Administrative Law' },
  { value: 'banking_finance', label: 'Banking & Finance' },
  { value: 'commercial_litigation', label: 'Commercial Litigation' },
  { value: 'constitutional_law', label: 'Constitutional Law' },
  { value: 'construction_law', label: 'Construction Law' },
  { value: 'criminal_law', label: 'Criminal Law' },
  { value: 'employment_law', label: 'Employment Law' },
  { value: 'environmental_law', label: 'Environmental Law' },
  { value: 'family_law', label: 'Family Law' },
  { value: 'insurance_law', label: 'Insurance Law' },
  { value: 'intellectual_property', label: 'Intellectual Property' },
  { value: 'international_law', label: 'International Law' },
  { value: 'medical_law', label: 'Medical Law' },
  { value: 'mining_law', label: 'Mining Law' },
  { value: 'property_law', label: 'Property Law' },
  { value: 'tax_law', label: 'Tax Law' },
  { value: 'other', label: 'Other' }
];

export const AdvocateDirectoryModal: React.FC<AdvocateDirectoryModalProps> = ({ onClose }) => {
  const [advocates, setAdvocates] = useState<AdvocateProfileWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    specialisation: '' as SpecialisationCategory | '',
    bar: '',
    acceptingReferrals: true
  });
  const [selectedAdvocate, setSelectedAdvocate] = useState<AdvocateProfileWithDetails | null>(null);

  useEffect(() => {
    searchAdvocates();
  }, [filters]);

  const searchAdvocates = async () => {
    setLoading(true);
    try {
      const results = await PracticeGrowthService.searchAdvocateDirectory({
        specialisation: filters.specialisation || undefined,
        bar: filters.bar || undefined,
        acceptingReferrals: filters.acceptingReferrals,
        search: searchQuery || undefined
      });
      setAdvocates(results);
    } catch (error) {
      console.error('Error searching advocates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchAdvocates();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Advocate Directory</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="border-b border-neutral-200 px-6 py-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or expertise..."
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Filter by:</span>
            </div>
            
            <select
              value={filters.specialisation}
              onChange={(e) => setFilters({ ...filters, specialisation: e.target.value as SpecialisationCategory | '' })}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            >
              <option value="">All Specialisations</option>
              {SPECIALISATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={filters.bar}
              onChange={(e) => setFilters({ ...filters, bar: e.target.value })}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
            >
              <option value="">All Bars</option>
              <option value="johannesburg">Johannesburg Bar</option>
              <option value="cape_town">Cape Town Bar</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.acceptingReferrals}
                onChange={(e) => setFilters({ ...filters, acceptingReferrals: e.target.checked })}
                className="w-4 h-4 text-mpondo-gold-600 border-neutral-300 rounded focus:ring-mpondo-gold-500"
              />
              <span className="text-sm text-neutral-700">Accepting referrals only</span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Advocate List */}
          <div className={`${selectedAdvocate ? 'w-1/2' : 'w-full'} overflow-y-auto border-r border-neutral-200`}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
              </div>
            ) : advocates.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 mb-2">No advocates found</p>
                <p className="text-sm text-neutral-500">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {advocates.map((advocate: AdvocateProfileWithDetails) => (
                  <div
                    key={advocate.id}
                    onClick={() => setSelectedAdvocate(advocate)}
                    className={`p-4 hover:bg-neutral-50 cursor-pointer transition-colors ${
                      selectedAdvocate?.id === advocate.id ? 'bg-neutral-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">
                          {advocate.advocate?.full_name || 'Unknown Advocate'}
                        </h3>
                        <p className="text-sm text-neutral-600 mt-1">
                          {advocate.advocate?.bar === 'johannesburg' ? 'Johannesburg Bar' : 'Cape Town Bar'}
                        </p>
                        {advocate.areasOfExpertise && advocate.areasOfExpertise.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {advocate.areasOfExpertise.slice(0, 3).map((area: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
                              >
                                {area}
                              </span>
                            ))}
                            {advocate.areasOfExpertise.length > 3 && (
                              <span className="text-xs text-neutral-500">
                                +{advocate.areasOfExpertise.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {advocate.acceptingReferrals && (
                        <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advocate Details */}
          {selectedAdvocate && (
            <div className="w-1/2 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    {selectedAdvocate.advocate?.full_name || 'Unknown Advocate'}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedAdvocate.advocate?.bar === 'johannesburg' ? 'Johannesburg Bar' : 'Cape Town Bar'}</span>
                    </div>
                    {selectedAdvocate.advocate?.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{selectedAdvocate.advocate.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAdvocate.professionalSummary && (
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-2">Professional Summary</h4>
                    <p className="text-neutral-700">{selectedAdvocate.professionalSummary}</p>
                  </div>
                )}

                {selectedAdvocate.areasOfExpertise && selectedAdvocate.areasOfExpertise.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-2">Areas of Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAdvocate.areasOfExpertise.map((area, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-mpondo-gold-100 text-mpondo-gold-700"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAdvocate.specialisations && selectedAdvocate.specialisations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-2">Specialisations</h4>
                    <div className="space-y-2">
                      {selectedAdvocate.specialisations.map((spec, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <div>
                            <p className="font-medium text-neutral-900">
                              {spec.category.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </p>
                            {spec.sub_speciality && (
                              <p className="text-sm text-neutral-600">{spec.sub_speciality}</p>
                            )}
                          </div>
                          {spec.years_experience && (
                            <span className="text-sm text-neutral-500">
                              {spec.years_experience} years
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedAdvocate.typicalTurnaroundDays && (
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-neutral-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Typical Turnaround</span>
                      </div>
                      <p className="text-lg font-semibold text-neutral-900">
                        {selectedAdvocate.typicalTurnaroundDays} days
                      </p>
                    </div>
                  )}

                  {selectedAdvocate.successRate && (
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-neutral-600 mb-1">
                        <Award className="w-4 h-4" />
                        <span className="text-sm">Success Rate</span>
                      </div>
                      <p className="text-lg font-semibold text-neutral-900">
                        {(selectedAdvocate.successRate * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>

                {selectedAdvocate.languagesSpoken && selectedAdvocate.languagesSpoken.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Languages
                    </h4>
                    <p className="text-neutral-700">{selectedAdvocate.languagesSpoken.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

