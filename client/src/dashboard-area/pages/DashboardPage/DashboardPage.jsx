// Fixed DashboardPage.jsx with <Outlet> support
import React from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="smooth-page-transition">
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
