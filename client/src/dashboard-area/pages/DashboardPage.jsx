import React from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "@dashboard/components/layout/DashboardLayout";
import { DashboardModalsProvider } from "@dashboard/contexts/DashboardModalsContext";

const DashboardPage = () => {
  return (
    <DashboardModalsProvider>
      <DashboardLayout>
        <div className="smooth-page-transition">
          <Outlet />
        </div>
      </DashboardLayout>
    </DashboardModalsProvider>
  );
};

export default DashboardPage;
