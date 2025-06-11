// AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, app } from "../services/firebase/config";
import { createUserProfile } from "../services/firebase/users"; // ✅ Regular import
import { getFunctions, httpsCallable } from "firebase/functions";
const AuthContext = createContext({});

// Exported hook for using the auth context in components
function useAuthContext() {
  return useContext(AuthContext);
}
export { useAuthContext as useAuth };

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Sign up with email, password, displayName, and gender
  // In AuthContext.jsx, update the signup function to this:

  const signup = async (
    email,
    password,
    displayName,
    gender,
    signInImmediately = true
  ) => {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the display name in Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });

      // Create user profile in Firestore
      await createUserProfile(userCredential.user.uid, {
        email,
        displayName,
        gender,
      });

      // Sign out if requested (for email verification flow)
      if (!signInImmediately) {
        await signOut(auth);
      }

      // Return the user credential so the caller can handle verification email
      return userCredential;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Sign in with email and password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  };

  // Log out the current user
  const logout = () => {
    return signOut(auth);
  };

  // Send password reset email
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update user profile in Firebase Auth
  const updateUserProfile = async (profileUpdates) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, profileUpdates);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Provide all context values
  const value = {
    currentUser,
    setCurrentUser,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
