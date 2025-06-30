// Fixed DashboardPage.jsx with <Outlet> support
import React from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default DashboardPage;
