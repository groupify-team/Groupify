import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuth, getFirestore } from "@firebase-services/config";
import { toast } from "react-hot-toast";
import subscriptionService from "@shared/services/subscriptionService";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Initialize user plan data from subscription service
  const initializeUserPlan = async (user) => {
    if (!user) {
      setUserPlan(null);
      return;
    }

    try {
      setPlanLoading(true);
      const db = await getFirestore();
      const { doc, getDoc } = await import("firebase/firestore");

      // Get user profile from Firestore to check for plan info
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let firestorePlan = null;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        firestorePlan = userData.subscription || userData.plan;
      }

      // Get current subscription from subscription service
      let currentSubscription = subscriptionService.getCurrentSubscription();

      // If user has plan data in Firestore, sync it with subscription service
      if (firestorePlan && firestorePlan !== currentSubscription.plan) {
        console.log("Syncing plan data from Firestore:", firestorePlan);

        const planUpdate = {
          plan: firestorePlan.plan || firestorePlan,
          billing: firestorePlan.billing || "monthly",
          status: firestorePlan.status || "active",
          purchaseDate: firestorePlan.purchaseDate || new Date().toISOString(),
          metadata: {
            ...firestorePlan.metadata,
            syncedFromFirestore: true,
            syncedAt: new Date().toISOString(),
          },
        };

        currentSubscription =
          subscriptionService.updateSubscription(planUpdate);
      }

      // Initialize usage tracking for new users
      if (
        currentSubscription.plan === "free" &&
        !subscriptionService.getStoredUsage().initialized
      ) {
        subscriptionService.updateUsage({
          initialized: true,
          trips: 0,
          photos: 0,
          storage: 0,
          albums: 0,
        });
      }

      setUserPlan(currentSubscription);
      console.log("User plan initialized:", {
        plan: currentSubscription.plan,
        status: currentSubscription.status,
        features: currentSubscription.features,
      });
    } catch (error) {
      console.error("Error initializing user plan:", error);
      const defaultPlan = subscriptionService.getDefaultSubscription();
      setUserPlan(defaultPlan);
    } finally {
      setPlanLoading(false);
    }
  };

  // Simplified email verification check
  async function checkEmailVerification(email) {
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
  }

  // Enhanced signup function with plan initialization
  async function signup(email, password, displayName, gender = "male") {
    try {
      console.log("Starting signup process for:", email);

      if (!email || !password || !displayName) {
        throw new Error("Email, password, and name are required");
      }

      // Dynamic imports for auth functions
      const auth = await getAuth();
      const { createUserWithEmailAndPassword, updateProfile, signOut } =
        await import("firebase/auth");

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

      // Create user document with default plan
      try {
        const db = await getFirestore();
        const { doc, setDoc } = await import("firebase/firestore");

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
          subscription: {
            plan: "free",
            status: "active",
            createdAt: new Date().toISOString(),
          },
          usage: {
            trips: 0,
            photos: 0,
            storage: 0,
            albums: 0,
          },
        });
        console.log("User document created in Firestore with free plan");
      } catch (firestoreError) {
        console.warn("Failed to save user data to Firestore:", firestoreError);
      }

      // Initialize subscription service for new user
      subscriptionService.updateSubscription({
        plan: "free",
        status: "active",
        purchaseDate: new Date().toISOString(),
        metadata: {
          signupMethod: "email",
          initializedAt: new Date().toISOString(),
        },
      });

      // Sign out the user to prevent dashboard access before verification
      console.log(
        "Signing out user to prevent dashboard access before verification"
      );
      await signOut(auth);

      console.log("User signed out after account creation");

      return {
        success: true,
        email: email,
      };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  // Enhanced signin function with plan loading
  async function signin(email, password) {
    try {
      console.log("Starting sign-in process for:", email);

      const auth = await getAuth();
      const { signInWithEmailAndPassword, signOut } = await import(
        "firebase/auth"
      );

      // Try to sign in directly
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check if email is verified in Firebase Auth
      if (!user.emailVerified) {
        await signOut(auth);
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

  // Enhanced Google sign-in with plan initialization
  async function signInWithGoogle() {
    try {
      const auth = await getAuth();
      const { GoogleAuthProvider, signInWithPopup } = await import(
        "firebase/auth"
      );

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Call enableGoogleAuth function
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
              },
            }),
          }
        );

        if (!response.ok) {
          console.warn("Failed to enable Google auth, but continuing");
        }
      } catch (error) {
        console.warn(
          "EnableGoogleAuth function failed, but continuing:",
          error
        );
      }

      // Check if user document exists, if not create it with free plan
      const db = await getFirestore();
      const { doc, getDoc, setDoc } = await import("firebase/firestore");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          gender: "other",
          createdAt: new Date().toISOString(),
          emailVerified: true,
          friends: [],
          profilePicture: user.photoURL,
          bio: "",
          location: "",
          joinedAt: new Date().toISOString(),
          subscription: {
            plan: "free",
            status: "active",
            createdAt: new Date().toISOString(),
          },
          usage: {
            trips: 0,
            photos: 0,
            storage: 0,
            albums: 0,
          },
        });

        // Initialize subscription service for new Google user
        subscriptionService.updateSubscription({
          plan: "free",
          status: "active",
          purchaseDate: new Date().toISOString(),
          metadata: {
            signupMethod: "google",
            initializedAt: new Date().toISOString(),
          },
        });
      }

      return result;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  }

  async function logout() {
    try {
      setUserPlan(null);
      subscriptionService.clearCache();

      const auth = await getAuth();
      const { signOut } = await import("firebase/auth");
      return signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
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
            data: { email },
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
        throw new Error(
          result.message || "Failed to send password reset email"
        );
      }
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw error;
    }
  }

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
            data: { email },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return result;
      } else {
        throw new Error(
          result.message || "Failed to resend verification email"
        );
      }
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      throw error;
    }
  }

  async function updateUserPlan(planData) {
    try {
      if (!currentUser) {
        throw new Error("No authenticated user");
      }

      const db = await getFirestore();
      const { doc, setDoc } = await import("firebase/firestore");

      // Update Firestore
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          subscription: planData,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Update subscription service
      const updatedSubscription =
        subscriptionService.updateSubscription(planData);
      setUserPlan(updatedSubscription);

      return updatedSubscription;
    } catch (error) {
      console.error("Error updating user plan:", error);
      throw error;
    }
  }

  // Enhanced auth state change listener with plan initialization
  useEffect(() => {
    let unsubscribe;

    const setupAuthListener = async () => {
      const auth = await getAuth();
      const { onAuthStateChanged, signOut } = await import("firebase/auth");

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log("Auth state changed:", user?.email || "No user");

        if (user) {
          // For Google users, allow immediate access
          if (user.providerData[0]?.providerId === "google.com") {
            console.log("Google user signed in:", user.email);
            setCurrentUser(user);
            await initializeUserPlan(user);
          } else if (user.emailVerified) {
            // Email/password user with verified email
            console.log("Verified email/password user signed in:", user.email);
            setCurrentUser(user);
            await initializeUserPlan(user);
          } else {
            // Email/password user without verification
            console.log(
              "Email/password user detected, signing out for verification"
            );

            setCurrentUser(null);
            setUserPlan(null);

            try {
              await signOut(auth);
            } catch (signOutError) {
              console.error("Error signing out unverified user:", signOutError);
            }
          }
        } else {
          setCurrentUser(null);
          setUserPlan(null);
        }

        setLoading(false);
      });
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Subscribe to subscription service updates
  useEffect(() => {
    const unsubscribe = subscriptionService.subscribe((event, data) => {
      if (event === "subscriptionUpdated" && currentUser) {
        console.log("Subscription updated via service:", data);
        setUserPlan(data);
      }
    });

    return unsubscribe;
  }, [currentUser]);

  const value = {
    currentUser,
    userPlan,
    planLoading,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    checkEmailVerification,
    resendVerificationEmail,
    updateUserPlan,

    // Plan-related helpers
    isFreePlan: userPlan?.plan === "free",
    isPremiumPlan: userPlan?.plan === "premium",
    isProPlan: userPlan?.plan === "pro",
    planFeatures: userPlan?.features,
    planUsage: userPlan?.usage,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
