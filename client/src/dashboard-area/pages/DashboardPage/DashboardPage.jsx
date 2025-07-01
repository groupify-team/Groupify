// Fixed DashboardPage.jsx with <Outlet> support
import React from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { DashboardModalsProvider } from "@dashboard/contexts/DashboardModalsContext";


const DashboardPage = () => {
  return (
    <DashboardModalsProvider>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </DashboardModalsProvider>
  );
};

export default DashboardPage;
