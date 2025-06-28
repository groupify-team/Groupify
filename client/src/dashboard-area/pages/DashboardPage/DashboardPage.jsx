// features/dashboard/pages/DashboardPage/DashboardPage.jsx
import React from "react";
import DashboardLayout from "@dashboard/components/layout/DashboardLayout";
import TripsSection from "@dashboard/components/sections/TripsSection";
import FriendsSection from "@dashboard/components/sections/FriendsSection";
import SettingsSection from "@dashboard/components/sections/SettingsSection";
import { useDashboardLayout } from "@dashboard/hooks/useDashboardLayout";
import TripDetailView from "@dashboard/features/trips/pages/TripDetailPage/TripDetailPage";

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

