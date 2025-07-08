// Test script to verify member limits are working correctly

// Mock test for member limits
const CORE_LIMITS = {
  free: {
    events: 5,
    photosPerEvent: 30,
    membersPerEvent: 8,
    storageGB: 2,
  },
  premium: {
    events: 50,
    photosPerEvent: 200,
    membersPerEvent: 20,
    storageGB: 50,
  },
  pro: {
    events: "unlimited",
    photosPerEvent: "unlimited",
    membersPerEvent: "unlimited",
    storageGB: 500,
  },
};

// Test scenarios
console.log("=== Member Limit Tests ===");

// Test 1: Free plan with 1 person (should allow)
const freePlan = CORE_LIMITS.free;
const currentMembers = 1;
const canAddMoreMembers = currentMembers < freePlan.membersPerEvent;
console.log(
  `Free plan (1 member): Can add more? ${canAddMoreMembers} (limit: ${freePlan.membersPerEvent})`
);

// Test 2: Free plan with 7 members (should allow 1 more)
const currentMembers2 = 7;
const canAddMoreMembers2 = currentMembers2 < freePlan.membersPerEvent;
console.log(
  `Free plan (7 members): Can add more? ${canAddMoreMembers2} (limit: ${freePlan.membersPerEvent})`
);

// Test 3: Free plan with 8 members (should NOT allow more)
const currentMembers3 = 8;
const canAddMoreMembers3 = currentMembers3 < freePlan.membersPerEvent;
console.log(
  `Free plan (8 members): Can add more? ${canAddMoreMembers3} (limit: ${freePlan.membersPerEvent})`
);

// Test 4: Premium plan with 19 members (should allow 1 more)
const premiumPlan = CORE_LIMITS.premium;
const currentMembers4 = 19;
const canAddMoreMembers4 = currentMembers4 < premiumPlan.membersPerEvent;
console.log(
  `Premium plan (19 members): Can add more? ${canAddMoreMembers4} (limit: ${premiumPlan.membersPerEvent})`
);

// Test 5: Pro plan (unlimited)
const proPlan = CORE_LIMITS.pro;
const currentMembers5 = 100;
const canAddMoreMembers5 =
  proPlan.membersPerEvent === "unlimited" ||
  currentMembers5 < proPlan.membersPerEvent;
console.log(
  `Pro plan (100 members): Can add more? ${canAddMoreMembers5} (limit: ${proPlan.membersPerEvent})`
);

console.log("\n=== All tests completed ===");
