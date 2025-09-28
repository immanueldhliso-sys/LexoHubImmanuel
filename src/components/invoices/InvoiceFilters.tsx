import React from 'react';
import { Search, Filter, Calendar, Building2, X } from 'lucide-react';
import type { InvoiceStatus, Bar } from '@/types';

interface InvoiceFiltersProps {
  filters: {
    search: string;
    status: InvoiceStatus[];
    bar: Bar[];
    dateRange: { start: string; end: string } | null;
  };
  onFiltersChange: (filters: InvoiceFilters) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string; color: string }[] = [
  { value: 'Draft', label: 'Draft', color: 'bg-neutral-100 text-neutral-700' },
  { value: 'Sent', label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  { value: 'Unpaid', label: 'Unpaid', color: 'bg-warning-100 text-warning-700' },
  { value: 'Overdue', label: 'Overdue', color: 'bg-error-100 text-error-700' },
  { value: 'Paid', label: 'Paid', color: 'bg-success-100 text-success-700' },
  { value: 'Pending', label: 'Pending', color: 'bg-neutral-100 text-neutral-700' }
];

const BAR_OPTIONS: { value: Bar; label: string; color: string }[] = [
  { value: 'Johannesburg', label: 'Johannesburg', color: 'bg-mpondo-gold-100 text-mpondo-gold-700' },
  { value: 'Cape Town', label: 'Cape Town', color: 'bg-judicial-blue-100 text-judicial-blue-700' }
];

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const hasActiveFilters = 
    filters.search || 
    filters.status.length > 0 || 
    filters.bar.length > 0 || 
    filters.dateRange;

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStatusToggle = (status: InvoiceStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const handleBarToggle = (bar: Bar) => {
    const newBar = filters.bar.includes(bar)
      ? filters.bar.filter(b => b !== bar)
      : [...filters.bar, bar];
    onFiltersChange({ ...filters, bar: newBar });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = filters.dateRange 
      ? { ...filters.dateRange, [field]: value }
      : { start: field === 'start' ? value : '', end: field === 'end' ? value : '' };
    
    onFiltersChange({ ...filters, dateRange: newDateRange });
  };

  const clearDateRange = () => {
    onFiltersChange({ ...filters, dateRange: null });
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search invoices by number, client, or matter..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Status
          </label>
          <div className="space-y-2">
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={() => handleStatusToggle(option.value)}
                  className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                />
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Bar Filter */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Bar
          </label>
          <div className="space-y-2">
            {BAR_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.bar.includes(option.value)}
                  onChange={() => handleBarToggle(option.value)}
                  className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                />
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                  <Building2 className="w-3 h-3" />
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-neutral-700">
              Date Range
            </label>
            {filters.dateRange && (
              <button
                onClick={clearDateRange}
                className="text-xs text-neutral-500 hover:text-neutral-700"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                placeholder="Start date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                placeholder="End date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters & Clear */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-600">Active filters:</span>
            
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs">
                Search: "{filters.search}"
                <button
                  onClick={() => handleSearchChange('')}
                  className="hover:text-neutral-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status.map((status) => {
              const option = STATUS_OPTIONS.find(opt => opt.value === status);
              return option ? (
                <span key={status} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${option.color}`}>
                  {option.label}
                  <button
                    onClick={() => handleStatusToggle(status)}
                    className="hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : null;
            })}
            
            {filters.bar.map((bar) => {
              const option = BAR_OPTIONS.find(opt => opt.value === bar);
              return option ? (
                <span key={bar} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${option.color}`}>
                  {option.label}
                  <button
                    onClick={() => handleBarToggle(bar)}
                    className="hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : null;
            })}
            
            {filters.dateRange && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs">
                {filters.dateRange.start} to {filters.dateRange.end}
                <button
                  onClick={clearDateRange}
                  className="hover:text-neutral-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          
          <button
            onClick={onClearFilters}
            className="text-sm text-neutral-600 hover:text-neutral-900 font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};