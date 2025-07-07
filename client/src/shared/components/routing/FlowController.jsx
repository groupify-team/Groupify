import React, { useState, useEffect, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@auth/hooks/useAuth";

import CloudflareTurnstileGate from "@/shared/components/ui/CloudFlareTurnstileGate";
import LaunchAnimation from "@/auth-area/components/ui/LaunchAnimation";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";

const FlowController = memo(({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLaunchAnimation, setShowLaunchAnimation] = useState(false);
  const [flowReady, setFlowReady] = useState(false);
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [showTurnstile, setShowTurnstile] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const determineFlow = () => {
      const currentPath = location.pathname;
      const turnstileVerifiedSession =
        sessionStorage.getItem("turnstile_verified");
      const turnstileTimestamp = sessionStorage.getItem("turnstile_timestamp");
      const lastPageLoad = sessionStorage.getItem("last_page_load");
      const currentTime = Date.now();

      // Enhanced session detection logic
      const isFirstVisit = !turnstileVerifiedSession && !turnstileTimestamp;
      const turnstileAge = turnstileTimestamp
        ? currentTime - parseInt(turnstileTimestamp)
        : Infinity;
      const isExpiredSession = turnstileAge > 24 * 60 * 60 * 1000;
      const isLongAbsence = lastPageLoad
        ? currentTime - parseInt(lastPageLoad) > 4 * 60 * 60 * 1000
        : false;

      const shouldShowTurnstile =
        isFirstVisit || isExpiredSession || isLongAbsence;

      // === TURNSTILE VERIFICATION CHECK ===
      if (shouldShowTurnstile) {
        setShowTurnstile(true);
        setFlowReady(false);
        return;
      } else {
        setTurnstileVerified(true);
        setShowTurnstile(false);
      }

      if (
        currentUser &&
        ["/signin", "/signup", "/forgot-password", "/reset-password"].includes(
          currentPath
        )
      ) {
        navigate("/dashboard", { replace: true });
        return;
      }

      if (currentUser && currentPath === "/") {
        navigate("/dashboard", { replace: true });
        return;
      }

      if (
        currentUser &&
        ![
          "/signin",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/",
        ].includes(currentPath)
      ) {
        setShowLaunchAnimation(false);
        setFlowReady(true);
        return;
      }

      // === GUEST USER ROUTING ===
      if (!currentUser && currentPath === "/") {
        setShowLaunchAnimation(false);
        setFlowReady(true);
        return;
      }

      if (
        !currentUser &&
        [
          "/signin",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/terms",
          "/privacy-policy",
          "/contact",
          "/about",
          "/careers",
          "/help",
          "/confirm-email",
          "/blog",
          "/features",
          "/pricing",
          "/status",
        ].includes(currentPath)
      ) {
        setShowLaunchAnimation(false);
        setFlowReady(true);
        return;
      }

      if (
        !currentUser &&
        ![
          "/signin",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/terms",
          "/privacy-policy",
          "/contact",
          "/about",
          "/careers",
          "/help",
          "/confirm-email",
          "/blog",
          "/features",
          "/pricing",
          "/status",
          "/",
        ].includes(currentPath)
      ) {
        navigate("/signin", { replace: true });
        return;
      }

      setShowLaunchAnimation(false);
      setFlowReady(true);
      sessionStorage.setItem("last_page_load", currentTime.toString());
    };

    if (turnstileVerified || !showTurnstile) {
      determineFlow();
    }
  }, [
    currentUser,
    authLoading,
    location.pathname,
    navigate,
    turnstileVerified,
    showTurnstile,
  ]);

  const handleTurnstileComplete = (verified, token) => {
    if (verified) {
      const currentTime = Date.now();
      sessionStorage.setItem("turnstile_verified", "true");
      sessionStorage.setItem("turnstile_token", token);
      sessionStorage.setItem("turnstile_timestamp", currentTime.toString());
      sessionStorage.setItem("last_page_load", currentTime.toString());
      setTurnstileVerified(true);
      setShowTurnstile(false);
    }
  };

  const handleAnimationComplete = () => {
    sessionStorage.setItem("launch_animation_shown", "true");
    setShowLaunchAnimation(false);
    setFlowReady(true);
  };

  if (showTurnstile) {
    return (
      <CloudflareTurnstileGate onVerificationComplete={handleTurnstileComplete}>
        <div>Turnstile Verified</div>
      </CloudflareTurnstileGate>
    );
  }

  if (authLoading || (!flowReady && !showLaunchAnimation)) {
    return <LoadingSpinner fullPage message="Loading..." />;
  }

  if (showLaunchAnimation) {
    return <LaunchAnimation onAnimationComplete={handleAnimationComplete} />;
  }

  return children;
});

FlowController.displayName = "FlowController";

export default FlowController;
