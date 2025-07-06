// components/TripList/TripGrid.jsx  
import React from 'react';
import TripCard from '../TripCard';

const TripGrid = ({ trips, onViewTrip }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} onViewTrip={onViewTrip} />
      ))}
    </div>
  );
};

export default TripGrid;
