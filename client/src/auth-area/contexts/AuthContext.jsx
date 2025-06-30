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
import { auth, db } from "../../shared/services/firebase/config";
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

    // SIMPLIFIED: Try to create user document, but don't fail if it doesn't work
    try {
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
    } catch (firestoreError) {
      console.warn("Failed to save user data to Firestore:", firestoreError);
      // Don't fail the signup if Firestore fails
    }

    // Sign out the user immediately to prevent dashboard access
    console.log("Signing out user to prevent dashboard access before verification");
    await signOut(auth);
    
    console.log("User signed out after account creation");

    // DON'T send verification email here - let SignUpPage handle it
    return {
      success: true,
      email: email,
    };
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
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

      // Call enableGoogleAuth function using fetch
      try {
        const response = await fetch(
          "https://us-central1-groupify-77202.cloudfunctions.net/enableGoogleAuth",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              }
            }),
          }
        );

        if (!response.ok) {
          console.warn("Failed to enable Google auth, but continuing");
        }
      } catch (error) {
        console.warn("EnableGoogleAuth function failed, but continuing:", error);
      }

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
  try {
    console.log("Sending password reset email to:", email);

    const response = await fetch(
      "https://us-central1-groupify-77202.cloudfunctions.net/sendPasswordResetEmail",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: { email }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log("Password reset email sent successfully");
      return result;
    } else {
      throw new Error(result.message || "Failed to send password reset email");
    }
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}

  // Fixed resend verification email
  async function resendVerificationEmail(email) {
    try {
      console.log("Resending verification email to:", email);

      const response = await fetch(
        "https://us-central1-groupify-77202.cloudfunctions.net/resendVerificationCode",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: { email }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log("Verification email resent successfully");
        return result;
      } else {
        throw new Error(result.message || "Failed to resend verification email");
      }
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
      } else if (user.emailVerified) {
        // Email/password user with verified email
        console.log("Verified email/password user signed in:", user.email);
        setCurrentUser(user);
      } else {
        // Email/password user without verification - sign them out immediately
        console.log("Email/password user detected, signing out for verification");
        
        // Set currentUser to null FIRST to prevent dashboard flash
        setCurrentUser(null);
        
        // Then sign them out
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
  });

  return unsubscribe;
}, []); // Remove all dependencies

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