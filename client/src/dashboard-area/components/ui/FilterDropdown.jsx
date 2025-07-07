// Dashboard Filter Dropdown - Using Shared Component
import React from "react";
import FilterDropdown from "@/shared/components/ui/FilterDropdown";
import { FILTER_OPTIONS } from "@dashboard/utils/dashboardConstants.js";

const DashboardFilterDropdown = (props) => {
  return <FilterDropdown {...props} options={FILTER_OPTIONS} />;
};

export default DashboardFilterDropdown;
