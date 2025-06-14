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

      // Send custom verification email via Cloud Function
      try {
        console.log("Calling sendVerificationEmail function...");
        console.log("Sending email:", email, "name:", displayName);

        const sendVerificationEmail = httpsCallable(
          functions,
          "sendVerificationEmail"
        );
        const result = await sendVerificationEmail({
          email: email,
          name: displayName,
        });

        console.log("Verification email sent successfully:", result.data);

        // Sign out the user immediately after creating account
        await signOut(auth);
        console.log("User signed out after account creation");

        return {
          success: true,
          message:
            "Account created! Please check your email to verify your account before signing in.",
          email: email, // Return email for redirect
        };
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);

        // Even if email fails, we want to sign out the user
        await signOut(auth);

        throw new Error(
          "Account created but failed to send verification email. Please contact support."
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  async function signin(email, password) {
    // First check if email is verified in our system
    const isVerified = await checkEmailVerification(email);

    if (!isVerified) {
      throw new Error(
        "Please verify your email before signing in. Check your inbox!"
      );
    }

    // If verified, proceed with sign in
    return signInWithEmailAndPassword(auth, email, password);
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
        // For email/password users, check our custom verification
        if (user.providerData[0]?.providerId === "password") {
          const isVerified = await checkEmailVerification(user.email);

          if (!isVerified) {
            console.log("Email not verified in our system, signing out user");
            await signOut(auth);
            setCurrentUser(null);
            toast.error(
              "Please verify your email before signing in. Check your inbox!"
            );
            setLoading(false);
            return;
          }
        }

        console.log("User verified and signed in:", user.email);
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
