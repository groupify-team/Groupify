import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@auth/contexts/AuthContext";
import { SettingsService } from "../services/settingsService";
import { DEFAULT_USER_SETTINGS } from "../../../utils/dashboardConstants";

export const useSettings = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const userSettings = await SettingsService.getUserSettings(
        currentUser.uid
      );
      setSettings(userSettings);
    } catch (err) {
      console.error("Error loading settings:", err);
      setError(err.message);
      setSettings(DEFAULT_USER_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  const updateSetting = useCallback(
    async (category, settingId, value) => {
      if (!currentUser?.uid) return false;

      try {
        setError(null);

        setSettings((prev) => ({
          ...prev,
          [category]: {
            ...prev[category],
            [settingId]: value,
          },
        }));

        await SettingsService.updateSetting(
          currentUser.uid,
          category,
          settingId,
          value
        );
        return true;
      } catch (err) {
        console.error("Error updating setting:", err);
        setError(err.message);
        await loadSettings();
        return false;
      }
    },
    [currentUser?.uid, loadSettings]
  );

  const toggleSetting = useCallback(
    async (category, settingId) => {
      const currentValue = settings[category]?.[settingId] ?? false;
      return await updateSetting(category, settingId, !currentValue);
    },
    [settings, updateSetting]
  );

  const getSetting = useCallback(
    (category, settingId, defaultValue = false) => {
      return settings[category]?.[settingId] ?? defaultValue;
    },
    [settings]
  );

  const isNotificationEnabled = useCallback(
    (notificationType) => {
      return getSetting("notifications", notificationType, true);
    },
    [getSetting]
  );

  const isPrivacyEnabled = useCallback(
    (privacySetting) => {
      return getSetting("privacy", privacySetting, false);
    },
    [getSetting]
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSetting,
    toggleSetting,
    getSetting,
    isNotificationEnabled,
    isPrivacyEnabled,
    loadSettings,
  };
};
