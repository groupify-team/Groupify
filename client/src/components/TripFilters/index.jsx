// components/TripFilters/index.jsx
import React from 'react';
import SearchFilter from './SearchFilter';
import DateFilter from './DateFilter'; 
import StatusFilter from './StatusFilter';

const TripFilters = ({ filters, onFiltersChange }) => {
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20">
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchFilter value={filters.search} onChange={(search) => onFiltersChange({ ...filters, search })} />
        <DateFilter value={filters.dateRange} onChange={(dateRange) => onFiltersChange({ ...filters, dateRange })} />
        <StatusFilter value={filters.status} onChange={(status) => onFiltersChange({ ...filters, status })} />
      </div>
    </div>
  );
};

export default TripFilters;
