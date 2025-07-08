import React from "react";
import { getFriends } from "@shared/services/firebase/users";
import { useAuth } from "@auth/hooks/useAuth";
import { useEffect, useState } from "react";

const DebugFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFriends = async () => {
      if (!user?.uid) return;

      try {
        console.log("Debug: Loading friends for user:", user.uid);
        const friendsData = await getFriends(user.uid);
        console.log("Debug: Friends loaded:", friendsData);
        setFriends(friendsData);
      } catch (err) {
        console.error("Debug: Error loading friends:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [user]);

  if (loading) return <div>Loading debug friends...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", margin: "20px" }}>
      <h3>Debug Friends Component</h3>
      <p>User: {user?.displayName || user?.email}</p>
      <p>Friends count: {friends.length}</p>
      {friends.map((friend) => (
        <div
          key={friend.uid}
          style={{ padding: "10px", border: "1px solid #eee", margin: "5px" }}
        >
          <p>Name: {friend.displayName}</p>
          <p>Email: {friend.email}</p>
          <p>UID: {friend.uid}</p>
        </div>
      ))}
    </div>
  );
};

export default DebugFriends;
