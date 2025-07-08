import React, { useEffect, useState } from "react";
import { useAuth } from "@auth/hooks/useAuth";
import { useUserRelationships } from "@shared/hooks";
import { UserService } from "@shared/services/user/UserService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@shared/services/firebase/config";

const DebugFriendsPage = () => {
  const { user } = useAuth();
  const [directFriends, setDirectFriends] = useState([]);
  const [directLoading, setDirectLoading] = useState(false);
  const [rawUserData, setRawUserData] = useState(null);

  const {
    friends: friendIds,
    friendRequests,
    loading: hookLoading,
    error: hookError,
  } = useUserRelationships();

  // Test direct UserService call
  useEffect(() => {
    const testDirectCall = async () => {
      if (!user?.uid) return;

      setDirectLoading(true);
      try {
        console.log("DebugFriendsPage: Testing direct UserService call");
        const friends = await UserService.getUserFriends(user.uid);
        console.log("DebugFriendsPage: Direct UserService result:", friends);
        setDirectFriends(friends);

        // Also get raw user data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          console.log("DebugFriendsPage: Raw user document:", userDoc.data());
          setRawUserData(userDoc.data());
        }
      } catch (error) {
        console.error("DebugFriendsPage: Direct UserService error:", error);
      } finally {
        setDirectLoading(false);
      }
    };

    testDirectCall();
  }, [user?.uid]);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h2>Friends Debug Page</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>User Info:</h3>
        <p>UID: {user?.uid}</p>
        <p>Email: {user?.email}</p>
        <p>DisplayName: {user?.displayName}</p>
      </div>

      <div
        style={{
          marginBottom: "20px",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <h3>useUserRelationships Hook:</h3>
        <p>Loading: {hookLoading ? "true" : "false"}</p>
        <p>Error: {hookError || "none"}</p>
        <p>Friend IDs: {JSON.stringify(friendIds)}</p>
        <p>Friend IDs Length: {friendIds?.length || 0}</p>
        <p>Friend Requests: {JSON.stringify(friendRequests)}</p>
      </div>

      <div
        style={{
          marginBottom: "20px",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <h3>Direct UserService Call:</h3>
        <p>Loading: {directLoading ? "true" : "false"}</p>
        <p>Friends Count: {directFriends?.length || 0}</p>
        <div>
          <h4>Direct Friends:</h4>
          <pre>{JSON.stringify(directFriends, null, 2)}</pre>
        </div>
      </div>

      <div
        style={{
          marginBottom: "20px",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        <h3>Raw User Document:</h3>
        <pre>{JSON.stringify(rawUserData, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DebugFriendsPage;
