// components/TripFilters/SearchFilter.jsx
import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchFilter = ({ value, onChange }) => {
  return (
    <div className="relative flex-1">
      <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
      <input
        type="text"
        placeholder="Search trips..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
};

export default SearchFilter;
