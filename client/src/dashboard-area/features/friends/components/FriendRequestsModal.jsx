import React, { useEffect, useState } from "react";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingFriendRequests,
} from "../../../shared/services/firebase/users";

const FriendRequestsModal = ({ currentUserId, onClose }) => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const pending = await getPendingFriendRequests(currentUserId);
      setRequests(pending);
    };
    fetchRequests();
  }, [currentUserId]);

  const handleAccept = async (senderId) => {
    await acceptFriendRequest(currentUserId, senderId);
    setRequests(requests.filter((r) => r.id !== senderId));
  };

  const handleReject = async (senderId) => {
    await rejectFriendRequest(currentUserId, senderId);
    setRequests(requests.filter((r) => r.id !== senderId));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Friend Requests</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        {requests.length === 0 ? (
          <p className="text-gray-600">No pending requests</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {requests.map((req) => (
              <li
                key={req.id}
                className="py-2 flex justify-between items-center"
              >
                <span>{req.displayName || req.email}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FriendRequestsModal;
