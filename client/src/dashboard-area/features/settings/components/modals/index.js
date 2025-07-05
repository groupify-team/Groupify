// src/dashboard-area/features/settings/components/modals/index.js

// Profile modals
export { default as EditProfileModal } from './profile/EditProfileModal';
export { default as ProfileImageCropper } from './profile/ProfileImageCropper';

// Face profile modals  
export { default as FaceProfileModal } from './faceProfile/FaceProfileModal';
export { default as FaceProfileManageModal } from './faceProfile/FaceProfileManageModal';
export { default as SmartFaceScan } from './faceProfile/SmartFaceScan';

// Subscription modals (these are already moved to subscription/ folder)
export { default as UsageModal } from './subscription/UsageModal';
export { default as BillingHistoryModal } from './subscription/BillingHistoryModal';
export { default as PlanManagementModal } from './subscription/PlanManagementModal';

// Data modals
export { default as ExportModal } from './data/ExportModal';
export { default as BackupModal } from './data/BackupModal';

// Account modals
export { default as DeleteAccountModal } from './DeleteAccountModal';