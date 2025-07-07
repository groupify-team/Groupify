// Shared Toast Messages
export const TOAST_MESSAGES = {
  // Success messages
  success: {
    saved: "Changes saved successfully!",
    deleted: "Deleted successfully!",
    updated: "Updated successfully!",
    created: "Created successfully!",
  },

  // Dashboard-specific messages
  dashboard: {
    tripCreated: "Trip created successfully!",
    friendRequestSent: "Friend request sent successfully!",
    friendRequestAccepted: "Friend request accepted",
    friendRequestDeclined: "Friend request declined",
    tripInviteAccepted: "Trip invitation accepted",
    tripInviteDeclined: "Trip invitation declined",
  },

  // Settings-specific messages (will be moved from settings constants)
  settings: {
    profileUpdated: "Profile updated successfully!",
    passwordChanged: "Password changed successfully!",
    notificationsUpdated: "Notification preferences updated!",
    accountDeleted: "Account deleted successfully!",
    emailVerified: "Email verified successfully!",
    planUpgraded: "Plan upgraded successfully!",
    planCancelled: "Plan cancelled successfully!",
  },

  // Auth-specific messages
  auth: {
    signInSuccess: "Welcome back!",
    signUpSuccess: "Account created successfully!",
    signOutSuccess: "Signed out successfully!",
    emailSent: "Email sent successfully!",
    passwordReset: "Password reset successfully!",
  },
};

// Shared Error Messages
export const ERROR_MESSAGES = {
  // Generic errors
  generic: {
    unknown: "An unexpected error occurred. Please try again.",
    network: "Network error. Please check your connection and try again.",
    timeout: "Request timed out. Please try again.",
    unauthorized: "You are not authorized to perform this action.",
    forbidden: "Access denied.",
    notFound: "The requested resource was not found.",
    validation: "Please check your input and try again.",
  },

  // Dashboard-specific errors
  dashboard: {
    loadingDashboard: "Failed to load dashboard data",
    sendingFriendRequest: "Failed to send friend request",
    acceptingFriendRequest: "Failed to accept friend request",
    decliningFriendRequest: "Failed to decline friend request",
    tripLimitReached: (current, max) =>
      `Trip limit reached! You can only create ${max} trips. You currently have ${current} trips.`,
  },

  // Settings-specific errors (will be moved from settings constants)
  settings: {
    loadingProfile: "Failed to load profile data",
    updatingProfile: "Failed to update profile",
    changingPassword: "Failed to change password",
    deletingAccount: "Failed to delete account",
    loadingBilling: "Failed to load billing information",
    updatingBilling: "Failed to update billing information",
  },

  // Auth-specific errors
  auth: {
    invalidCredentials: "Invalid email or password",
    emailExists: "An account with this email already exists",
    weakPassword: "Password is too weak",
    emailNotVerified: "Please verify your email address",
    signInFailed: "Sign in failed. Please try again.",
    signUpFailed: "Sign up failed. Please try again.",
  },
};
