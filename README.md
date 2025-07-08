# 📸 Groupify - Smart Photo Sharing for Group Events

![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-11.7.3-ffca28?logo=firebase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/github/license/groupify-team/groupify)
![Last Commit](https://img.shields.io/github/last-commit/groupify-team/groupify)

---

## 📚 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Packages Used](#-packages-used)
- [Installation](#-installation)
- [Folder Structure](#-folder-structure-client)
- [Known Issues](#-known-issues)
- [Contributors](#-contributors)

---

Groupify is a modern web app that helps groups of friends upload, manage, and share photos from events — using **face recognition** to automatically deliver personalized galleries.

Built with **React**, **Vite**, and **Firebase**, the app supports Event creation, friend management, photo uploads, and more.

---

## ✨ Features

- User authentication (sign up / log in / reset password)
- Create and join events
- Upload and browse event-specific photos
- Add and manage friends
- Dashboard with real-time updates
- Personalized gallery (coming soon)
- Face recognition & tagging (coming soon)

---

## 🎨 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend & Auth**: Firebase (Auth, Firestore, Storage)
- **Recognition**: External Face Recognition API (planned)
- **Hosting**: Firebase Hosting or Vercel

---

## 📦 Packages Used

| Category       | Package                                                                 | Purpose                          |
| -------------- | ----------------------------------------------------------------------- | -------------------------------- |
| UI Components  | `@mui/material`, `@heroicons/react`, `lucide-react`                     | Modals, icons, styled components |
| Styling        | `tailwindcss`, `tailwind-variants`, `clsx`                              | Utility-first CSS + variants     |
| Auth & Backend | `firebase`, `uuid`                                                      | Auth, Firestore, Storage         |
| File Upload    | `react-dropzone`, `react-easy-crop`                                     | Upload + crop UI                 |
| Face Detection | `@aws-sdk/client-rekognition`, `face-api.js`, `@mediapipe/tasks-vision` | AI-based recognition             |
| UX Enhancers   | `react-toastify`, `react-hot-toast`, `react-lazy-load-image-component`  | Toasts, lazy loading             |
| Routing        | `react-router-dom`                                                      | SPA navigation                   |
| Dev Tools      | `vite`, `eslint`, `postcss`, `@vitejs/plugin-react`                     | Build and linting                |

---

## 🔧 Installation

```bash
# 1. Clone the repo
https://github.com/groupify-team/groupify.git

# 2. Enter the client directory
cd client

# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev
```

Create a `.env` file in `client/` with:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_id
```

---

## 🔍 Folder Structure (client/)

```
client/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── App.jsx
├── public/
└── .env
```

---

## 🚫 Known Issues

- Face recognition integration in progress
- Responsive layout on some mobile views
- Dashboard may evolve with design changes

---

## 👨‍💼 Contributors

| Name       | Role                      | GitHub                                   |
| ---------- | ------------------------- | ---------------------------------------- |
| Adir Edri  | Fullstack & Deep Learning | [@adiredri](https://github.com/adiredri) |
| Ofir Almog | Fullstack & Deep Learning | [@Ofigu](https://github.com/Ofigu)       |

---

```
Groupify
├─ .firebaserc
├─ client
│  ├─ babel.config.js
│  ├─ cors.json
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ jest.config.js
│  ├─ openweather-proxy.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.cjs
│  ├─ public
│  │  ├─ groupifyLogo.png
│  │  └─ models
│  │     ├─ age_gender_model-shard1
│  │     ├─ age_gender_model-weights_manifest.json
│  │     ├─ face_expression_model-shard1
│  │     ├─ face_expression_model-weights_manifest.json
│  │     ├─ face_landmark_68_model-shard1
│  │     ├─ face_landmark_68_model-weights_manifest.json
│  │     ├─ face_recognition_model-shard1
│  │     ├─ face_recognition_model-shard2
│  │     ├─ face_recognition_model-weights_manifest.json
│  │     ├─ ssd_mobilenetv1_model-shard1
│  │     ├─ ssd_mobilenetv1_model-shard2
│  │     └─ ssd_mobilenetv1_model-weights_manifest.json
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ adirprofile.jpg
│  │  │  ├─ groupify-logo.html
│  │  │  ├─ ofirprofile.jpg
│  │  │  └─ react.svg
│  │  ├─ auth-area
│  │  │  ├─ components
│  │  │  │  ├─ layout
│  │  │  │  │  ├─ AuthHeader.jsx
│  │  │  │  │  └─ AuthLayout.jsx
│  │  │  │  ├─ ProtectedRoute.jsx
│  │  │  │  └─ ui
│  │  │  │     ├─ 3DInteractivePhotoStack.jsx
│  │  │  │     ├─ AuthForm.jsx
│  │  │  │     ├─ AuthVisual.jsx
│  │  │  │     ├─ DynamicLogo.jsx
│  │  │  │     ├─ EnhancedAuthForm.jsx
│  │  │  │     ├─ GenderSelector.jsx
│  │  │  │     ├─ LaunchAnimation.jsx
│  │  │  │     ├─ PasswordRequirements.jsx
│  │  │  │     ├─ PasswordStrengthIndicator.jsx
│  │  │  │     └─ SocialLoginButtons.jsx
│  │  │  ├─ contexts
│  │  │  │  └─ AuthContext.jsx
│  │  │  ├─ hooks
│  │  │  │  ├─ useAuth.js
│  │  │  │  ├─ useAuthAnimations.js
│  │  │  │  └─ useAuthValidation.js
│  │  │  ├─ pages
│  │  │  │  ├─ ConfirmEmailPage
│  │  │  │  │  └─ ConfirmEmailPage.jsx
│  │  │  │  ├─ ForgotPasswordPage
│  │  │  │  │  └─ ForgotPasswordPage.jsx
│  │  │  │  ├─ ResetPasswordPage
│  │  │  │  │  └─ ResetPasswordPage.jsx
│  │  │  │  ├─ SignInPage
│  │  │  │  │  └─ SignInPage.jsx
│  │  │  │  └─ SignUpPage
│  │  │  │     └─ SignUpPage.jsx
│  │  │  └─ services
│  │  │     ├─ authService.js
│  │  │     └─ validationService.js
│  │  ├─ components
│  │  │  ├─ EventActions
│  │  │  │  ├─ BulkEventActions.jsx
│  │  │  │  ├─ index.jsx
│  │  │  │  └─ EventInvitations.jsx
│  │  │  ├─ EventFilters
│  │  │  │  ├─ DateFilter.jsx
│  │  │  │  ├─ index.jsx
│  │  │  │  ├─ SearchFilter.jsx
│  │  │  │  └─ StatusFilter.jsx
│  │  │  └─ EventList
│  │  │     ├─ EmptyEventsState.jsx
│  │  │     ├─ index.jsx
│  │  │     └─ EventGrid.jsx
│  │  ├─ dashboard-area
│  │  │  ├─ components
│  │  │  │  ├─ layout
│  │  │  │  │  ├─ DashboardHeader.jsx
│  │  │  │  │  ├─ DashboardLayout.jsx
│  │  │  │  │  ├─ DashboardSidebar.jsx
│  │  │  │  │  └─ MobileBottomNav.jsx
│  │  │  │  ├─ sections
│  │  │  │  │  ├─ FriendsSection.jsx
│  │  │  │  │  └─ EventsSection.jsx
│  │  │  │  ├─ SettingsModal.jsx
│  │  │  │  ├─ ui
│  │  │  │  │  ├─ FilterDropdown.jsx
│  │  │  │  │  ├─ LoadingSpinner.jsx
│  │  │  │  │  └─ TabSwitcher.jsx
│  │  │  │  └─ widgets
│  │  │  │     └─ NotificationsDropdown.jsx
│  │  │  ├─ contexts
│  │  │  │  └─ DashboardModalsContext.jsx
│  │  │  ├─ features
│  │  │  │  ├─ friends
│  │  │  │  │  ├─ components
│  │  │  │  │  │  ├─ AddFriend.jsx
│  │  │  │  │  │  ├─ AddFriendModal.jsx
│  │  │  │  │  │  ├─ FriendRequestsModal.jsx
│  │  │  │  │  │  └─ UserProfileModal
│  │  │  │  │  │     └─ index.jsx
│  │  │  │  │  ├─ hooks
│  │  │  │  │  │  ├─ index.js
│  │  │  │  │  │  ├─ useFriendRequests.js
│  │  │  │  │  │  ├─ useFriends.js
│  │  │  │  │  │  └─ useFriendSearch.js
│  │  │  │  │  └─ services
│  │  │  │  │     └─ friendsService.js
│  │  │  │  ├─ photos
│  │  │  │  │  └─ components
│  │  │  │  │     └─ PhotoUpload.jsx
│  │  │  │  ├─ settings
│  │  │  │  │  ├─ components
│  │  │  │  │  │  ├─ modals
│  │  │  │  │  │  │  ├─ data
│  │  │  │  │  │  │  │  ├─ BackupModal.jsx
│  │  │  │  │  │  │  │  └─ ExportModal.jsx
│  │  │  │  │  │  │  ├─ DeleteAccountModal.jsx
│  │  │  │  │  │  │  ├─ faceProfile
│  │  │  │  │  │  │  │  ├─ FaceProfileManageModal.jsx
│  │  │  │  │  │  │  │  ├─ FaceProfileModal.jsx
│  │  │  │  │  │  │  │  ├─ SmartFaceScan.jsx
│  │  │  │  │  │  │  │  └─ ui
│  │  │  │  │  │  │  │     ├─ DesktopCameraView.jsx
│  │  │  │  │  │  │  │     ├─ MobileStepGuide.jsx
│  │  │  │  │  │  │  │     └─ Modern3DHead.jsx
│  │  │  │  │  │  │  ├─ index.js
│  │  │  │  │  │  │  ├─ profile
│  │  │  │  │  │  │  │  ├─ EditProfileModal.jsx
│  │  │  │  │  │  │  │  └─ ProfileImageCropper.jsx
│  │  │  │  │  │  │  └─ subscription
│  │  │  │  │  │  │     ├─ BillingHistoryModal.jsx
│  │  │  │  │  │  │     ├─ PlanManagementModal.jsx
│  │  │  │  │  │  │     └─ UsageModal.jsx
│  │  │  │  │  │  ├─ sections
│  │  │  │  │  │  │  ├─ AccountSection.jsx
│  │  │  │  │  │  │  ├─ DataSection.jsx
│  │  │  │  │  │  │  ├─ FaceProfileSection.jsx
│  │  │  │  │  │  │  ├─ NotificationSection.jsx
│  │  │  │  │  │  │  ├─ PrivacySection.jsx
│  │  │  │  │  │  │  ├─ SettingsSection.jsx
│  │  │  │  │  │  │  └─ SubscriptionSection.jsx
│  │  │  │  │  │  ├─ ui
│  │  │  │  │  │  │  ├─ SettingCard.jsx
│  │  │  │  │  │  │  └─ SettingToggle.jsx
│  │  │  │  │  │  └─ widgets
│  │  │  │  │  │     ├─ FaceProfileCard.jsx
│  │  │  │  │  │     ├─ QuickStatsCard.jsx
│  │  │  │  │  │     └─ SubscriptionCard.jsx
│  │  │  │  │  ├─ constants
│  │  │  │  │  │  └─ settingsConstants.jsx
│  │  │  │  │  ├─ hooks
│  │  │  │  │  │  ├─ cropImage.js
│  │  │  │  │  │  ├─ index.js
│  │  │  │  │  │  ├─ useDeleteAccount.js
│  │  │  │  │  │  ├─ useExportBackup.js
│  │  │  │  │  │  └─ useSettings.js
│  │  │  │  │  ├─ services
│  │  │  │  │  │  ├─ deleteAccountService.js
│  │  │  │  │  │  └─ settingsService.js
│  │  │  │  │  └─ utils
│  │  │  │  └─ events
│  │  │  │     ├─ components
│  │  │  │     │  ├─ createEventModal.jsx
│  │  │  │     │  └─ EventCard.jsx
│  │  │  │     ├─ hooks
│  │  │  │     │  ├─ usePerformanceMonitoring.js
│  │  │  │     │  ├─ useEventDetail.js
│  │  │  │     │  ├─ useEventInvitations.js
│  │  │  │     │  └─ useEvents.js
│  │  │  │     ├─ index.js
│  │  │  │     ├─ services
│  │  │  │     │  └─ eventsService.js
│  │  │  │     ├─ utils
│  │  │  │     │  ├─ eventConstants.js
│  │  │  │     │  ├─ eventHelpers.js
│  │  │  │     │  └─ eventValidation.js
│  │  │  │     └─ ViewEvent
│  │  │  │        ├─ components
│  │  │  │        │  └─ PhotoModal.jsx
│  │  │  │        ├─ features
│  │  │  │        │  ├─ faceRecognition
│  │  │  │        │  │  ├─ components
│  │  │  │        │  │  │  ├─ FaceRecognitionCard.jsx
│  │  │  │        │  │  │  ├─ FaceRecognitionModal.jsx
│  │  │  │        │  │  │  └─ FaceRecognitionResults.jsx
│  │  │  │        │  │  ├─ hooks
│  │  │  │        │  │  │  └─ useFaceRecognition.js
│  │  │  │        │  │  └─ service
│  │  │  │        │  │     └─ faceRecognitionService.js
│  │  │  │        │  ├─ gallery
│  │  │  │        │  │  ├─ components
│  │  │  │        │  │  │  ├─ modals
│  │  │  │        │  │  │  │  └─ AllPhotosModal.jsx
│  │  │  │        │  │  │  ├─ PhotoGallery.jsx
│  │  │  │        │  │  │  └─ PhotoUploadSection.jsx
│  │  │  │        │  │  ├─ hooks
│  │  │  │        │  │  │  ├─ usePhotoModal.js
│  │  │  │        │  │  │  ├─ usePhotoOperations.js
│  │  │  │        │  │  │  ├─ usePhotoSelection.js
│  │  │  │        │  │  │  └─ useEventPhotos.js
│  │  │  │        │  │  └─ utils
│  │  │  │        │  │     └─ photoHelpers.js
│  │  │  │        │  ├─ header
│  │  │  │        │  │  ├─ components
│  │  │  │        │  │  │  └─ EventHeader.jsx
│  │  │  │        │  │  └─ hooks
│  │  │  │        │  │     └─ EditEventModal.jsx
│  │  │  │        │  ├─ members
│  │  │  │        │  │  ├─ components
│  │  │  │        │  │  │  ├─ InviteFriendDropdown.jsx
│  │  │  │        │  │  │  ├─ InvitePeopleCard.jsx
│  │  │  │        │  │  │  ├─ EventMembersCard.jsx
│  │  │  │        │  │  │  └─ UserProfileModal.jsx
│  │  │  │        │  │  └─ hooks
│  │  │  │        │  │     ├─ useFriendship.js
│  │  │  │        │  │     ├─ useInviteFriends.js
│  │  │  │        │  │     └─ useEventMembers.js
│  │  │  │        │  └─ statistics
│  │  │  │        │     └─ components
│  │  │  │        │        └─ EventStatistics.jsx
│  │  │  │        ├─ hooks
│  │  │  │        │  └─ useEventData.js
│  │  │  │        └─ EventDetailView.jsx
│  │  │  ├─ hooks
│  │  │  │  ├─ useDashboardData.js
│  │  │  │  ├─ useDashboardLayout.js
│  │  │  │  └─ useDashboardNavigation.js
│  │  │  ├─ pages
│  │  │  │  └─ DashboardPage.jsx
│  │  │  └─ utils
│  │  │     ├─ dashboardConstants.jsx
│  │  │     └─ dashboardHelpers.js
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  ├─ public-area
│  │  │  ├─ components
│  │  │  │  ├─ layout
│  │  │  │  │  ├─ HomeHeader.jsx
│  │  │  │  │  ├─ PublicFooter.jsx
│  │  │  │  │  ├─ PublicHeader.jsx
│  │  │  │  │  └─ PublicLayout.jsx
│  │  │  │  └─ ui
│  │  │  │     ├─ ContactForm.jsx
│  │  │  │     ├─ FeatureCard.jsx
│  │  │  │     ├─ HeroSection.jsx
│  │  │  │     └─ PricingCard.jsx
│  │  │  ├─ hooks
│  │  │  │  ├─ useContactForm.js
│  │  │  │  └─ usePublicNavigation.js
│  │  │  ├─ pages
│  │  │  │  ├─ AboutPage
│  │  │  │  │  └─ AboutPage.jsx
│  │  │  │  ├─ BillingPage
│  │  │  │  │  └─ BillingPage.jsx
│  │  │  │  ├─ BlogPage
│  │  │  │  │  └─ BlogPage.jsx
│  │  │  │  ├─ CareersPage
│  │  │  │  │  └─ CareersPage.jsx
│  │  │  │  ├─ ContactPage
│  │  │  │  │  └─ ContactPage.jsx
│  │  │  │  ├─ FeaturesPage
│  │  │  │  │  └─ FeaturesPage.jsx
│  │  │  │  ├─ HelpCenterPage
│  │  │  │  │  └─ HelpCenterPage.jsx
│  │  │  │  ├─ HomePage
│  │  │  │  │  └─ HomePage.jsx
│  │  │  │  ├─ PricingPage
│  │  │  │  │  └─ PricingPage.jsx
│  │  │  │  ├─ PrivacyPolicyPage
│  │  │  │  │  └─ PrivacyPolicyPage.jsx
│  │  │  │  ├─ StatusPage
│  │  │  │  │  └─ StatusPage.jsx
│  │  │  │  └─ TermsOfServicePage
│  │  │  │     └─ TermsOfServicePage.jsx
│  │  │  └─ services
│  │  │     └─ contactService.js
│  │  ├─ shared
│  │  │  ├─ components
│  │  │  │  ├─ accessibility
│  │  │  │  │  ├─ AccessibilityModal.jsx
│  │  │  │  │  ├─ components
│  │  │  │  │  │  ├─ AppearanceSettings.jsx
│  │  │  │  │  │  ├─ AudioSettings.jsx
│  │  │  │  │  │  ├─ ContrastSettings.jsx
│  │  │  │  │  │  ├─ FontSettings.jsx
│  │  │  │  │  │  ├─ LanguageSettings.jsx
│  │  │  │  │  │  ├─ ModalHeader.jsx
│  │  │  │  │  │  └─ MotionSettings.jsx
│  │  │  │  │  ├─ GlobalAccessibilityProvider.jsx
│  │  │  │  │  ├─ hooks
│  │  │  │  │  │  ├─ useAccessibilitySettings.js
│  │  │  │  │  │  ├─ useContrastMode.js
│  │  │  │  │  │  ├─ useFontSize.js
│  │  │  │  │  │  └─ useReducedMotion.js
│  │  │  │  │  ├─ styles
│  │  │  │  │  │  └─ accessibility.css
│  │  │  │  │  └─ utils
│  │  │  │  │     ├─ accessibilityConstants.js
│  │  │  │  │     └─ accessibilityHelpers.js
│  │  │  │  ├─ billing
│  │  │  │  │  ├─ BillingPage.jsx
│  │  │  │  │  └─ PricingPage.jsx
│  │  │  │  └─ ui
│  │  │  │     └─ CloudFlareTurnstileGate.jsx
│  │  │  ├─ contexts
│  │  │  │  └─ ThemeContext.jsx
│  │  │  ├─ hooks
│  │  │  │  ├─ useClickOutside.js
│  │  │  │  └─ usePlanLimits.jsx
│  │  │  ├─ index.js
│  │  │  ├─ services
│  │  │  │  ├─ exportService.js
│  │  │  │  ├─ firebase
│  │  │  │  │  ├─ config.js
│  │  │  │  │  ├─ faceProfiles.js
│  │  │  │  │  ├─ storage.js
│  │  │  │  │  ├─ events.js
│  │  │  │  │  └─ users.js
│  │  │  │  ├─ navigationService.js
│  │  │  │  ├─ notificationHelper.js
│  │  │  │  ├─ privacyService.js
│  │  │  │  └─ subscriptionService.js
│  │  │  └─ utils
│  │  │     └─ responsiveHelpers.js
│  │  └─ tests
│  │     ├─ api
│  │     │  └─ userServices.test.js
│  │     ├─ components
│  │     │  └─ EventCard.test.js
│  │     ├─ database
│  │     │  └─ firestoreQueries.test.js
│  │     ├─ setup.js
│  │     └─ __mocks__
│  │        └─ firebase.js
│  ├─ src_tree.txt
│  ├─ tailwind.config.js
│  └─ vite.config.js
├─ docs
│  ├─ gitCommands.txt
│  ├─ src_tree.txt
│  └─ tree.txt
├─ firebase.json
├─ firestore.indexes.json
├─ firestore.rules
├─ firestore.rules.backup
├─ functions
│  ├─ .eslintrc.js
│  ├─ email-templates
│  │  ├─ contactus.html
│  │  ├─ resetpassword.html
│  │  ├─ verification.html
│  │  └─ welcome.html
│  ├─ index.js
│  ├─ package-lock.json
│  └─ package.json
├─ README.md
├─ src_tree.txt
└─ storage.rules

```
