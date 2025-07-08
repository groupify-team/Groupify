// Test script to verify friends functionality
// Run this in the browser console after logging in

async function testFriendsFunctionality() {
  console.log("=== Testing Friends Functionality ===");

  // Get current user
  const auth = window.firebase?.auth?.();
  if (!auth?.currentUser) {
    console.error("No authenticated user found");
    return;
  }

  const currentUser = auth.currentUser;
  console.log("Current User:", {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName,
  });

  try {
    // Test UserService getUserProfile
    console.log("\n--- Testing UserService.getUserProfile ---");
    const userProfile = await window.UserService?.getUserProfile(
      currentUser.uid
    );
    console.log("User Profile:", userProfile);

    // Test UserService getUserFriends
    console.log("\n--- Testing UserService.getUserFriends ---");
    const friends = await window.UserService?.getUserFriends(currentUser.uid);
    console.log("Friends:", friends);
    console.log("Friends count:", friends?.length || 0);

    // Test each friend's profile
    if (friends && friends.length > 0) {
      console.log("\n--- Testing Friend Profiles ---");
      for (let i = 0; i < Math.min(friends.length, 3); i++) {
        const friend = friends[i];
        console.log(`Friend ${i + 1}:`, friend);

        if (friend.uid || friend.id) {
          const friendProfile = await window.UserService?.getUserProfile(
            friend.uid || friend.id
          );
          console.log(`Friend ${i + 1} Profile:`, friendProfile);
        }
      }
    }

    console.log("\n=== Test Complete ===");
  } catch (error) {
    console.error("Error during testing:", error);
  }
}

// Make function available globally
window.testFriendsFunctionality = testFriendsFunctionality;

console.log(
  "Friends functionality test script loaded. Run testFriendsFunctionality() to test."
);
