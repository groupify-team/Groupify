import React from 'react';
import { 
  MapPinIcon, 
  UserGroupIcon, 
  CalendarIcon,
  EyeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const TripCard = ({ trip, onViewTrip }) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Determine trip status
  const getTripStatus = () => {
    if (!trip.startDate) return { status: 'draft', color: 'gray' };
    
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = trip.endDate ? new Date(trip.endDate) : startDate;
    
    if (endDate < now) return { status: 'completed', color: 'green' };
    if (startDate > now) return { status: 'upcoming', color: 'blue' };
    return { status: 'ongoing', color: 'purple' };
  };

  const tripStatus = getTripStatus();

  return (
    <div className="group relative">
      {/* Glass morphism card */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:bg-white/70 dark:hover:bg-gray-800/70">
        
        {/* Cover Image Section */}
        <div className="relative h-48 overflow-hidden">
          {trip.coverPhoto ? (
            <img 
              src={trip.coverPhoto} 
              alt={trip.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/30"></div>
                <div className="absolute top-12 right-8 w-6 h-6 rounded-full bg-white/20"></div>
                <div className="absolute bottom-8 left-8 w-4 h-4 rounded-full bg-white/40"></div>
                <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/25"></div>
              </div>
              
              {/* Icon */}
              <div className="relative z-10 flex flex-col items-center text-white">
                <MapPinIcon className="w-16 h-16 mb-2 drop-shadow-lg" />
                <span className="text-sm font-medium opacity-90">No Photo</span>
              </div>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border ${
              tripStatus.color === 'green' 
                ? 'bg-green-100/80 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200/50 dark:border-green-700/50'
                : tripStatus.color === 'blue'
                ? 'bg-blue-100/80 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50'
                : tripStatus.color === 'purple'
                ? 'bg-purple-100/80 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200/50 dark:border-purple-700/50'
                : 'bg-gray-100/80 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 border-gray-200/50 dark:border-gray-600/50'
            }`}>
              {tripStatus.status === 'completed' && '✓ Completed'}
              {tripStatus.status === 'upcoming' && '📅 Upcoming'}
              {tripStatus.status === 'ongoing' && '🎯 Ongoing'}
              {tripStatus.status === 'draft' && '📝 Draft'}
            </span>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        {/* Content Section - Fixed with proper spacing */}
        <div className="p-6">
          {/* Trip Title - FIXED: Removed line-clamp-1 and added proper line height */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors min-h-[2.5rem] flex items-center">
              {trip.name}
            </h3>
            
            {/* Location */}
            {trip.location && (
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{trip.location}</span>
              </div>
            )}
          </div>
          
          {/* Dates */}
          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mb-4">
            <CalendarIcon className="w-4 h-4 mr-2 text-indigo-500 flex-shrink-0" />
            <span className="flex-1">
              {trip.startDate && trip.endDate ? (
                <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
              ) : trip.startDate ? (
                <span>{formatDate(trip.startDate)}</span>
              ) : (
                <span className="italic text-gray-400 dark:text-gray-500">Dates not set</span>
              )}
            </span>
          </div>
          
          {/* Description - Fixed height for consistency */}
          <div className="mb-6 min-h-[3rem] flex items-start">
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {trip.description || 'No description provided'}
            </p>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
            {/* Members count */}
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
              <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                {trip.members?.length || 1} {trip.members?.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            
            {/* View Trip Button */}
            <button
              onClick={() => onViewTrip && onViewTrip(trip.id)}
              className="group/btn inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex-shrink-0"
            >
              <EyeIcon className="w-4 h-4" />
              <span>View Trip</span>
              <ChevronRightIcon className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripCard;