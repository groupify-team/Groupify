// Fixed DashboardPage.jsx with <Outlet> support and unified structure
import React from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

// Try to import DashboardModalsProvider, fallback if it doesn't exist
let DashboardModalsProvider;
try {
  const modalsModule = require("@dashboard/contexts/DashboardModalsContext");
  DashboardModalsProvider = modalsModule.DashboardModalsProvider;
} catch (e) {
  console.log("DashboardModalsProvider not available, using fallback");
  // Create a fallback provider that just passes through children
  DashboardModalsProvider = ({ children }) => children;
}

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