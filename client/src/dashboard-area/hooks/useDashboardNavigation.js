import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import navigationService from "@shared/services/navigationService";
import {
  smoothPageTransition,
  resetBodyStyles,
} from "@dashboard/utils/dashboardHelpers";

export const useDashboardNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation history for back button functionality
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // Page transition states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState("forward");

  // Breadcrumb navigation
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  /**
   * Add entry to navigation history
   */
  const addToHistory = useCallback(
    (entry) => {
      setNavigationHistory((prev) => {
        const newHistory = [...prev.slice(0, currentHistoryIndex + 1), entry];
        setCurrentHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    },
    [currentHistoryIndex]
  );

  /**
   * Navigate to a specific section with smooth transition
   */
  const navigateToSection = useCallback(
    (sectionId, options = {}) => {
      const {
        withTransition = true,
        updateHistory = true,
        resetView = true,
      } = options;

      const navigationEntry = {
        type: "section",
        sectionId,
        timestamp: Date.now(),
        view: resetView ? "home" : undefined,
      };

      if (updateHistory) {
        addToHistory(navigationEntry);
      }

      if (withTransition) {
        setIsTransitioning(true);
        setTransitionDirection("forward");

        smoothPageTransition(() => {
          setIsTransitioning(false);
        });
      }

      return navigationEntry;
    },
    [addToHistory]
  );

  /**
   * Navigate to a specific trip
   */
  const navigateToTrip = useCallback(
    (tripId, tripData = null, options = {}) => {
      const { withTransition = true, updateHistory = true } = options;

      const navigationEntry = {
        type: "trip",
        tripId,
        tripData,
        timestamp: Date.now(),
        view: "trip",
      };

      if (updateHistory) {
        addToHistory(navigationEntry);
      }

      // Update breadcrumbs
      setBreadcrumbs([
        {
          label: "Dashboard",
          action: () => navigateToSection("trips", { resetView: true }),
        },
        {
          label: "Trips",
          action: () => navigateToSection("trips", { resetView: true }),
        },
        { label: tripData?.name || `Trip ${tripId}`, action: null },
      ]);

      if (withTransition) {
        setIsTransitioning(true);
        setTransitionDirection("forward");

        smoothPageTransition(() => {
          setIsTransitioning(false);
        });
      }

      return navigationEntry;
    },
    [addToHistory, navigateToSection]
  );

  /**
   * Navigate back in history
   */
  const navigateBack = useCallback(() => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex((prev) => prev - 1);
      setTransitionDirection("backward");
      setIsTransitioning(true);

      const previousEntry = navigationHistory[currentHistoryIndex - 1];

      smoothPageTransition(() => {
        setIsTransitioning(false);
        return previousEntry;
      });

      return previousEntry;
    }
    return null;
  }, [currentHistoryIndex, navigationHistory]);

  /**
   * Navigate forward in history
   */
  const navigateForward = useCallback(() => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      setCurrentHistoryIndex((prev) => prev + 1);
      setTransitionDirection("forward");
      setIsTransitioning(true);

      const nextEntry = navigationHistory[currentHistoryIndex + 1];

      smoothPageTransition(() => {
        setIsTransitioning(false);
        return nextEntry;
      });

      return nextEntry;
    }
    return null;
  }, [currentHistoryIndex, navigationHistory]);

  /**
   * Navigate to external pages with smooth transition
   */
  const navigateToExternalPage = useCallback(
    (path, options = {}) => {
      const { withTransition = true, replace = false } = options;

      if (withTransition) {
        setIsTransitioning(true);
        smoothPageTransition(() => {
          if (replace) {
            navigate(path, { replace: true });
          } else {
            navigate(path);
          }
          resetBodyStyles();
        });
      } else {
        if (replace) {
          navigate(path, { replace: true });
        } else {
          navigate(path);
        }
      }
    },
    [navigate]
  );

  /**
   * Navigate to pricing page with context
   */
  const navigateToPricing = useCallback(
    (plan = null, options = {}) => {
      const { from = 'dashboard' } = options;
      
      // Set navigation context using the navigation service
      navigationService.setContext({
        origin: from,
        returnPath: location.pathname + location.search,
        section: new URLSearchParams(location.search).get('section'),
        metadata: { action: 'pricing', originalPlan: plan }
      });

      // Navigate to pricing
      navigationService.navigateToPricing(navigate, {
        plan,
        from
      });
    },
    [navigate, location]
  );

  /**
   * Navigate to billing page with context
   */
  const navigateToBilling = useCallback(
    (plan = null, billing = 'monthly', options = {}) => {
      const { from = 'dashboard' } = options;
      
      // Set navigation context using the navigation service
      navigationService.setContext({
        origin: from,
        returnPath: location.pathname + location.search,
        section: new URLSearchParams(location.search).get('section'),
        metadata: { action: 'billing', originalPlan: plan, billing }
      });

      // Navigate to billing
      navigationService.navigateToBilling(navigate, {
        plan,
        billing,
        from
      });
    },
    [navigate, location]
  );

  /**
   * Handle browser back/forward buttons
   */
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.dashboardNavigation) {
        const { type, sectionId, tripId } = event.state.dashboardNavigation;

        if (type === "section") {
          navigateToSection(sectionId, {
            updateHistory: false,
            withTransition: false,
          });
        } else if (type === "trip") {
          navigateToTrip(tripId, null, {
            updateHistory: false,
            withTransition: false,
          });
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigateToSection, navigateToTrip]);

  /**
   * Update URL without navigation
   */
  const updateUrl = useCallback((params) => {
    const url = new URL(window.location);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });

    window.history.replaceState(
      {
        ...window.history.state,
        dashboardNavigation: {
          timestamp: Date.now(),
          params,
        },
      },
      "",
      url
    );
  }, []);

  /**
   * Get URL parameters
   */
  const getUrlParams = useCallback(() => {
    const urlParams = new URLSearchParams(location.search);
    const params = {};

    for (const [key, value] of urlParams) {
      params[key] = value;
    }

    return params;
  }, [location.search]);

  /**
   * Clear navigation history
   */
  const clearHistory = useCallback(() => {
    setNavigationHistory([]);
    setCurrentHistoryIndex(-1);
    setBreadcrumbs([]);
  }, []);

  /**
   * Get current navigation state
   */
  const getCurrentNavigation = useCallback(() => {
    if (
      currentHistoryIndex >= 0 &&
      currentHistoryIndex < navigationHistory.length
    ) {
      return navigationHistory[currentHistoryIndex];
    }
    return null;
  }, [currentHistoryIndex, navigationHistory]);

  /**
   * Check if can navigate back
   */
  const canNavigateBack = useCallback(() => {
    return currentHistoryIndex > 0;
  }, [currentHistoryIndex]);

  /**
   * Check if can navigate forward
   */
  const canNavigateForward = useCallback(() => {
    return currentHistoryIndex < navigationHistory.length - 1;
  }, [currentHistoryIndex, navigationHistory]);

  /**
   * Get navigation analytics
   */
  const getNavigationAnalytics = useCallback(() => {
    const totalNavigations = navigationHistory.length;
    const sectionNavigations = navigationHistory.filter(
      (entry) => entry.type === "section"
    ).length;
    const tripNavigations = navigationHistory.filter(
      (entry) => entry.type === "trip"
    ).length;

    return {
      totalNavigations,
      sectionNavigations,
      tripNavigations,
      currentIndex: currentHistoryIndex,
      canGoBack: canNavigateBack(),
      canGoForward: canNavigateForward(),
    };
  }, [
    navigationHistory,
    currentHistoryIndex,
    canNavigateBack,
    canNavigateForward,
  ]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Alt + Left Arrow = Back
      if (event.altKey && event.key === "ArrowLeft" && canNavigateBack()) {
        event.preventDefault();
        navigateBack();
      }

      // Alt + Right Arrow = Forward
      if (event.altKey && event.key === "ArrowRight" && canNavigateForward()) {
        event.preventDefault();
        navigateForward();
      }

      // Escape = Clear breadcrumbs and go to dashboard home
      if (event.key === "Escape" && breadcrumbs.length > 0) {
        event.preventDefault();
        navigateToSection("trips", { resetView: true });
        setBreadcrumbs([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canNavigateBack,
    canNavigateForward,
    navigateBack,
    navigateForward,
    breadcrumbs,
    navigateToSection,
  ]);

  /**
   * Preload route data (for performance)
   */
  const preloadRoute = useCallback(async (routeType, routeId) => {
    console.log(`Preloading ${routeType}:${routeId}`);
  }, []);

  /**
   * Handle successful navigation return from external pages
   */
  const handleNavigationReturn = useCallback((result) => {
    if (result?.success) {
      console.log('Navigation return successful:', result);
    }
  }, []);

  /**
   * Get navigation service context
   */
  const getNavigationContext = useCallback(() => {
    return navigationService.getContext();
  }, []);

  /**
   * Clear navigation service context
   */
  const clearNavigationContext = useCallback(() => {
    navigationService.clearContext();
  }, []);

  /**
   * Subscribe to navigation service events
   */
  useEffect(() => {
    const unsubscribe = navigationService.subscribe((event, data) => {
      console.log('Navigation service event:', event, data);
      
      switch (event) {
        case 'contextSet':
          break;
        case 'contextCleared':
          break;
        case 'metadataUpdated':
          break;
        default:
          break;
      }
    });

    return unsubscribe;
  }, []);

  return {
    // Navigation state
    state: {
      navigationHistory,
      currentHistoryIndex,
      isTransitioning,
      transitionDirection,
      breadcrumbs,
    },

    // Core navigation actions
    navigate: {
      toSection: navigateToSection,
      toTrip: navigateToTrip,
      back: navigateBack,
      forward: navigateForward,
      toExternalPage: navigateToExternalPage,
    },

    // Enhanced page navigation with context
    pages: {
      toPricing: navigateToPricing,
      toBilling: navigateToBilling,
    },

    // URL management
    url: {
      update: updateUrl,
      getParams: getUrlParams,
    },

    // History management
    history: {
      clear: clearHistory,
      getCurrent: getCurrentNavigation,
      getAnalytics: getNavigationAnalytics,
    },

    // Navigation state checks
    can: {
      navigateBack: canNavigateBack,
      navigateForward: canNavigateForward,
    },

    // Performance
    performance: {
      preloadRoute,
    },

    // Breadcrumbs
    breadcrumbs: {
      items: breadcrumbs,
      setBreadcrumbs,
    },

    // Navigation service integration
    service: {
      getContext: getNavigationContext,
      clearContext: clearNavigationContext,
      handleReturn: handleNavigationReturn,
    },
  };
};

export default useDashboardNavigation;