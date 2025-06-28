// components/TripFilters/DateFilter.jsx
import React from 'react';

const DateFilter = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
    >
      <option value="all">All Dates</option>
      <option value="upcoming">Upcoming</option>
      <option value="ongoing">Ongoing</option>
      <option value="completed">Completed</option>
    </select>
  );
};

export default DateFilter;
