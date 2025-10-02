import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Filter,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Clock,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck
} from 'lucide-react';
import { Icon } from '../design-system/components';
import { format } from 'date-fns';
import { PracticeGrowthService, type OverflowBrief, type SpecialisationCategory } from '../services/api/practice-growth.service';
import { OverflowBriefCard } from '../components/practice-growth/OverflowBriefCard';
import { CreateBriefModal } from '../components/practice-growth/CreateBriefModal';
import { AdvocateDirectoryModal } from '../components/practice-growth/AdvocateDirectoryModal';
import { ReferralStatsCard } from '../components/practice-growth/ReferralStatsCard';

const SPECIALISATION_CATEGORIES: { value: SpecialisationCategory; label: string }[] = [
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

export const PracticeGrowthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overflow' | 'directory' | 'referrals'>('overflow');
  const [overflowBriefs, setOverflowBriefs] = useState<OverflowBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [referralStats, setReferralStats] = useState<any>(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<SpecialisationCategory | ''>('');
  const [barFilter, setBarFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, categoryFilter, barFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overflow') {
        const briefs = await PracticeGrowthService.getAvailableOverflowBriefs({
          category: categoryFilter || undefined,
          bar: barFilter || undefined,
          search: searchQuery || undefined
        });
        setOverflowBriefs(briefs);
      } else if (activeTab === 'referrals') {
        const stats = await PracticeGrowthService.getReferralStats();
        setReferralStats(stats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Practice Growth</h1>
              <p className="text-neutral-600 mt-1">
                Expand your practice through strategic referrals and overflow management
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'overflow' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Post Brief
                </button>
              )}
              {activeTab === 'directory' && (
                <button
                  onClick={() => setShowDirectoryModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search Directory
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-6 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('overflow')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'overflow'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Overflow Marketplace
              </div>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'directory'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Advocate Directory
              </div>
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'referrals'
                  ? 'text-mpondo-gold-600 border-b-2 border-mpondo-gold-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Referral Analytics
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overflow' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-700">Filter by:</span>
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as SpecialisationCategory | '')}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                >
                  <option value="">All Categories</option>
                  {SPECIALISATION_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={barFilter}
                  onChange={(e) => setBarFilter(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                >
                  <option value="">All Bars</option>
                  <option value="johannesburg">Johannesburg</option>
                  <option value="cape_town">Cape Town</option>
                </select>

                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search briefs..."
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Brief Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
              </div>
            ) : overflowBriefs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 mb-2">No overflow briefs available</p>
                <p className="text-sm text-neutral-500">Check back later or adjust your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overflowBriefs.map(brief => (
                  <OverflowBriefCard key={brief.id} brief={brief} onApply={() => loadData()} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'directory' && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-mpondo-gold-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Advocate Directory</h2>
            <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
              Connect with qualified advocates across different specialisations and jurisdictions.
              Find the right advocate for referrals or collaboration.
            </p>
            <button
              onClick={() => setShowDirectoryModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 transition-colors"
            >
              <Search className="w-5 h-5" />
              Search Advocate Directory
            </button>
          </div>
        )}

        {activeTab === 'referrals' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600"></div>
              </div>
            ) : referralStats ? (
              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <ArrowUpRight className="w-5 h-5 text-success-600" />
                      <span className="text-xs text-neutral-500">Given</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">{referralStats.given}</p>
                    <p className="text-sm text-neutral-600 mt-1">Referrals Given</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <ArrowDownRight className="w-5 h-5 text-mpondo-gold-600" />
                      <span className="text-xs text-neutral-500">Received</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">{referralStats.received}</p>
                    <p className="text-sm text-neutral-600 mt-1">Referrals Received</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-5 h-5 text-success-600" />
                      <span className="text-xs text-neutral-500">Value</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">
                      R{referralStats.valueGiven.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">Total Value Given</p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <UserCheck className="w-5 h-5 text-mpondo-gold-600" />
                      <span className="text-xs text-neutral-500">Ratio</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {referralStats.reciprocityRatio ? referralStats.reciprocityRatio.toFixed(2) : 'N/A'}
                    </p>
                    <p className="text-sm text-neutral-600 mt-1">Reciprocity Ratio</p>
                  </div>
                </div>

                {/* Referral Relationships */}
                <ReferralStatsCard stats={referralStats} />
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No referral data available yet</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateBriefModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {showDirectoryModal && (
        <AdvocateDirectoryModal onClose={() => setShowDirectoryModal(false)} />
      )}
    </div>
  );
};

