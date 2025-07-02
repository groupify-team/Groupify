// Fixed DashboardPage.jsx - Browser safe without require()
import React from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

// Safe fallback provider component
const FallbackProvider = ({ children }) => {
  console.log("Using fallback DashboardModalsProvider");
  return children;
};

// Try to import DashboardModalsProvider dynamically, use fallback if it fails
let DashboardModalsProvider = FallbackProvider;

// Use dynamic import instead of require for browser compatibility
const loadModalsProvider = async () => {
  try {
    const modalsModule = await import("@dashboard/contexts/DashboardModalsContext");
    if (modalsModule.DashboardModalsProvider) {
      DashboardModalsProvider = modalsModule.DashboardModalsProvider;
      console.log("Successfully loaded DashboardModalsProvider");
    } else {
      console.log("DashboardModalsProvider not found in module, using fallback");
    }
  } catch (e) {
    console.log("DashboardModalsProvider not available, using fallback:", e.message);
  }
};

// Try to load the provider immediately (this will fail silently if not available)
loadModalsProvider();

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