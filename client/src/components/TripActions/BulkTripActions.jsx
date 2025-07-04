// components/TripActions/BulkTripActions.jsx
import React from 'react';
import { TrashIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const BulkTripActions = ({ selectedTrips, onAction }) => {
  return (
    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-800">
          {selectedTrips.length} trip{selectedTrips.length > 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onAction('archive', selectedTrips)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
          >
            <ArchiveBoxIcon className="w-4 h-4" />
            Archive
          </button>
          <button
            onClick={() => onAction('delete', selectedTrips)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkTripActions;
