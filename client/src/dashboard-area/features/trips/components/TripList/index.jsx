// components/TripList/index.jsx
import React from 'react';
import TripGrid from './TripGrid';
import EmptyTripsState from './EmptyTripsState';

const TripList = ({ trips, onViewTrip, loading }) => {
  if (loading) {
    return <div>Loading trips...</div>;
  }

  if (trips.length === 0) {
    return <EmptyTripsState />;
  }

  return <TripGrid trips={trips} onViewTrip={onViewTrip} />;
};

export default TripList;
