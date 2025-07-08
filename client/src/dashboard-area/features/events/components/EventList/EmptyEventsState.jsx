// components/EventList/EmptyEventsState.jsx
import React from 'react';
import { MapIcon, PlusIcon } from '@heroicons/react/24/outline';

const EmptyEventsState = ({ oncreateEvent }) => {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <MapIcon className="w-12 h-12 text-indigo-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-600 mb-2">No events yet</h3>
      <p className="text-gray-500 mb-6">Create your first event to get started</p>
      <button
        onClick={oncreateEvent}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto"
      >
        <PlusIcon className="w-5 h-5" />
        Create Your First event
      </button>
    </div>
  );
};

export default EmptyEventsState;



