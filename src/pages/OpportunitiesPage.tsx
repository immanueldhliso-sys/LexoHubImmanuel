/**
 * Opportunities Page
 * Manages the Pre-Matter/Opportunity stage for legal practice management
 * Follows LEXO Constitution principles for user experience and data integrity
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, TrendingUp, Clock, DollarSign, Target, Eye, Edit, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { OpportunityService, type Opportunity, type OpportunityStats, type OpportunityFilters } from '@/services/api/opportunities.service';
import { NewOpportunityModal } from '@/components/opportunities/NewOpportunityModal';
import { OpportunityDetailsModal } from '@/components/opportunities/OpportunityDetailsModal';
import { EditOpportunityModal } from '@/components/opportunities/EditOpportunityModal';
import { ConvertOpportunityModal } from '@/components/opportunities/ConvertOpportunityModal';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';

export function OpportunitiesPage() {
  // State management
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<OpportunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Modal states
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Load data
  useEffect(() => {
    loadOpportunities();
    loadStats();
  }, [searchTerm, filters, sortBy, sortOrder, currentPage]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const response = await OpportunityService.getOpportunities({
        page: currentPage,
        pageSize: 12,
        filters,
        search: searchTerm,
        sortBy,
        sortOrder
      });

      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      if (response.data) {
        setOpportunities(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await OpportunityService.getStats();
      if (response.error) {
        console.error('Error loading stats:', response.error);
        return;
      }
      setStats(response.data);
    } catch (error) {
      console.error('Error loading opportunity stats:', error);
    }
  };

  const handleDelete = async (opportunity: Opportunity) => {
    if (!confirm(`Are you sure you want to delete the opportunity "${opportunity.name}"?`)) {
      return;
    }

    try {
      const response = await OpportunityService.delete(opportunity.id);
      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      toast.success('Opportunity deleted successfully');
      loadOpportunities();
      loadStats();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast.error('Failed to delete opportunity');
    }
  };

  const handleConvert = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowConvertModal(true);
  };

  const handleView = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowDetailsModal(true);
  };

  const handleEdit = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowEditModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-blue-100 text-blue-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProbabilityColor = (probability?: number) => {
    if (!probability) return 'text-gray-500';
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-600 mt-1">Manage your pre-matter opportunities and potential instructions</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Opportunity
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_opportunities}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-green-600">{stats.conversion_rate_percentage.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_estimated_value)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Conversion Time</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.average_conversion_time_days} days</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.status as string || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value || undefined }))
              }>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="estimated_value">Value</SelectItem>
                  <SelectItem value="probability_percentage">Probability</SelectItem>
                  <SelectItem value="expected_instruction_date">Expected Date</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.keys(filters).length > 0 
                ? 'Try adjusting your search or filters'
                : 'Create your first opportunity to start tracking potential matters'
              }
            </p>
            <Button onClick={() => setShowNewModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Opportunity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {opportunity.name}
                    </CardTitle>
                    {opportunity.client_name && (
                      <p className="text-sm text-gray-600">{opportunity.client_name}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(opportunity.status)}>
                    {opportunity.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {opportunity.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {opportunity.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  {opportunity.estimated_value && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estimated Value:</span>
                      <span className="font-medium">{formatCurrency(opportunity.estimated_value)}</span>
                    </div>
                  )}

                  {opportunity.probability_percentage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Probability:</span>
                      <span className={`font-medium ${getProbabilityColor(opportunity.probability_percentage)}`}>
                        {opportunity.probability_percentage}%
                      </span>
                    </div>
                  )}

                  {opportunity.expected_instruction_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expected:</span>
                      <span className="font-medium">{formatDate(opportunity.expected_instruction_date)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{formatRelativeTime(opportunity.created_at)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(opportunity)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>

                  {opportunity.status === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => handleConvert(opportunity)}
                      className="flex-1"
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Convert
                    </Button>
                  )}

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(opportunity)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(opportunity)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modals */}
      <NewOpportunityModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={() => {
          loadOpportunities();
          loadStats();
        }}
      />

      {selectedOpportunity && (
        <>
          <OpportunityDetailsModal
            open={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedOpportunity(null);
            }}
            opportunity={selectedOpportunity}
            onEdit={() => {
              setShowDetailsModal(false);
              setShowEditModal(true);
            }}
            onConvert={() => {
              setShowDetailsModal(false);
              setShowConvertModal(true);
            }}
          />

          <EditOpportunityModal
            open={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedOpportunity(null);
            }}
            opportunity={selectedOpportunity}
            onSuccess={() => {
              loadOpportunities();
              loadStats();
            }}
          />

          <ConvertOpportunityModal
            open={showConvertModal}
            onClose={() => {
              setShowConvertModal(false);
              setSelectedOpportunity(null);
            }}
            opportunity={selectedOpportunity}
            onSuccess={() => {
              loadOpportunities();
              loadStats();
            }}
          />
        </>
      )}
    </div>
  );
}