// components/TripActions/index.jsx
import React from 'react';
import TripInvitations from './TripInvitations';
import BulkTripActions from './BulkTripActions';

const TripActions = ({ selectedTrips, onBulkAction, invitations, onInvitationAction }) => {
  return (
    <div className="space-y-4">
      <TripInvitations invitations={invitations} onAction={onInvitationAction} />
      {selectedTrips.length > 0 && (
        <BulkTripActions selectedTrips={selectedTrips} onAction={onBulkAction} />
      )}
    </div>
  );
};

export default TripActions;
