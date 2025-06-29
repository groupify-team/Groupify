import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../../shared/services/firebase/config";

export const authService = {
  // Sign up with email and password
  async signUp(email, password, displayName, gender = "male") {
    try {
      console.log("Creating user account:", email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      // Create user document
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        displayName,
        gender,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        friends: [],
        profilePicture: null,
        bio: "",
        location: "",
        joinedAt: new Date().toISOString(),
      });

      // Send verification email
      const sendVerificationEmail = httpsCallable(functions, "sendVerificationEmail");
      await sendVerificationEmail({ email, name: displayName });

      // Sign out user until verified
      await signOut(auth);

      return { success: true, email };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        throw new Error("Please verify your email before signing in. Check your inbox!");
      }

      return userCredential;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Enable Google auth
      const enableGoogleAuth = httpsCallable(functions, "enableGoogleAuth");
      await enableGoogleAuth({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      // Create user document if doesn't exist
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
        });
      }

      return result;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      const resendFunction = httpsCallable(functions, "resendVerificationCode");
      const result = await resendFunction({ email });
      return result.data;
    } catch (error) {
      console.error("Resend verification error:", error);
      throw error;
    }
  }
};