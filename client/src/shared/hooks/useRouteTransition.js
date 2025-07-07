import { useContext } from "react";
import { RouteTransitionContext } from "../contexts/RouteTransitionContext";

// Custom hook for using route transitions
export const useRouteTransition = () => {
  const context = useContext(RouteTransitionContext);
  if (!context) {
    throw new Error(
      "useRouteTransition must be used within a RouteTransitionProvider"
    );
  }
  return context;
};

export default useRouteTransition;
