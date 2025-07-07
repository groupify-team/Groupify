// Dashboard Filter Dropdown - Using Shared Component
import React from "react";
import FilterDropdown from "@/shared/components/ui/FilterDropdown";
import { FILTER_OPTIONS } from "@dashboard/utils/dashboardConstants.jsx";

const DashboardFilterDropdown = (props) => {
  return <FilterDropdown {...props} options={FILTER_OPTIONS} />;
};

export default DashboardFilterDropdown;
