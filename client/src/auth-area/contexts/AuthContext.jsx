import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import subscriptionService from "../../shared/services/subscriptionService";

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
  const [initialized, setInitialized] = useState(false);
  
  // Use ref to track if this is the first auth state change
  const firstLoad = useRef(true);

  // PERFORMANCE: Memoize functions to prevent re-renders
  const initializeUserPlan = useCallback(async (user) => {
    if (!user) {
      setUserPlan(null);
      return;
    }

    try {
      setPlanLoading(true);
      
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
        console.log('Syncing plan data from Firestore:', firestorePlan);
        
        const planUpdate = {
          plan: firestorePlan.plan || firestorePlan,
          billing: firestorePlan.billing || 'monthly',
          status: firestorePlan.status || 'active',
          purchaseDate: firestorePlan.purchaseDate || new Date().toISOString(),
          metadata: {
            ...firestorePlan.metadata,
            syncedFromFirestore: true,
            syncedAt: new Date().toISOString()
          }
        };

        currentSubscription = subscriptionService.updateSubscription(planUpdate);
      }

      // Initialize usage tracking for new users
      if (currentSubscription.plan === 'free' && !subscriptionService.getStoredUsage().initialized) {
        subscriptionService.updateUsage({
          initialized: true,
          trips: 0,
          photos: 0,
          storage: 0,
          albums: 0
        });
      }

      setUserPlan(currentSubscription);
      
      // Store user plan reference in context for quick access
      console.log('User plan initialized:', {
        plan: currentSubscription.plan,
        status: currentSubscription.status,
        features: currentSubscription.features
      });

    } catch (error) {
      console.error('Error initializing user plan:', error);
      // Fallback to default free plan
      const defaultPlan = subscriptionService.getDefaultSubscription();
      setUserPlan(defaultPlan);
    } finally {
      setPlanLoading(false);
    }
  }, []); // Empty dependencies - function is stable

  // PERFORMANCE: Memoize stable functions
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

  const signup = useCallback(async (email, password, displayName, gender = "male") => {
    try {
      console.log("Starting signup process for:", email);

      if (!email || !password || !displayName) {
        throw new Error("Email, password, and name are required");
      }

      // Dynamic imports for auth functions
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
            plan: 'free',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          usage: {
            trips: 0,
            photos: 0,
            storage: 0,
            albums: 0
          }
        });
        console.log("User document created in Firestore with free plan");
      } catch (firestoreError) {
        console.warn("Failed to save user data to Firestore:", firestoreError);
      }

      // Initialize subscription service for new user
      subscriptionService.updateSubscription({
        plan: 'free',
        status: 'active',
        purchaseDate: new Date().toISOString(),
        metadata: {
          signupMethod: 'email',
          initializedAt: new Date().toISOString()
        }
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
  }, []);

  const signin = useCallback(async (email, password) => {
    try {
      console.log("Starting sign-in process for:", email);

      // Line deleted - just use imported 'auth' directly
      const { signInWithEmailAndPassword, signOut } = await import(
        "firebase/auth"
      );

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
      
      // Plan initialization will happen in the auth state change listener
      return userCredential;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
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
            plan: 'free',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          usage: {
            trips: 0,
            photos: 0,
            storage: 0,
            albums: 0
          }
        });

        // Initialize subscription service for new Google user
        subscriptionService.updateSubscription({
          plan: 'free',
          status: 'active',
          purchaseDate: new Date().toISOString(),
          metadata: {
            signupMethod: 'google',
            initializedAt: new Date().toISOString()
          }
        });
      }

      return result;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setUserPlan(null);
      
      // Optional: Clear subscription service cache
      subscriptionService.clearCache();
      
      return signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
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
  }, []);

  const resendVerificationEmail = useCallback(async (email) => {
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
  }, []);

  const updateUserPlan = useCallback(async (planData) => {
    try {
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const { doc, setDoc } = await import("firebase/firestore");

      // Update Firestore
      await setDoc(doc(db, "users", currentUser.uid), {
        subscription: planData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Update subscription service
      const updatedSubscription = subscriptionService.updateSubscription(planData);
      setUserPlan(updatedSubscription);

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating user plan:', error);
      throw error;
    }
  }, [currentUser]);

  // PERFORMANCE: Enhanced auth state change listener with proper loading management
  useEffect(() => {
    console.log("🔐 Setting up auth state listener...");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔐 Auth state changed:", {
        user: user ? `${user.email} (${user.uid})` : null,
        firstLoad: firstLoad.current,
        timestamp: new Date().toISOString()
      });

    const setupAuthListener = async () => {
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

      // Only set loading to false after the first auth state change
      if (firstLoad.current) {
        setLoading(false);
        setInitialized(true);
        firstLoad.current = false;
        console.log("✅ Auth initialization complete");
      }
    });

    return () => {
      console.log("🧹 Cleaning up auth listener");
      unsubscribe();
    };
  }, []); // CRITICAL: Empty dependencies to prevent recreation

  // Subscribe to subscription service updates
  useEffect(() => {
    const unsubscribe = subscriptionService.subscribe((event, data) => {
      if (event === 'subscriptionUpdated' && currentUser) {
        console.log('Subscription updated via service:', data);
        setUserPlan(data);
      }
    });

    return unsubscribe;
  }, [currentUser]);

  // Debug auth state
  useEffect(() => {
    console.log("🔐 Auth context state:", {
      hasUser: !!currentUser,
      loading,
      initialized,
      planLoading
    });
  }, [currentUser, loading, initialized, planLoading]);

  // PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentUser,
    loading,
    userPlan,
    planLoading,
    initialized,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    checkEmailVerification,
    resendVerificationEmail,
    updateUserPlan,
    
    // Plan-related helpers
    isFreePlan: userPlan?.plan === 'free',
    isPremiumPlan: userPlan?.plan === 'premium',
    isProPlan: userPlan?.plan === 'pro',
    planFeatures: userPlan?.features,
    planUsage: userPlan?.usage,
    
    // Auth state helpers
    isAuthenticated: !!currentUser,
    uid: currentUser?.uid,
    email: currentUser?.email,
    displayName: currentUser?.displayName,
  }), [
    currentUser, 
    loading, 
    userPlan, 
    planLoading, 
    initialized,
    signup,
    signin,
    signInWithGoogle,
    logout,
    resetPassword,
    checkEmailVerification,
    resendVerificationEmail,
    updateUserPlan,
    // Note: Functions are now memoized with useCallback, so safe to include
  ]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}