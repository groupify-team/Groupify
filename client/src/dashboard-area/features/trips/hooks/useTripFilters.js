// hooks/useTripFilters.js
import { useState, useCallback, useMemo } from 'react';
import { filterTrips, sortTrips } from '../services/tripsService';

export const useTripFilters = (trips = []) => {
  const [filters, setFilters] = useState({
    search: '',
    dateRange: 'all',
    status: 'all',
  });

  const [sortBy, setSortBy] = useState('newest');

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      dateRange: 'all',
      status: 'all',
    });
  }, []);

  const filteredAndSortedTrips = useMemo(() => {
    let filtered = filterTrips(trips, filters);
    filtered = sortTrips(filtered, sortBy);
    return filtered;
  }, [trips, filters, sortBy]);

  return {
    filters,
    sortBy,
    filteredTrips: filteredAndSortedTrips,
    updateFilters,
    clearFilters,
    setSortBy,
  };
};
