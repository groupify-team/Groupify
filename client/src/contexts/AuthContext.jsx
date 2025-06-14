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
  const [isSigningUp, setIsSigningUp] = useState(false); // Add this flag

  // Check if email is verified in our custom system
  async function checkEmailVerification(email) {
    try {
      const verificationDoc = await getDoc(doc(db, "verificationCodes", email));
      return verificationDoc.exists() && verificationDoc.data().verified;
    } catch (error) {
      console.error("Error checking email verification:", error);
      return false;
    }
  }

  // Sign up function with email verification
  async function signup(email, password, displayName, gender = "male") {
    try {
      console.log("Starting signup process for:", email);
      setIsSigningUp(true); // Set flag to prevent immediate sign-out

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

      // Send verification email (don't wait for it to complete)
      const sendVerificationEmail = httpsCallable(
        functions,
        "sendVerificationEmail"
      );
      sendVerificationEmail({
        email: email,
        name: displayName,
      }).catch((error) => {
        console.error("Email send error (non-blocking):", error);
      });

      // NOW sign out the user
      await signOut(auth);
      console.log("User signed out after account creation");

      return {
        success: true,
        message:
          "Account created! Please check your email to verify your account.",
        email: email,
      };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsSigningUp(false); // Reset flag
    }
  }


  
  async function signin(email, password) {
    // First sign in
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Then check if email is verified
    const isVerified = await checkEmailVerification(email);

    if (!isVerified) {
      // Sign out immediately if not verified
      await signOut(auth);
      throw new Error(
        "Please verify your email before signing in. Check your inbox!"
      );
    }

    return result;
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

  // Resend verification email
  async function resendVerificationEmail(email) {
    try {
      const resendCode = httpsCallable(functions, "resendVerificationCode");
      await resendCode({ email });
      return { success: true, message: "Verification email sent!" };
    } catch (error) {
      console.error("Resend verification error:", error);
      throw new Error(error.message || "Failed to resend verification email");
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
        } else if (!isSigningUp) {
          // Only sign out if NOT currently signing up
          // For email/password users, sign them out immediately after creation
          console.log(
            "Email/password user detected, signing out for verification"
          );
          await signOut(auth);
          setCurrentUser(null);
        } else {
          console.log("User is signing up, allowing temporary access");
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [isSigningUp]); // Add isSigningUp as dependency

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
