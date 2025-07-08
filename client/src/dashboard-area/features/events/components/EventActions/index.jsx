// components/EventActions/index.jsx
import React from 'react';
import EventInvitations from './EventInvitations';
import BulkEventActions from './BulkEventActions';

const EventActions = ({ selectedevents, onBulkAction, invitations, onInvitationAction }) => {
  return (
    <div className="space-y-4">
      <EventInvitations invitations={invitations} onAction={onInvitationAction} />
      {selectedevents.length > 0 && (
        <BulkEventActions selectedevents={selectedevents} onAction={onBulkAction} />
      )}
    </div>
  );
};

export default EventActions;



