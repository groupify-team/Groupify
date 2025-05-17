import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const TripCard = ({ trip }) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Trip Image */}
      <div className="h-32 bg-indigo-100 flex items-center justify-center">
        {trip.coverPhoto ? (
          <img 
            src={trip.coverPhoto} 
            alt={trip.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-indigo-500 text-6xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Trip Details */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{trip.name}</h3>
        <p className="text-sm text-gray-500 mb-2">
          {trip.startDate && trip.endDate ? (
            `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`
          ) : (
            <span className="italic">Dates not set</span>
          )}
        </p>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2" title={trip.description}>
          {trip.description || 'No description provided'}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {trip.members?.length || 1} {trip.members?.length === 1 ? 'member' : 'members'}
          </span>
          <Link 
            to={`/trips/${trip.id}`} 
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            View Trip
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TripCard;