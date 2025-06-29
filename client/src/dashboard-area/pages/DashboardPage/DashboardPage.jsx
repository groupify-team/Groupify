// Fixed DashboardPage.jsx with correct import paths
import React from "react";

// ✅ Use relative paths instead of aliases
import DashboardLayout from "../../components/layout/DashboardLayout";
import TripsSection from "../../components/sections/TripsSection";
import FriendsSection from "../../components/sections/FriendsSection";
import SettingsSection from "../../components/sections/SettingsSection";
import { useDashboardLayout } from "../../hooks/useDashboardLayout";

// ✅ Fixed path to TripDetailView
import TripDetailView from "../../features/trips/components/ViewTrip/TripDetailView";

const DashboardPage = () => {
  const {
    layout: { activeSection, currentView, selectedTripId },
    utils: { isViewingTrip },
  } = useDashboardLayout();

  const renderContent = () => {
    if (isViewingTrip()) {
      return <TripDetailView tripId={selectedTripId} />;
    }

    switch (activeSection) {
      case "trips":
        return <TripsSection />;
      case "friends":
        return <FriendsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <TripsSection />;
    }
  };

  return <DashboardLayout>{renderContent()}</DashboardLayout>;
};

export default DashboardPage;