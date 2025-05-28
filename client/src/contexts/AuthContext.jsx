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
import { auth } from "../services/firebase/config";
import { createUserProfile } from "../services/firebase/users"; // ✅ Regular import

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
  const signup = async (email, password, displayName, gender) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Optionally set display name in Firebase Auth
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    // ✅ Create user profile in Firestore
    await createUserProfile(userCredential.user.uid, {
      email: userCredential.user.email,
      displayName: displayName || "",
      photoURL: userCredential.user.photoURL || "",
      gender: gender || ""
    });

    return userCredential;
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
