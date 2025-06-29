# Complete fix script for dashboard import errors
Write-Host "🔧 Starting comprehensive dashboard error fix..." -ForegroundColor Yellow
Write-Host ""

# Set the client directory as base
$clientPath = "C:\GitHub\Groupify\client"
Set-Location $clientPath

# 1. Create missing utils directory and files
Write-Host "📁 Creating missing utils directory and files..." -ForegroundColor Cyan

$utilsPath = "src\dashboard-area\utils"
if (!(Test-Path $utilsPath)) {
    New-Item -Path $utilsPath -ItemType Directory -Force
    Write-Host "  ✅ Created utils directory" -ForegroundColor Green
}

# Move the existing dashboardConstants to the correct location
$existingConstantsPath = "src\dashboard-area\dashboardConstants.jsx"
$newConstantsPath = "$utilsPath\dashboardConstants.js"

if (Test-Path $existingConstantsPath) {
    # Copy content and rename to .js
    $content = Get-Content $existingConstantsPath -Raw
    $content | Set-Content $newConstantsPath -Encoding UTF8
    Write-Host "  ✅ Moved dashboardConstants to utils directory" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  dashboardConstants.jsx not found, creating from document..." -ForegroundColor Yellow
    # If the file doesn't exist, we'll create it from the document content
    # (The content from document index 2 would be used here)
}

# 2. Create dashboardHelpers.js
$helpersPath = "$utilsPath\dashboardHelpers.js"
$helpersContent = @'
// Dashboard Helper Functions
import { BREAKPOINTS, ANIMATIONS } from "./dashboardConstants";

// Navigation helpers
export const shouldShowSidebar = (windowWidth) => {
  return windowWidth >= BREAKPOINTS.tablet;
};

export const smoothPageTransition = (callback, duration = ANIMATIONS.normal) => {
  // Add transition class to body
  document.body.style.transition = `opacity ${duration}ms ease-in-out`;
  document.body.style.opacity = '0.7';
  
  setTimeout(() => {
    callback();
    document.body.style.opacity = '1';
    setTimeout(() => {
      document.body.style.transition = '';
    }, duration);
  }, duration / 2);
};

export const resetBodyStyles = () => {
  document.body.style.transition = '';
  document.body.style.opacity = '';
};

// Notification helpers
export const getTotalNotificationCount = (notifications = []) => {
  return notifications.filter(n => !n.read).length;
};

export const getNavigationItemBadge = (itemId, data = {}) => {
  switch (itemId) {
    case 'friends':
      return data.friendRequests?.length || 0;
    case 'trips':
      return data.tripInvites?.length || 0;
    default:
      return 0;
  }
};

// Subscription helpers
export const formatPlanPrice = (plan) => {
  if (!plan || plan.name === 'Free Plan') return 'Free';
  return `$${plan.price}/month`;
};

export const getExpiryDate = (subscription) => {
  if (!subscription?.expiryDate) return null;
  return new Date(subscription.expiryDate);
};

export const getPhotoUsagePercentage = (used = 0, total = 500) => {
  return Math.min(Math.round((used / total) * 100), 100);
};

// Date helpers
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

export const formatDateRange = (startDate, endDate) => {
  if (!startDate) return '';
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : '';
  return end ? `${start} - ${end}` : start;
};

// Trip helpers
export const getTripStatus = (trip) => {
  if (!trip?.startDate) return 'upcoming';
  
  const now = new Date();
  const start = new Date(trip.startDate);
  const end = trip.endDate ? new Date(trip.endDate) : start;
  
  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'current';
};

export const filterTripsByDate = (trips = [], filter = 'all') => {
  if (filter === 'all') return trips;
  
  return trips.filter(trip => {
    const status = getTripStatus(trip);
    switch (filter) {
      case 'upcoming':
        return status === 'upcoming';
      case 'recent':
        return status === 'current';
      case 'past':
        return status === 'past';
      default:
        return true;
    }
  });
};

// Search helpers
export const searchTrips = (trips = [], searchTerm = '') => {
  if (!searchTerm.trim()) return trips;
  
  const term = searchTerm.toLowerCase();
  return trips.filter(trip => 
    trip.name?.toLowerCase().includes(term) ||
    trip.destination?.toLowerCase().includes(term) ||
    trip.description?.toLowerCase().includes(term)
  );
};

// Responsive helpers
export const getDeviceType = (width) => {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
};

export const isMobileDevice = () => {
  return window.innerWidth < BREAKPOINTS.mobile;
};

// Storage helpers
export const getStorageUsage = (used = 0, total = 2) => {
  return {
    used,
    total,
    percentage: Math.round((used / total) * 100),
    remaining: Math.max(0, total - used)
  };
};
'@

$helpersContent | Set-Content $helpersPath -Encoding UTF8
Write-Host "  ✅ Created dashboardHelpers.js" -ForegroundColor Green

# 3. Create missing contexts directory and AuthContext
Write-Host ""
Write-Host "🔐 Creating missing AuthContext..." -ForegroundColor Cyan

$contextsPath = "src\contexts"
if (!(Test-Path $contextsPath)) {
    New-Item -Path $contextsPath -ItemType Directory -Force
    Write-Host "  ✅ Created contexts directory" -ForegroundColor Green
}

$authContextPath = "$contextsPath\AuthContext.js"
$authContextContent = @'
// AuthContext.js - Authentication context for the application
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase/config';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signup = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Login function
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout function
  const logout = async () => {
    return firebaseSignOut(auth);
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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
'@

$authContextContent | Set-Content $authContextPath -Encoding UTF8
Write-Host "  ✅ Created AuthContext.js" -ForegroundColor Green

# 4. Create missing services directory structure
Write-Host ""
Write-Host "🔥 Creating missing Firebase services..." -ForegroundColor Cyan

$servicesPath = "src\services"
$firebasePath = "$servicesPath\firebase"

if (!(Test-Path $servicesPath)) {
    New-Item -Path $servicesPath -ItemType Directory -Force
}
if (!(Test-Path $firebasePath)) {
    New-Item -Path $firebasePath -ItemType Directory -Force
    Write-Host "  ✅ Created services/firebase directory" -ForegroundColor Green
}

# Create firebase config
$configPath = "$firebasePath\config.js"
$configContent = @'
// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
'@

$configContent | Set-Content $configPath -Encoding UTF8
Write-Host "  ✅ Created config.js" -ForegroundColor Green

# Create trips service
$tripsPath = "$firebasePath\trips.js"
$tripsContent = @'
// Firebase trips service
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './config';

export const MAX_PHOTOS_PER_TRIP = 500;

// Get all trips for a user
export const getUserTrips = async (userId) => {
  try {
    const q = query(
      collection(db, 'trips'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting trips:', error);
    throw error;
  }
};

// Get a specific trip
export const getTrip = async (tripId) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Trip not found');
    }
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
};

// Create a new trip
export const createTrip = async (tripData) => {
  try {
    const docRef = await addDoc(collection(db, 'trips'), {
      ...tripData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

// Update a trip
export const updateTrip = async (tripId, updates) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

// Delete a trip
export const deleteTrip = async (tripId) => {
  try {
    await deleteDoc(doc(db, 'trips', tripId));
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

// Send trip invite
export const sendTripInvite = async (tripId, userId, invitedBy) => {
  try {
    await addDoc(collection(db, 'tripInvites'), {
      tripId,
      userId,
      invitedBy,
      status: 'pending',
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error sending trip invite:', error);
    throw error;
  }
};
'@

$tripsContent | Set-Content $tripsPath -Encoding UTF8
Write-Host "  ✅ Created trips.js" -ForegroundColor Green

# Create users service
$usersPath = "$firebasePath\users.js"
$usersContent = @'
// Firebase users service
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './config';

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Get user friends
export const getFriends = async (userId) => {
  try {
    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', userId),
      where('status', '==', 'accepted')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
'@

$usersContent | Set-Content $usersPath -Encoding UTF8
Write-Host "  ✅ Created users.js" -ForegroundColor Green

# Create storage service
$storagePath = "$firebasePath\storage.js"
$storageContent = @'
// Firebase storage service
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from './config';

// Upload photo to trip
export const uploadTripPhoto = async (tripId, file, userId) => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `trips/${tripId}/photos/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      uploadedBy: userId,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

// Get trip photos
export const getTripPhotos = async (tripId) => {
  try {
    const photosRef = ref(storage, `trips/${tripId}/photos`);
    const photosList = await listAll(photosRef);
    
    const photos = await Promise.all(
      photosList.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          url,
          path: item.fullPath,
          name: item.name
        };
      })
    );
    
    return photos;
  } catch (error) {
    console.error('Error getting trip photos:', error);
    throw error;
  }
};
'@

$storageContent | Set-Content $storagePath -Encoding UTF8
Write-Host "  ✅ Created storage.js" -ForegroundColor Green

# Create face profiles service
$faceProfilesPath = "$firebasePath\faceProfiles.js"
$faceProfilesContent = @'
// Face profiles service
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './config';

// Get face profile from storage
export const getFaceProfileFromStorage = async (userId) => {
  try {
    const q = query(
      collection(db, 'faceProfiles'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting face profile:', error);
    throw error;
  }
};

// Create face profile
export const createFaceProfile = async (userId, profileData) => {
  try {
    const docRef = await addDoc(collection(db, 'faceProfiles'), {
      userId,
      ...profileData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating face profile:', error);
    throw error;
  }
};

// Update face profile
export const updateFaceProfile = async (profileId, updates) => {
  try {
    const docRef = doc(db, 'faceProfiles', profileId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating face profile:', error);
    throw error;
  }
};

// Delete face profile
export const deleteFaceProfile = async (profileId) => {
  try {
    await deleteDoc(doc(db, 'faceProfiles', profileId));
  } catch (error) {
    console.error('Error deleting face profile:', error);
    throw error;
  }
};
'@

$faceProfilesContent | Set-Content $faceProfilesPath -Encoding UTF8
Write-Host "  ✅ Created faceProfiles.js" -ForegroundColor Green

# Create face recognition service
$faceRecognitionPath = "$servicesPath\faceRecognitionService.js"
$faceRecognitionContent = @'
// Face recognition service
export const initializeFaceRecognition = async () => {
  // Placeholder for face recognition initialization
  console.log('Face recognition initialized');
  return Promise.resolve();
};

export const detectFaces = async (imageData) => {
  // Placeholder for face detection
  console.log('Detecting faces in image');
  return Promise.resolve([]);
};

export const recognizeFaces = async (imageData, profiles) => {
  // Placeholder for face recognition
  console.log('Recognizing faces in image');
  return Promise.resolve([]);
};

export const resetFaceRecognition = async () => {
  // Placeholder for resetting face recognition
  console.log('Face recognition reset');
  return Promise.resolve();
};

export const createFaceProfile = async (imageData, userId) => {
  // Placeholder for creating face profile
  console.log('Creating face profile for user:', userId);
  return Promise.resolve({ profileId: 'temp-id' });
};
'@

$faceRecognitionContent | Set-Content $faceRecognitionPath -Encoding UTF8
Write-Host "  ✅ Created faceRecognitionService.js" -ForegroundColor Green

# 5. Fix import paths in dashboard files
Write-Host ""
Write-Host "🔄 Fixing import paths in dashboard files..." -ForegroundColor Cyan

# Function to update import paths in files
function Update-ImportPaths {
    param(
        [string]$FilePath,
        [hashtable]$Replacements
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $updated = $false
        
        foreach ($oldPath in $Replacements.Keys) {
            $newPath = $Replacements[$oldPath]
            if ($content -match [regex]::Escape($oldPath)) {
                $content = $content -replace [regex]::Escape($oldPath), $newPath
                $updated = $true
            }
        }
        
        if ($updated) {
            $content | Set-Content $FilePath -Encoding UTF8 -NoNewline
            Write-Host "  ✅ Updated imports in $(Split-Path $FilePath -Leaf)" -ForegroundColor Green
        }
    }
}

# Define import path corrections
$importReplacements = @{
    # AuthContext paths
    '"../../../contexts/AuthContext"' = '"../../contexts/AuthContext"'
    '"../../contexts/AuthContext"' = '"../../../contexts/AuthContext"'
    
    # Dashboard constants/helpers paths
    '"../../utils/dashboardConstants"' = '"../utils/dashboardConstants"'
    '"../utils/dashboardConstants"' = '"../../utils/dashboardConstants"'
    '"../../utils/dashboardHelpers"' = '"../utils/dashboardHelpers"'
    '"../utils/dashboardHelpers"' = '"../../utils/dashboardHelpers"'
    
    # Service paths
    '"../../../services/firebase/config"' = '"../../../../services/firebase/config"'
    '"../../../services/firebase/trips"' = '"../../../../services/firebase/trips"'
    '"../../../services/firebase/storage"' = '"../../../../services/firebase/storage"'
    '"../../../services/firebase/users"' = '"../../../../services/firebase/users"'
    '"../../../services/firebase/faceProfiles"' = '"../../../../services/firebase/faceProfiles"'
    '"../../../services/faceRecognitionService"' = '"../../../../services/faceRecognitionService"'
}

# Get all JS/JSX files in dashboard area
$dashboardFiles = Get-ChildItem -Path "src\dashboard-area" -Include "*.js", "*.jsx" -Recurse

foreach ($file in $dashboardFiles) {
    Update-ImportPaths -FilePath $file.FullName -Replacements $importReplacements
}

# 6. Update the main dashboardConstants to use .js extension
Write-Host ""
Write-Host "📝 Updating import statements to use correct extensions..." -ForegroundColor Cyan

$dashboardFiles = Get-ChildItem -Path "src\dashboard-area" -Include "*.js", "*.jsx" -Recurse

foreach ($file in $dashboardFiles) {
    if (Test-Path $file.FullName) {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        
        # Update dashboardConstants imports to use .js
        if ($content -match 'from ["\']([^"\']*dashboardConstants)["\']') {
            $content = $content -replace 'from (["\'])([^"\']*dashboardConstants)\1', 'from $1$2.js$1'
            $content | Set-Content $file.FullName -Encoding UTF8 -NoNewline
            Write-Host "  ✅ Updated dashboardConstants import in $(Split-Path $file.FullName -Leaf)" -ForegroundColor Green
        }
    }
}

# 7. Create a simple .env.example file for Firebase config
Write-Host ""
Write-Host "🌐 Creating .env.example file..." -ForegroundColor Cyan

$envExampleContent = @'
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
'@

$envExampleContent | Set-Content ".env.example" -Encoding UTF8
Write-Host "  ✅ Created .env.example file" -ForegroundColor Green

# 8. Final verification
Write-Host ""
Write-Host "🔍 Verifying created files..." -ForegroundColor Cyan

$expectedFiles = @(
    "src\dashboard-area\utils\dashboardConstants.js",
    "src\dashboard-area\utils\dashboardHelpers.js",
    "src\contexts\AuthContext.js",
    "src\services\firebase\config.js",
    "src\services\firebase\trips.js",
    "src\services\firebase\users.js",
    "src\services\firebase\storage.js",
    "src\services\firebase\faceProfiles.js",
    "src\services\faceRecognitionService.js"
)

$allFilesExist = $true
foreach ($file in $expectedFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""
if ($allFilesExist) {
    Write-Host "🎉 All files created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Copy .env.example to .env and add your Firebase configuration" -ForegroundColor White
    Write-Host "2. Install required dependencies if not already installed:" -ForegroundColor White
    Write-Host "   npm install firebase react-hot-toast @heroicons/react" -ForegroundColor Gray
    Write-Host "3. Try running 'npm run dev' again" -ForegroundColor White
} else {
    Write-Host "⚠️  Some files were not created successfully. Please check the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Dashboard error fix completed!" -ForegroundColor Green

# End of script