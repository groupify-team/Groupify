import React from "react";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";

const AudioSettings = ({ soundEffects, setSoundEffects, toggleSetting }) => {
  const handleToggle = () => {
    if (toggleSetting) {
      toggleSetting(setSoundEffects, soundEffects);
    } else {
      setSoundEffects(!soundEffects);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        {soundEffects ? (
          <SpeakerWaveIcon className="w-5 h-5 mr-2" />
        ) : (
          <SpeakerXMarkIcon className="w-5 h-5 mr-2" />
        )}
        Audio Preferences
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center">
            {soundEffects ? (
              <SpeakerWaveIcon className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" />
            ) : (
              <SpeakerXMarkIcon className="w-5 h-5 mr-3 text-gray-400" />
            )}
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                Sound Effects
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable audio feedback for interactions
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              soundEffects ? "bg-indigo-600" : "bg-gray-200"
            }`}
            role="switch"
            aria-checked={soundEffects}
            aria-label="Toggle sound effects"
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                soundEffects ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioSettings;