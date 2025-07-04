// src/dashboard-area/components/modals/UsageModal.jsx - Professional usage tracking modal
import React, { useState, useEffect } from "react";
import { XMarkIcon, ChartBarIcon, PhotoIcon, FolderIcon, CloudIcon } from "@heroicons/react/24/outline";
import subscriptionService from "../../../shared/services/subscriptionService";

const UsageModal = ({ isOpen, onClose }) => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadUsageData();
      
      // Subscribe to subscription updates
      const unsubscribe = subscriptionService.subscribe((event, data) => {
        if (event === 'subscriptionUpdated' || event === 'usageUpdated') {
          loadUsageData();
        }
      });

      return unsubscribe;
    }
  }, [isOpen]);

  const loadUsageData = async () => {
    setLoading(true);
    try {
      const subscriptionData = subscriptionService.getCurrentSubscription();
      setSubscription(subscriptionData);
      setUsage(subscriptionData.usage);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return "text-red-600 dark:text-red-400";
    if (percentage >= 75) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const recommendations = subscription ? subscriptionService.getUpgradeRecommendations() : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] border border-white/20 dark:border-gray-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Usage & Statistics
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your storage, photos, and plan limits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading usage data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Plan Overview */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Plan: {subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1)}
                  </h3>
                  {subscription?.isTrial && (
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                      Trial - {subscription.trialDaysRemaining} days left
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {subscription?.features?.storage || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Storage Limit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {subscription?.features?.photos === 'unlimited' ? '∞' : subscription?.features?.photos?.toLocaleString() || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Photo Limit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {subscription?.features?.sharing === 'unlimited' ? '∞' : subscription?.features?.sharing || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sharing Limit</p>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Storage Usage */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CloudIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Storage Usage
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Used</span>
                      <span className={`text-sm font-medium ${getUsageColor(usage?.storage?.percentage || 0)}`}>
                        {usage?.storage?.usedFormatted || '0 B'} of {usage?.storage?.limitFormatted || 'N/A'}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(usage?.storage?.percentage || 0)}`}
                        style={{ width: `${Math.min(usage?.storage?.percentage || 0, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>0%</span>
                      <span className={`font-medium ${getUsageColor(usage?.storage?.percentage || 0)}`}>
                        {Math.round(usage?.storage?.percentage || 0)}%
                      </span>
                      <span>100%</span>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Remaining:</strong> {usage?.storage?.remainingFormatted || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photo Usage */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <PhotoIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Photo Usage
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Uploaded</span>
                      <span className={`text-sm font-medium ${getUsageColor(usage?.photos?.percentage || 0)}`}>
                        {usage?.photos?.used?.toLocaleString() || 0} of {usage?.photos?.limit === 'unlimited' ? '∞' : usage?.photos?.limit?.toLocaleString() || 'N/A'}
                      </span>
                    </div>

                    {usage?.photos?.limit !== 'unlimited' && (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(usage?.photos?.percentage || 0)}`}
                            style={{ width: `${Math.min(usage?.photos?.percentage || 0, 100)}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>0%</span>
                          <span className={`font-medium ${getUsageColor(usage?.photos?.percentage || 0)}`}>
                            {Math.round(usage?.photos?.percentage || 0)}%
                          </span>
                          <span>100%</span>
                        </div>
                      </>
                    )}

                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Remaining:</strong> {usage?.photos?.remaining === 'unlimited' ? '∞' : usage?.photos?.remaining?.toLocaleString() || 'N/A'} photos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Album Usage */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FolderIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Album Usage
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {usage?.albums?.used || 0} of {usage?.albums?.limit === 'unlimited' ? '∞' : usage?.albums?.limit || 'N/A'}
                      </span>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Available:</strong> {usage?.albums?.remaining === 'unlimited' ? '∞' : usage?.albums?.remaining || 'N/A'} albums
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature Overview */}
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Plan Features
                  </h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">AI Recognition</span>
                      <span className="text-sm font-medium capitalize text-indigo-600 dark:text-indigo-400">
                        {subscription?.features?.aiRecognition || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Support Level</span>
                      <span className="text-sm font-medium capitalize text-indigo-600 dark:text-indigo-400">
                        {subscription?.features?.support || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Photo Quality</span>
                      <span className="text-sm font-medium capitalize text-indigo-600 dark:text-indigo-400">
                        {subscription?.features?.quality || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Photo Editing</span>
                      <span className={`text-sm font-medium ${subscription?.features?.editing ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        {subscription?.features?.editing ? 'Available' : 'Not Available'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Video Storage</span>
                      <span className={`text-sm font-medium ${subscription?.features?.videos ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        {subscription?.features?.videos ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200/50 dark:border-yellow-800/50">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L4.054 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Recommendations
                  </h4>

                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        rec.urgency === 'high' 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              rec.urgency === 'high' 
                                ? 'text-red-800 dark:text-red-200' 
                                : 'text-yellow-800 dark:text-yellow-200'
                            }`}>
                              {rec.message}
                            </p>
                            <p className={`text-xs mt-1 ${
                              rec.urgency === 'high' 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {rec.urgency === 'high' ? 'Action required soon' : 'Consider upgrading'}
                            </p>
                          </div>
                          {rec.urgency === 'high' && (
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L4.054 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Activity */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Usage Activity
                </h4>

                {usage?.photos?.used > 0 || usage?.storage?.used > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Photos Uploaded</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {usage.photos.used} photos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Storage Used</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {usage.storage.usedFormatted}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Albums Created</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {usage.albums.used} albums
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>📊 Your Activity:</strong> You're currently using {Math.round(usage.storage.percentage || 0)}% of your storage and {Math.round(usage.photos.percentage || 0)}% of your photo limit.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Usage Data Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Start uploading photos and creating albums to see your usage statistics here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  subscriptionService.debug();
                  console.log('Current usage:', usage);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium text-sm"
              >
                Debug Info
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageModal;