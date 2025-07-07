import React from "react";
import { useRouteTransition } from "../hooks/useRouteTransition";

// Route Transition Wrapper Component
const RouteTransitionWrapper = ({ children }) => {
  const { getTransitionClasses } = useRouteTransition();

  return <div className={getTransitionClasses()}>{children}</div>;
};

export default RouteTransitionWrapper;
