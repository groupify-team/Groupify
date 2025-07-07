import React, { Suspense, memo } from "react";
import LoadingSpinner, {
  DashboardSkeleton,
} from "@/shared/components/ui/LoadingSpinner";

const SuspenseWrapper = memo(({ children, fallback, useSkeleton = false }) => (
  <Suspense
    fallback={
      useSkeleton ? (
        <DashboardSkeleton />
      ) : (
        fallback || <LoadingSpinner fullPage />
      )
    }
  >
    {children}
  </Suspense>
));

SuspenseWrapper.displayName = "SuspenseWrapper";

export default SuspenseWrapper;
