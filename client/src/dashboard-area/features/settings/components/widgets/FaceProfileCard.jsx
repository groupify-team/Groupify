// FaceProfileCard.jsx - Face profile management widget
import React from "react";
import {
  CheckCircleIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const FaceProfileCard = ({
  hasProfile,
  profilePhotos,
  isLoading,
  onOpenSetup,
  onOpenManage,
}) => {
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-white/20 dark:border-gray-700/50">
      <div className="flex items-center justify-center gap-1 mb-3">
        <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          Face Profile
        </h2>
      </div>

      {!hasProfile ? (
        /* No Profile - Setup Card */
        <div className="text-center py-6 sm:py-8 lg:py-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 lg:mb-8 shadow-lg">
            <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-4">
            Create Your Face Profile
          </h3>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-5 lg:mb-6 max-w-md mx-auto px-4">
            Upload 2-10 clear photos of yourself to enable automatic photo
            recognition in your trips
          </p>
          <button
            onClick={onOpenSetup}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 sm:gap-3 mx-auto text-sm sm:text-base lg:text-lg min-h-[48px] sm:min-h-[56px]"
          >
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            {isLoading ? "Loading..." : "Setup Face Profile"}
          </button>
        </div>
      ) : (
        /* Has Profile - Management Card */
        <div>
          {/* Profile Status Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-300 mb-1">
                  🎯 Face Recognition Active
                </h3>
                <p className="text-green-600 dark:text-green-400 text-sm sm:text-base">
                  {profilePhotos.length} photos • Enhanced recognition ready
                </p>
              </div>
            </div>

            {/* Method Description */}
            <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 sm:p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <p className="text-sm sm:text-base text-green-700 dark:text-green-300 font-medium mb-1">
                    AI-Enhanced Recognition
                  </p>
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                    Your face profile enables automatic photo recognition across
                    all your trips and albums for seamless photo organization.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                <p className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-200">
                  {profilePhotos.length}
                </p>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                  Photos
                </p>
              </div>
              <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                <p className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-200">
                  High
                </p>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                  Quality
                </p>
              </div>
              <div className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-3 text-center">
                <p className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-200">
                  Active
                </p>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                  Status
                </p>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={onOpenManage}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Manage & Configure Face Profile
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recognition Features */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">🎯</span>
                </div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  Smart Recognition
                </h4>
              </div>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>Automatic photo tagging</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>Trip photo organization</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  <span>Quick photo discovery</span>
                </li>
              </ul>
            </div>

            {/* Privacy Features */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">🔒</span>
                </div>
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                  Privacy First
                </h4>
              </div>
              <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  <span>Local processing only</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  <span>No external sharing</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  <span>You control your data</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Performance Tip */}
          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Pro Tip
                </p>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                  For best results, ensure your profile photos show clear,
                  well-lit faces from different angles. This improves
                  recognition accuracy across all your trips.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceProfileCard;
