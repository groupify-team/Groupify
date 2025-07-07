import React, { useState, useEffect, useMemo, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../shared/services/firebase/config";
import { authService } from "../services/authService";
import { AuthContext } from "./AuthContext";

export function CoreAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // PERFORMANCE: Memoize stable functions
  const signup = useCallback(
    async (email, password, displayName, gender = "male") => {
      try {
        console.log("Starting signup process for:", email);

        if (!email || !password || !displayName) {
          throw new Error("Email, password, and name are required");
        }

        return await authService.signUp(email, password, displayName, gender);
      } catch (error) {
        console.error("Signup error:", error);
        throw error;
      }
    },
    []
  );

  const signin = useCallback(async (email, password) => {
    try {
      console.log("Starting sign-in process for:", email);

      const userCredential = await authService.signIn(email, password);

      console.log("Sign-in successful for:", email);
      return userCredential;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await authService.signInWithGoogle();
      return result;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      return await authService.signOut();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      console.log("Sending password reset email to:", email);
      return await authService.resetPassword(email);
    } catch (error) {
      console.error("Failed to send reset email:", error);
      throw error;
    }
  }, []);

  const checkEmailVerification = useCallback(async (email) => {
    try {
      console.log("Checking email verification for:", email);
      return { verified: true };
    } catch (error) {
      console.error("Error checking email verification:", error);
      return {
        verified: false,
        message:
          "Please verify your email before signing in. Check your inbox!",
      };
    }
  }, []);

  const resendVerificationEmail = useCallback(async (email) => {
    try {
      console.log("Resending verification email to:", email);
      return await authService.resendVerificationEmail(email);
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      throw error;
    }
  }, []);

  // Enhanced auth state change listener
  useEffect(() => {
    console.log("🔐 Setting up auth state listener...");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email || "No user");

      if (user) {
        // For Google users, allow immediate access
        if (user.providerData[0]?.providerId === "google.com") {
          console.log("Google user signed in:", user.email);
          setCurrentUser(user);
        } else if (user.emailVerified) {
          // Email/password user with verified email
          console.log("Verified email/password user signed in:", user.email);
          setCurrentUser(user);
        } else {
          // Email/password user without verification
          console.log(
            "Email/password user detected, signing out for verification"
          );
          setCurrentUser(null);

          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error("Error signing out unverified user:", signOutError);
          }
        }
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
      setInitialized(true);
    });

    return () => {
      console.log("🧹 Cleaning up auth listener");
      unsubscribe();
    };
  }, []); // Empty dependencies to prevent recreation

  // Debug auth state
  useEffect(() => {
    console.log("🔐 Auth context state:", {
      hasUser: !!currentUser,
      loading,
      initialized,
    });
  }, [currentUser, loading, initialized]);

  // PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      currentUser,
      loading,
      initialized,
      signup,
      signin,
      signInWithGoogle,
      logout,
      resetPassword,
      checkEmailVerification,
      resendVerificationEmail,

      // Auth state helpers
      isAuthenticated: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
      displayName: currentUser?.displayName,
      emailVerified: currentUser?.emailVerified,
    }),
    [
      currentUser,
      loading,
      initialized,
      signup,
      signin,
      signInWithGoogle,
      logout,
      resetPassword,
      checkEmailVerification,
      resendVerificationEmail,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
