import React, { Suspense, memo } from "react";
import PageLoadingSpinner, {
  DashboardSkeleton,
} from "@/shared/components/ui/PageLoadingSpinner";

const SuspenseWrapper = memo(({ children, fallback, useSkeleton = false }) => (
  <Suspense
    fallback={
      useSkeleton ? <DashboardSkeleton /> : fallback || <PageLoadingSpinner />
    }
  >
    {children}
  </Suspense>
));

SuspenseWrapper.displayName = "SuspenseWrapper";

export default SuspenseWrapper;



