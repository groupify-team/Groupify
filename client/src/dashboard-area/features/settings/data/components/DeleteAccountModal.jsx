// dashboard-area/components/modals/DeleteAccountModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  EyeIcon, 
  EyeSlashIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { useDeleteAccount } from '../../hooks/useDeleteAccount';

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const { 
    loading, 
    error, 
    deletionSummary, 
    deleteAccount, 
    getDeletionSummary, 
    needsReauthentication,
    clearError 
  } = useDeleteAccount();

  const [step, setStep] = useState(1); // 1: Warning, 2: Confirmation, 3: Password
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Load deletion summary when modal opens
  useEffect(() => {
    if (isOpen && !deletionSummary) {
      getDeletionSummary();
    }
  }, [isOpen, deletionSummary, getDeletionSummary]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPassword('');
      setConfirmationText('');
      setShowPassword(false);
      setAgreedToTerms(false);
      clearError();
    }
  }, [isOpen, clearError]);

  const handleDeleteAccount = async () => {
    const success = await deleteAccount(password, confirmationText);
    if (success) {
      onClose(); // Modal will close before navigation
    }
  };

  const handleNextStep = () => {
    clearError();
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    clearError();
    setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete Account
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <React.Fragment key={stepNum}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNum <= step 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-8 h-0.5 ${
                      stepNum < step ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Warning */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                  ⚠️ This action cannot be undone
                </h3>
                <p className="text-sm text-red-800 dark:text-red-400">
                  Deleting your account will permanently remove all your data from Groupify. 
                  This includes your trips, photos, friends, and all associated content.
                </p>
              </div>

              {deletionSummary && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    📊 Your account contains:
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Trips:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {deletionSummary.trips}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Photos:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {deletionSummary.photos}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Friends:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {deletionSummary.friends}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Settings:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {deletionSummary.settings ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                  💡 Before you delete your account
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Consider exporting your data first. You can download all your trips, 
                  photos, and other data from the Export section above.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Are you absolutely sure?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type <span className="font-mono font-semibold text-red-600 dark:text-red-400">DELETE</span> below to confirm
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="agreeTerms" className="text-sm text-gray-600 dark:text-gray-400">
                  I understand that this action is permanent and cannot be undone. 
                  All my data will be permanently deleted.
                </label>
              </div>

              {needsReauthentication() && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    🔐 For security, you'll need to enter your password in the next step.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Enter your password
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please enter your current password to confirm account deletion
                </p>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-400">
                  🚨 <strong>Final warning:</strong> Clicking "Delete Account" will 
                  immediately and permanently delete your account and all associated data.
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={handlePrevStep}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
            
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            {step < 3 ? (
              <button
                onClick={handleNextStep}
                disabled={loading || (step === 2 && (confirmationText !== 'DELETE' || !agreedToTerms))}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 1 ? 'Continue' : 'Next'}
              </button>
            ) : (
              <button
                onClick={handleDeleteAccount}
                disabled={loading || !password || confirmationText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;