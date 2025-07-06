// components/TripActions/TripInvitations.jsx
import React from 'react';
import { BellIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const TripInvitations = ({ invitations, onAction }) => {
  if (invitations.length === 0) return null;

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl shadow-lg p-4 border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <BellIcon className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800 dark:text-white">
          Trip Invitations ({invitations.length})
        </h3>
      </div>
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">{invitation.tripName}</p>
              <p className="text-sm text-gray-600">From {invitation.inviterName}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAction('accept', invitation)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => onAction('decline', invitation)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
              >
                <XCircleIcon className="w-4 h-4" />
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripInvitations;
