import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../services/firebase/config";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Simplified email verification check - no Firestore permissions needed
  async function checkEmailVerification(email) {
    try {
      console.log("Checking email verification for:", email);
      return { verified: true }; // Let Firebase Auth handle verification
    } catch (error) {
      console.error("Error checking email verification:", error);
      return {
        verified: false,
        message:
          "Please verify your email before signing in. Check your inbox!",
      };
    }
  }

  // Sign up function with email verification
  async function signup(email, password, displayName, gender = "male") {
    try {
      console.log("Starting signup process for:", email);
      setIsSigningUp(true);

      // Validate inputs
      if (!email || !password || !displayName) {
        throw new Error("Email, password, and name are required");
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("User account created:", user.email);

      // Update user profile
      await updateProfile(user, {
        displayName: displayName,
      });

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        displayName: displayName,
        gender: gender,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        friends: [],
        profilePicture: null,
        bio: "",
        location: "",
        joinedAt: new Date().toISOString(),
      });

      console.log("User document created in Firestore");

      // Send verification email (wait for it to complete this time)
      try {
        const sendVerificationEmail = httpsCallable(
          functions,
          "sendVerificationEmail"
        );
        await sendVerificationEmail({
          email: email,
          name: displayName,
        });
        console.log("Verification email sent successfully");
      } catch (emailError) {
        console.error("Email send error:", emailError);
        // Don't fail the entire signup if email fails
      }

      // NOW sign out the user
      await signOut(auth);
      console.log("User signed out after account creation");

      return {
        success: true,
        email: email,
      };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsSigningUp(false);
    }
  }

  // Fixed signin function - uses Firebase Auth verification only
  async function signin(email, password) {
    try {
      console.log("Starting sign-in process for:", email);

      // Try to sign in directly - Firebase Auth will handle email verification
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check if email is verified in Firebase Auth
      if (!user.emailVerified) {
        await signOut(auth); // Sign out if not verified
        throw new Error(
          "Please verify your email before signing in. Check your inbox!"
        );
      }

      console.log("Sign-in successful for:", email);
      return userCredential;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Call enableGoogleAuth function to mark email as verified
      const enableGoogleAuth = httpsCallable(functions, "enableGoogleAuth");
      await enableGoogleAuth({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          gender: "other", // Default for Google sign-in
          createdAt: new Date().toISOString(),
          emailVerified: true, // Google accounts are pre-verified
          friends: [],
          profilePicture: user.photoURL,
          bio: "",
          location: "",
          joinedAt: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  }

  async function logout() {
    return signOut(auth);
  }

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Fixed resend verification email
  async function resendVerificationEmail(email) {
    try {
      console.log("Resending verification email to:", email);

      const resendFunction = httpsCallable(functions, "resendVerificationCode");
      const result = await resendFunction({ email });

      console.log("Verification email resent successfully");
      return result.data;
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email || "No user");

      if (user) {
        // For Google users, allow immediate access
        if (user.providerData[0]?.providerId === "google.com") {
          console.log("Google user signed in:", user.email);
          setCurrentUser(user);
        } else if (isSigningUp) {
          // During signup process, allow temporary access
          console.log("User is signing up, allowing temporary access");
          setCurrentUser(user);
        } else if (user.emailVerified) {
          // Email/password user with verified email
          console.log("Verified email/password user signed in:", user.email);
          setCurrentUser(user);
        } else {
          // Email/password user without verification - sign them out
          console.log(
            "Email/password user detected, signing out for verification"
          );
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [isSigningUp]);

  const value = {
    currentUser,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    checkEmailVerification,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
