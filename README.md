
```
Groupify
├─ .firebaserc
├─ client
│  ├─ babel.config.js
│  ├─ cors.json
│  ├─ dependencies.md
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ jest.config.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.cjs
│  ├─ public
│  │  ├─ advanced-performance-test.js
│  │  ├─ critical-fixes-test.js
│  │  ├─ groupifyLogo.png
│  │  ├─ models
│  │  │  ├─ age_gender_model-shard1
│  │  │  ├─ age_gender_model-weights_manifest.json
│  │  │  ├─ face_expression_model-shard1
│  │  │  ├─ face_expression_model-weights_manifest.json
│  │  │  ├─ face_landmark_68_model-shard1
│  │  │  ├─ face_landmark_68_model-weights_manifest.json
│  │  │  ├─ face_recognition_model-shard1
│  │  │  ├─ face_recognition_model-shard2
│  │  │  ├─ face_recognition_model-weights_manifest.json
│  │  │  ├─ ssd_mobilenetv1_model-shard1
│  │  │  ├─ ssd_mobilenetv1_model-shard2
│  │  │  └─ ssd_mobilenetv1_model-weights_manifest.json
│  │  ├─ performance-test.js
│  │  └─ test-friends-fix.js
│  ├─ README.md
│  ├─ src
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
│  │  │  ├─ index.js
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
│  │  ├─ config
│  │  ├─ dashboard-area
│  │  │  ├─ components
│  │  │  │  ├─ layout
│  │  │  │  │  ├─ DashboardHeader.jsx
│  │  │  │  │  ├─ DashboardLayout.jsx
│  │  │  │  │  ├─ DashboardSidebar.jsx
│  │  │  │  │  ├─ DashboardSkeleton.jsx
│  │  │  │  │  └─ MobileBottomNav.jsx
│  │  │  │  ├─ sections
│  │  │  │  │  └─ EventsSection.jsx
│  │  │  │  ├─ SettingsModal.jsx
│  │  │  │  ├─ ui
│  │  │  │  │  ├─ FilterDropdown.jsx
│  │  │  │  │  └─ TabSwitcher.jsx
│  │  │  │  └─ widgets
│  │  │  │     └─ NotificationsDropdown.jsx
│  │  │  ├─ contexts
│  │  │  │  └─ DashboardModalsContext.jsx
│  │  │  ├─ features
│  │  │  │  ├─ events
│  │  │  │  │  ├─ components
│  │  │  │  │  │  ├─ CreateEventModal.jsx
│  │  │  │  │  │  ├─ EventActions
│  │  │  │  │  │  │  ├─ BulkEventActions.jsx
│  │  │  │  │  │  │  ├─ EventInvitations.jsx
│  │  │  │  │  │  │  └─ index.jsx
│  │  │  │  │  │  ├─ EventCard.jsx
│  │  │  │  │  │  ├─ EventFilters
│  │  │  │  │  │  │  ├─ DateFilter.jsx
│  │  │  │  │  │  │  ├─ index.jsx
│  │  │  │  │  │  │  ├─ SearchFilter.jsx
│  │  │  │  │  │  │  └─ StatusFilter.jsx
│  │  │  │  │  │  ├─ EventList
│  │  │  │  │  │  │  ├─ EmptyEventsState.jsx
│  │  │  │  │  │  │  ├─ EventGrid.jsx
│  │  │  │  │  │  │  └─ index.jsx
│  │  │  │  │  │  └─ EventsLimitBanner.jsx
│  │  │  │  │  ├─ hooks
│  │  │  │  │  │  ├─ useEventDetail.js
│  │  │  │  │  │  ├─ useEventInvitations.js
│  │  │  │  │  │  ├─ useEvents.js
│  │  │  │  │  │  └─ usePerformanceMonitoring.js
│  │  │  │  │  ├─ index.js
│  │  │  │  │  ├─ services
│  │  │  │  │  │  └─ eventsService.js
│  │  │  │  │  ├─ utils
│  │  │  │  │  │  ├─ eventConstants.js
│  │  │  │  │  │  ├─ eventHelpers.js
│  │  │  │  │  │  └─ eventValidation.js
│  │  │  │  │  └─ ViewEvent
│  │  │  │  │     ├─ components
│  │  │  │  │     │  └─ PhotoModal.jsx
│  │  │  │  │     ├─ EventDetailView.jsx
│  │  │  │  │     ├─ features
│  │  │  │  │     │  ├─ faceRecognition
│  │  │  │  │     │  │  ├─ components
│  │  │  │  │     │  │  │  ├─ FaceRecognitionCard.jsx
│  │  │  │  │     │  │  │  ├─ FaceRecognitionModal.jsx
│  │  │  │  │     │  │  │  └─ FaceRecognitionResults.jsx
│  │  │  │  │     │  │  ├─ hooks
│  │  │  │  │     │  │  │  └─ useFaceRecognition.js
│  │  │  │  │     │  │  └─ service
│  │  │  │  │     │  │     └─ faceRecognitionService.js
│  │  │  │  │     │  ├─ gallery
│  │  │  │  │     │  │  ├─ components
│  │  │  │  │     │  │  │  ├─ modals
│  │  │  │  │     │  │  │  │  └─ AllPhotosModal.jsx
│  │  │  │  │     │  │  │  ├─ PhotoGallery.jsx
│  │  │  │  │     │  │  │  ├─ PhotoLimitBanner.jsx
│  │  │  │  │     │  │  │  └─ PhotoUploadSection.jsx
│  │  │  │  │     │  │  ├─ hooks
│  │  │  │  │     │  │  │  ├─ useEventPhotos.js
│  │  │  │  │     │  │  │  ├─ usePhotoModal.js
│  │  │  │  │     │  │  │  ├─ usePhotoOperations.js
│  │  │  │  │     │  │  │  ├─ usePhotoSelection.js
│  │  │  │  │     │  │  │  └─ usePhotoUploadLimits.js
│  │  │  │  │     │  │  └─ utils
│  │  │  │  │     │  │     └─ photoHelpers.js
│  │  │  │  │     │  ├─ header
│  │  │  │  │     │  │  ├─ components
│  │  │  │  │     │  │  │  └─ EventHeader.jsx
│  │  │  │  │     │  │  └─ hooks
│  │  │  │  │     │  │     └─ EditEventModal.jsx
│  │  │  │  │     │  ├─ members
│  │  │  │  │     │  │  ├─ components
│  │  │  │  │     │  │  │  ├─ EventMembersCard.jsx
│  │  │  │  │     │  │  │  ├─ InviteFriendDropdown.jsx
│  │  │  │  │     │  │  │  └─ InvitePeopleCard.jsx
│  │  │  │  │     │  │  └─ hooks
│  │  │  │  │     │  │     ├─ useEventMemberLimits.js
│  │  │  │  │     │  │     ├─ useEventMembers.js
│  │  │  │  │     │  │     ├─ useFriendship.js
│  │  │  │  │     │  │     └─ useInviteFriends.js
│  │  │  │  │     │  └─ statistics
│  │  │  │  │     │     └─ components
│  │  │  │  │     │        └─ EventStatistics.jsx
│  │  │  │  │     └─ hooks
│  │  │  │  │        ├─ useEventData.js
│  │  │  │  │        └─ useEventPhotos.js
│  │  │  │  ├─ friends
│  │  │  │  │  ├─ components
│  │  │  │  │  │  ├─ AddFriend.jsx
│  │  │  │  │  │  ├─ AddFriendModal.jsx
│  │  │  │  │  │  ├─ FriendRequestsList.jsx
│  │  │  │  │  │  ├─ FriendRequestsModal.jsx
│  │  │  │  │  │  └─ FriendsList.jsx
│  │  │  │  │  ├─ FriendsSection.jsx
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
│  │  │  │  └─ settings
│  │  │  │     ├─ components
│  │  │  │     │  ├─ modals
│  │  │  │     │  │  ├─ data
│  │  │  │     │  │  │  ├─ BackupModal.jsx
│  │  │  │     │  │  │  └─ ExportModal.jsx
│  │  │  │     │  │  ├─ DeleteAccountModal.jsx
│  │  │  │     │  │  ├─ faceProfile
│  │  │  │     │  │  │  ├─ FaceProfileManageModal.jsx
│  │  │  │     │  │  │  ├─ FaceProfileModal.jsx
│  │  │  │     │  │  │  ├─ SmartFaceScan.jsx
│  │  │  │     │  │  │  └─ ui
│  │  │  │     │  │  │     ├─ DesktopCameraView.jsx
│  │  │  │     │  │  │     ├─ MobileStepGuide.jsx
│  │  │  │     │  │  │     └─ Modern3DHead.jsx
│  │  │  │     │  │  ├─ index.js
│  │  │  │     │  │  ├─ profile
│  │  │  │     │  │  │  ├─ EditProfileModal.jsx
│  │  │  │     │  │  │  └─ ProfileImageCropper.jsx
│  │  │  │     │  │  └─ subscription
│  │  │  │     │  │     ├─ BillingHistoryModal.jsx
│  │  │  │     │  │     ├─ PlanManagementModal.jsx
│  │  │  │     │  │     └─ UsageModal.jsx
│  │  │  │     │  ├─ sections
│  │  │  │     │  │  ├─ AccountSection.jsx
│  │  │  │     │  │  ├─ DataSection.jsx
│  │  │  │     │  │  ├─ FaceProfileSection.jsx
│  │  │  │     │  │  ├─ NotificationSection.jsx
│  │  │  │     │  │  ├─ PrivacySection.jsx
│  │  │  │     │  │  ├─ SettingsSection.jsx
│  │  │  │     │  │  └─ SubscriptionSection.jsx
│  │  │  │     │  ├─ ui
│  │  │  │     │  │  ├─ SettingCard.jsx
│  │  │  │     │  │  └─ SettingToggle.jsx
│  │  │  │     │  └─ widgets
│  │  │  │     │     ├─ FaceProfileCard.jsx
│  │  │  │     │     ├─ QuickStatsCard.jsx
│  │  │  │     │     └─ SubscriptionCard.jsx
│  │  │  │     ├─ constants
│  │  │  │     │  └─ settingsConstants.jsx
│  │  │  │     ├─ hooks
│  │  │  │     │  ├─ cropImage.js
│  │  │  │     │  ├─ index.js
│  │  │  │     │  ├─ useDeleteAccount.js
│  │  │  │     │  ├─ useExportBackup.js
│  │  │  │     │  └─ useSettings.js
│  │  │  │     ├─ services
│  │  │  │     │  ├─ deleteAccountService.js
│  │  │  │     │  └─ settingsService.js
│  │  │  │     └─ utils
│  │  │  ├─ hooks
│  │  │  │  ├─ useDashboardData.js
│  │  │  │  ├─ useDashboardLayout.js
│  │  │  │  ├─ useDashboardModals.js
│  │  │  │  └─ useDashboardNavigation.js
│  │  │  ├─ pages
│  │  │  │  └─ DashboardPage.jsx
│  │  │  └─ utils
│  │  │     ├─ dashboardConstants.js
│  │  │     └─ dashboardHelpers.js
│  │  ├─ main.jsx
│  │  ├─ public-area
│  │  │  ├─ components
│  │  │  │  ├─ layout
│  │  │  │  │  ├─ HomeHeader.jsx
│  │  │  │  │  ├─ PublicFooter.jsx
│  │  │  │  │  ├─ PublicHeader.jsx
│  │  │  │  │  └─ PublicLayout.jsx
│  │  │  │  └─ ui
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
│  │  │  │  │  ├─ AccessibilityButton.jsx
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
│  │  │  │  │  │  ├─ useGlobalAccessibility.js
│  │  │  │  │  │  └─ useReducedMotion.js
│  │  │  │  │  ├─ index.js
│  │  │  │  │  ├─ styles
│  │  │  │  │  │  └─ accessibility.css
│  │  │  │  │  └─ utils
│  │  │  │  │     ├─ accessibilityConstants.js
│  │  │  │  │     └─ accessibilityHelpers.js
│  │  │  │  ├─ billing
│  │  │  │  │  ├─ BillingPage.jsx
│  │  │  │  │  └─ PricingPage.jsx
│  │  │  │  ├─ index.js
│  │  │  │  ├─ ProgressiveImage.jsx
│  │  │  │  ├─ routing
│  │  │  │  │  ├─ AppRoutes.jsx
│  │  │  │  │  └─ FlowController.jsx
│  │  │  │  ├─ ui
│  │  │  │  │  ├─ Button.jsx
│  │  │  │  │  ├─ CloudFlareTurnstileGate.jsx
│  │  │  │  │  ├─ FilterDropdown.jsx
│  │  │  │  │  ├─ LoadingSpinner.jsx
│  │  │  │  │  ├─ Modal.jsx
│  │  │  │  │  ├─ ModalPortal.jsx
│  │  │  │  │  ├─ OptimizedImage.jsx
│  │  │  │  │  ├─ PageTransition.jsx
│  │  │  │  │  ├─ PageTransitionWrapper.jsx
│  │  │  │  │  ├─ RouteTransitionWrapper.jsx
│  │  │  │  │  ├─ SmoothLoadingOverlay.jsx
│  │  │  │  │  ├─ SuspenseWrapper.jsx
│  │  │  │  │  └─ TabSwitcher.jsx
│  │  │  │  ├─ user
│  │  │  │  │  ├─ index.js
│  │  │  │  │  ├─ UserActionButtons.jsx
│  │  │  │  │  ├─ UserCard.jsx
│  │  │  │  │  └─ UserProfileModal.jsx
│  │  │  │  └─ VirtualGrid.jsx
│  │  │  ├─ constants
│  │  │  │  ├─ index.js
│  │  │  │  ├─ messages.js
│  │  │  │  ├─ plans.js
│  │  │  │  ├─ transitions.js
│  │  │  │  └─ ui.js
│  │  │  ├─ contexts
│  │  │  │  ├─ EventContext.jsx
│  │  │  │  ├─ FriendsContext.jsx
│  │  │  │  ├─ RouteTransitionContext.jsx
│  │  │  │  └─ ThemeContext.jsx
│  │  │  ├─ hooks
│  │  │  │  ├─ index.js
│  │  │  │  ├─ useClickOutside.js
│  │  │  │  ├─ useEnhancedNavigation.js
│  │  │  │  ├─ useLogoutCleanup.js
│  │  │  │  ├─ useModal.js
│  │  │  │  ├─ usePerformanceMonitor.js
│  │  │  │  ├─ usePlanLimits.jsx
│  │  │  │  ├─ useResponsive.js
│  │  │  │  ├─ useRouteTransition.js
│  │  │  │  ├─ useSmoothNavigation.js
│  │  │  │  └─ useUserRelationships.js
│  │  │  ├─ index.js
│  │  │  ├─ services
│  │  │  │  ├─ cache
│  │  │  │  │  ├─ apiCache.js
│  │  │  │  │  └─ cachedFirebaseServices.js
│  │  │  │  ├─ exportService.js
│  │  │  │  ├─ firebase
│  │  │  │  │  ├─ config.js
│  │  │  │  │  ├─ events.js
│  │  │  │  │  ├─ faceProfiles.js
│  │  │  │  │  ├─ storage.js
│  │  │  │  │  ├─ subscription.js
│  │  │  │  │  └─ users.js
│  │  │  │  ├─ index.js
│  │  │  │  ├─ navigationService.js
│  │  │  │  ├─ notificationHelper.js
│  │  │  │  ├─ privacyService.js
│  │  │  │  ├─ subscriptionService.js
│  │  │  │  ├─ user
│  │  │  │  │  ├─ index.js
│  │  │  │  │  └─ UserService.js
│  │  │  │  └─ userStatsCache.js
│  │  │  └─ utils
│  │  │     ├─ bundleAnalyzer.js
│  │  │     ├─ modalToast.js
│  │  │     └─ performance.js
│  │  ├─ styles
│  │  │  ├─ base
│  │  │  │  ├─ animations.css
│  │  │  │  ├─ base.css
│  │  │  │  └─ tokens.css
│  │  │  ├─ components
│  │  │  │  ├─ buttons.css
│  │  │  │  ├─ forms.css
│  │  │  │  ├─ layout.css
│  │  │  │  ├─ loading.css
│  │  │  │  └─ modals.css
│  │  │  ├─ main.css
│  │  │  ├─ README.md
│  │  │  └─ utilities
│  │  │     ├─ utilities.css
│  │  │     └─ z-index.css
│  │  └─ tests
│  │     ├─ api
│  │     │  └─ userServices.test.js
│  │     ├─ components
│  │     │  └─ EventCard.test.js
│  │     ├─ database
│  │     │  └─ firestoreQueries.test.js
│  │     ├─ pricing-plan-enforcement.test.js
│  │     ├─ setup.js
│  │     ├─ test-import.jsx
│  │     └─ __mocks__
│  │        └─ firebase.js
│  ├─ src_tree.txt
│  ├─ tailwind.config.js
│  └─ vite.config.js
├─ docs
│  ├─ firebaseCollection.txt
│  ├─ gitCommands.txt
│  └─ projectStracture.txt
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
│  ├─ openweather-proxy.js
│  ├─ package-lock.json
│  └─ package.json
├─ package-lock.json
├─ package.json
├─ README.md
└─ storage.rules

```



client/src/dashboard-area/features/events/ViewEvent/EventDetailView.jsx
client/src/dashboard-area/features/events/ViewEvent/features/header/components/EventHeader.jsx  
client/src/shared/contexts/EventContext.jsx
