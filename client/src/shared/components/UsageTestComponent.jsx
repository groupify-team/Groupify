import React, { useState } from 'react';
import { usePlanLimits } from '@shared/hooks/usePlanLimits';
import { useEventContext } from '@shared/contexts/EventContext';
import usageSyncService from '@shared/services/UsageSyncService';
import subscriptionService from '@shared/services/subscriptionService';

export const UsageTestComponent = () => {
  const { usage, syncStatus, forceSync, loading } = usePlanLimits();
  const { events } = useEventContext();
  const [testResults, setTestResults] = useState([]);

  const runTests = async () => {
    const results = [];
    
    // Test 1: Check initial sync
    results.push({
      test: 'Initial Sync',
      localStorage: usage?.events?.used || 0,
      firebase: events.length,
      synced: syncStatus.synced
    });

    // Test 2: Force sync
    try {
      await forceSync();
      results.push({
        test: 'Force Sync',
        success: true,
        message: 'Sync completed successfully'
      });
    } catch (error) {
      results.push({
        test: 'Force Sync',
        success: false,
        message: error.message
      });
    }

    // Test 3: Check discrepancy detection
    const stored = subscriptionService.getStoredUsage();
    const hasDiscrepancy = stored.events !== events.length;
    results.push({
      test: 'Discrepancy Detection',
      hasDiscrepancy,
      storedEvents: stored.events,
      actualEvents: events.length
    });

    setTestResults(results);
  };

  const resetUsage = () => {
    subscriptionService.resetUsage();
    setTestResults([]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc',
      maxWidth: '400px',
      zIndex: 9999
    }}>
      <h3>Usage Sync Test</h3>
      
      <div>
        <h4>Current Status:</h4>
        <p>Events (localStorage): {usage?.events?.used || 0}</p>
        <p>Events (Firebase): {events.length}</p>
        <p>Sync Status: {syncStatus.synced ? '✅ Synced' : '❌ Not Synced'}</p>
        <p>Last Sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : 'Never'}</p>
      </div>

      <div>
        <button onClick={runTests}>Run Tests</button>
        <button onClick={resetUsage}>Reset Usage</button>
        <button onClick={forceSync}>Force Sync</button>
      </div>

      {testResults.length > 0 && (
        <div>
          <h4>Test Results:</h4>
          {testResults.map((result, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#f5f5f5' }}>
              <strong>{result.test}:</strong>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
