/**
 * Consolidated AuthContext - Single source of truth for authentication
 * PERFORMANCE OPTIMIZED: Removed duplicates, memoized functions, minimal re-renders
 */
import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../shared/services/firebase/config";
import subscriptionService from "../../shared/services/subscriptionService";

const AuthContext = createContext();

export { AuthContext };

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const firstLoad = useRef(true);

  const initializeUserPlan = useCallback(async (user) => {
    if (!user) {
      setUserPlan(null);
      return;
    }
    try {
      setPlanLoading(true);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let firestorePlan = null;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        firestorePlan = userData.subscription || userData.plan;
      }

      let currentSubscription = subscriptionService.getCurrentSubscription();
      if (firestorePlan && firestorePlan !== currentSubscription.plan) {
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

      if (
        currentSubscription.plan === "free" &&
        !subscriptionService.getStoredUsage().initialized
      ) {
        subscriptionService.updateUsage({
          initialized: true,
          events: 0,
          photos: 0,
          storage: 0,
          albums: 0,
        });
      }
      setUserPlan(currentSubscription);
    } catch (error) {
      console.error("Error initializing user plan:", error);
      const defaultPlan = subscriptionService.getDefaultSubscription();
      setUserPlan(defaultPlan);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  const checkEmailVerification = useCallback(async (email) => {
    try {
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

  const signup = useCallback(
    async (email, password, displayName, gender = "male") => {
      try {
        if (!email || !password || !displayName) {
          throw new Error("Email, password, and name are required");
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: displayName,
        });

        const signupData = {
          displayName,
          gender,
          signupTimestamp: new Date().toISOString(),
        };
        localStorage.setItem(
          `groupify_signup_${user.uid}`,
          JSON.stringify(signupData)
        );

        subscriptionService.updateSubscription({
          plan: "free",
          status: "active",
          purchaseDate: new Date().toISOString(),
          metadata: {
            signupMethod: "email",
            initializedAt: new Date().toISOString(),
          },
        });

        await signOut(auth);

        return {
          success: true,
          email: email,
        };
      } catch (error) {
        console.error("Signup error:", error);
        throw error;
      }
    },
    []
  );

  const signin = useCallback(async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      if (!user.emailVerified) {
        await signOut(auth);
        throw new Error(
          "Please verify your email before signing in. Check your inbox!"
        );
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const storageKey = `groupify_signup_${user.uid}`;
        const storedSignupData = localStorage.getItem(storageKey);
        let signupData = null;
        if (storedSignupData) {
          try {
            signupData = JSON.parse(storedSignupData);
          } catch (e) {
            console.warn("Could not parse stored signup data");
          }
        }
        let finalDisplayName;
        if (signupData?.displayName) {
          finalDisplayName = signupData.displayName;
        } else if (user.displayName) {
          finalDisplayName = user.displayName;
        } else {
          finalDisplayName = user.email.split("@")[0];
        }
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: finalDisplayName,
          gender: signupData?.gender || "other",
          createdAt: signupData?.signupTimestamp || new Date().toISOString(),
          emailVerified: true,
          friends: [],
          profilePicture: user.photoURL || null,
          bio: "",
          location: "",
          joinedAt: new Date().toISOString(),
          subscription: {
            plan: "free",
            status: "active",
            createdAt: new Date().toISOString(),
          },
          usage: {
            events: 0,
            photos: 0,
            storage: 0,
            albums: 0,
          },
        };

        try {
          await setDoc(doc(db, "users", user.uid), userData);
          if (storedSignupData) {
            localStorage.removeItem(storageKey);
          }
        } catch (createError) {
          console.error(
            "Failed to create user document during sign-in:",
            createError
          );
          throw new Error(
            "Failed to complete account setup. Please try again."
          );
        }
      }

      return userCredential;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
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
            events: 0,
            photos: 0,
            storage: 0,
            albums: 0,
          },
        });

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
  }, []);

  const logout = useCallback(async () => {
    try {
      const currentUserId = currentUser?.uid;
      setCurrentUser(null);
      setUserPlan(null);
      localStorage.removeItem("userPlan");
      localStorage.removeItem("groupify_usage");
      localStorage.removeItem("groupify_billing_history");
      subscriptionService.clearCache();

      if (window.apiCache && currentUserId) {
        window.apiCache.clearUserData(currentUserId);
      }
      if (window.userStatsCache && currentUserId) {
        window.userStatsCache.invalidateUser(currentUserId);
      }
      if (window.clearGlobalData) {
        window.clearGlobalData();
      }

      return signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, [currentUser]);

  const resetPassword = useCallback(async (email) => {
    try {
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

  const updateUserPlan = useCallback(
    async (planData) => {
      try {
        if (!currentUser) {
          throw new Error("No authenticated user");
        }

        await setDoc(
          doc(db, "users", currentUser.uid),
          {
            subscription: planData,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        const updatedSubscription =
          subscriptionService.updateSubscription(planData);
        setUserPlan(updatedSubscription);
        return updatedSubscription;
      } catch (error) {
        console.error("Error updating user plan:", error);
        throw error;
      }
    },
    [currentUser]
  );

  useEffect(() => {
    if (
      currentUser?.displayName &&
      currentUser.displayName !== currentUser.displayName
    ) {
      console.warn("⚠️ DisplayName changed unexpectedly:", {
        uid: currentUser.uid,
        newDisplayName: currentUser.displayName,
        timestamp: new Date().toISOString(),
      });
    }
  }, [currentUser?.displayName]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (currentUser && user && currentUser.uid !== user.uid) {
        const previousUserId = currentUser.uid;
        if (window.apiCache) {
          window.apiCache.clearUserData(previousUserId);
        }
        if (window.userStatsCache) {
          window.userStatsCache.invalidateUser(previousUserId);
        }
        if (window.clearGlobalData) {
          window.clearGlobalData();
        }
      }

      if (user) {
        if (user.providerData[0]?.providerId === "google.com") {
          setCurrentUser(user);
          await initializeUserPlan(user);
        } else if (user.emailVerified) {
          setCurrentUser(user);
          await initializeUserPlan(user);
        } else {
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
      if (firstLoad.current) {
        setLoading(false);
        setInitialized(true);
        firstLoad.current = false;
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscriptionService.subscribe((event, data) => {
      if (event === "subscriptionUpdated" && currentUser) {
        setUserPlan(data);
      }
    });

    return unsubscribe;
  }, [currentUser]);

  const value = useMemo(
    () => ({
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
      isFreePlan: userPlan?.plan === "free",
      isPremiumPlan: userPlan?.plan === "premium",
      isProPlan: userPlan?.plan === "pro",
      planFeatures: userPlan?.features,
      planUsage: userPlan?.usage,
      isAuthenticated: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
      displayName: currentUser?.displayName,
    }),
    [
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
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
