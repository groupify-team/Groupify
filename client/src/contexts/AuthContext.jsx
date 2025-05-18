import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase/config';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Create user profile in Firestore (we'll add this later)
    try {
      const { createUserProfile } = await import('../services/firebase/users');
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email,
        displayName: displayName || '',
        photoURL: userCredential.user.photoURL || ''
      });
    } catch (error) {
      console.log('User profile creation will be added later');
    }
    
    return userCredential;
  };

  // Sign in with email and password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Add specific client ID if needed
      // Uncomment and add your OAuth client ID from Google Cloud Console
      // provider.setCustomParameters({
      //   client_id: 'YOUR_GOOGLE_CLOUD_CLIENT_ID'
      // });
      
      // Add scopes
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      
      // Force account selection even when already signed in
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Debug - print which provider we're using
      console.log("Starting Google sign-in process...");
      
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful", result.user.email);
      
      // Create user profile if it doesn't exist (we'll add this later)
      try {
        const { createUserProfile } = await import('../services/firebase/users');
        await createUserProfile(result.user.uid, {
          email: result.user.email,
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || ''
        });
      } catch (error) {
        console.log('User profile creation will be added later');
      }
      
      return result;
    } catch (error) {
      console.error('Google Sign In Error:', error);
      // More detailed error information
      console.error(`Error Code: ${error.code}`);
      console.error(`Error Message: ${error.message}`);
      
      // Firebase auth error
      if (error.code === 'auth/unauthorized-domain') {
        console.error('The domain is not authorized. Add it in Firebase console.');
      }
      
      throw error;
    }
  };

  // Sign out
  const logout = () => {
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update user profile
  const updateUserProfile = (updates) => {
    return updateProfile(auth.currentUser, updates);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};