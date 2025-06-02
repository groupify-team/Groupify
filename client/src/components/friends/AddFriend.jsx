import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  findUsersByEmail,
  getUserProfile,
} from "../../services/firebase/users";

const AddFriend = ({ onUserSelect }) => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setStatus(null);

    try {
      if (!input.trim()) {
        setStatus({ type: "error", message: "Please enter an email." });
        setLoading(false);
        return;
      }

      const users = await findUsersByEmail(input.trim());
      const targetUser = users.find((u) => u.uid !== currentUser.uid);

      if (!targetUser) {
        setStatus({ type: "error", message: "User not found." });
        setLoading(false);
        return;
      }

      if (targetUser.uid === currentUser.uid) {
        setStatus({
          type: "error",
          message: "You cannot add yourself as a friend.",
        });
        setLoading(false);
        return;
      }

      onUserSelect && onUserSelect(targetUser.uid);
      setInput(""); 
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter email address"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-medium"
      >
        {loading ? "Searching..." : "Find User"}
      </button>
      {status && (
        <div
          className={`text-sm ${
            status.type === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {status.message}
        </div>
      )}
    </div>
  );
};

export default AddFriend;
