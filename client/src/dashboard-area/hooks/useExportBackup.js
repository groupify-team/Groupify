import { useState, useCallback } from 'react';
import { useAuth } from '../../auth-area/contexts/AuthContext';
import { ExportService } from '../../shared/services/exportService';

export const useExportBackup = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Clear messages after delay
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  }, []);

  // Export user data as JSON
  const exportData = useCallback(async () => {
    if (!currentUser?.uid) {
      setError('User not authenticated');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await ExportService.downloadUserData(currentUser.uid);
      setSuccess('Data exported successfully! Check your downloads folder.');
      clearMessages();
      return true;
    } catch (err) {
      console.error('Export error:', err);
      setError(`Export failed: ${err.message}`);
      clearMessages();
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, clearMessages]);

  // Create and download backup
  const createBackup = useCallback(async () => {
    if (!currentUser?.uid) {
      setError('User not authenticated');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await ExportService.downloadBackup(currentUser.uid);
      setSuccess('Backup created successfully! Check your downloads folder.');
      clearMessages();
      return true;
    } catch (err) {
      console.error('Backup error:', err);
      setError(`Backup failed: ${err.message}`);
      clearMessages();
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, clearMessages]);

  // Export specific data type as CSV
  const exportCSV = useCallback(async (dataType = 'trips') => {
    if (!currentUser?.uid) {
      setError('User not authenticated');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await ExportService.exportToCSV(currentUser.uid, dataType);
      setSuccess(`${dataType} exported as CSV successfully!`);
      clearMessages();
      return true;
    } catch (err) {
      console.error('CSV export error:', err);
      setError(`CSV export failed: ${err.message}`);
      clearMessages();
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, clearMessages]);

  // Get data preview (without downloading)
  const getDataPreview = useCallback(async () => {
    if (!currentUser?.uid) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const exportData = await ExportService.exportUserData(currentUser.uid);
      return exportData.statistics;
    } catch (err) {
      console.error('Preview error:', err);
      setError(`Preview failed: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  return {
    loading,
    error,
    success,
    exportData,
    createBackup,
    exportCSV,
    getDataPreview,
  };
};