// src/dashboard-area/features/settings/components/sections/SubscriptionSection.jsx
import React from "react";
import SubscriptionCard from "../widgets/SubscriptionCard";

const SubscriptionSection = ({
  onOpenUsage,
  onOpenBillingHistory,
  onOpenPlanManagement,
}) => {
  return (
    <SubscriptionCard
      onOpenUsage={onOpenUsage}
      onOpenBillingHistory={onOpenBillingHistory}
      onOpenCancelPlan={onOpenPlanManagement}
    />
  );
};

export default SubscriptionSection;