// useDashboardLayout.js - Layout and navigation state management
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DEFAULT_STATE,
  BREAKPOINTS,
} from "@dashboard/utils/dashboardConstants.js";
import { isMobileDevice } from "@dashboard/utils/dashboardHelpers";

export const useDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Refs for outside click detection
  const notificationRef = useRef(null);
  const mobileUserMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Core layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(
    DEFAULT_STATE.activeSection
  );
  const [currentView, setCurrentView] = useState(DEFAULT_STATE.currentView);
  const [selectedeventId, setSelectedeventId] = useState(null);

  // Responsive states
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Mobile navigation states
  const [showMobileUserMenu, setShowMobileUserMenu] = useState(false);

  // Dropdown states
  const [eventsDropdownOpen, seteventsDropdownOpen] = useState(false);
  const [visibleeventsCount, setVisibleeventsCount] = useState(
    DEFAULT_STATE.visibleeventsCount
  );
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] =
    useState(false);

  // Tab states for mobile sections
  const [friendsActiveTab, setFriendsActiveTab] = useState("friends"); // "friends" or "requests"
  const [eventsActiveTab, seteventsActiveTab] = useState("events"); // "events" or "invitations"

  // Desktop section expansion states
  const [showDesktopRequests, setShowDesktopRequests] = useState(true);
  const [desktopRequestsExpanded, setDesktopRequestsExpanded] = useState(true);
  const [eventInvitesExpanded, setEventInvitesExpanded] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState(DEFAULT_STATE.searchTerm);
  const [dateFilter, setDateFilter] = useState(DEFAULT_STATE.dateFilter);

  /**
   * Handle window resize for responsive behavior
   */
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      const isMobileDevice = width < BREAKPOINTS.mobile;
      setIsMobile(isMobileDevice);

      // Auto-open sidebar on desktop, auto-close on mobile
      if (width >= BREAKPOINTS.tablet) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state based on current screen size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Handle URL parameters on route change
   */
  useEffect(() => {
    const path = location.pathname;

    if (path.includes("/dashboard/friends")) {
      setActiveSection("friends");
    } else if (path.includes("/dashboard/settings")) {
      setActiveSection("settings");
    } else if (path.includes("/dashboard/event/")) {
      setActiveSection("events");
      setCurrentView("event");
      const eventId = path.split("/").pop();
      setSelectedeventId(eventId);
    } else if (path.includes("/dashboard/events") || path === "/dashboard") {
      setActiveSection("events");
      setCurrentView("home");
    }
  }, [location.pathname]);

  /**
   * Close dropdowns when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close mobile user menu
      if (
        mobileUserMenuRef.current &&
        !mobileUserMenuRef.current.contains(event.target)
      ) {
        setShowMobileUserMenu(false);
      }

      // Close filter dropdown
      if (filterDropdownOpen && !event.target.closest(".filter-dropdown")) {
        setFilterDropdownOpen(false);
      }

      // Close notifications dropdown
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterDropdownOpen, mobileUserMenuRef, notificationRef]);

  /**
   * Navigation actions
   */
  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId);
    setCurrentView("home");
    setSelectedeventId(null);

    navigate(`/dashboard/${sectionId}`);

    // Close sidebar on mobile when changing sections
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const navigateToEvent = (eventId) => {
    setCurrentView("event");
    setSelectedeventId(eventId);
    seteventsDropdownOpen(false);

    // Navigate to the event route
    navigate(`/dashboard/event/${eventId}`);

    // Close sidebar on mobile when navigating to event
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const navigateBackToDashboard = () => {
    setCurrentView("home");
    setSelectedeventId(null);

    // Navigate back to events section
    navigate("/dashboard/events");

    // Close sidebar on mobile when going back
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  /**
   * Sidebar actions
   */
  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      console.trace();
      return next;
    });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  /**
   * Dropdown actions
   */
  const toggleeventsDropdown = () => {
    seteventsDropdownOpen((prev) => !prev);
    setVisibleeventsCount(DEFAULT_STATE.visibleeventsCount); // Reset to show first 5 events
  };

  const closeeventsDropdown = () => {
    seteventsDropdownOpen(false);
  };

  const showMoreevents = () => {
    setVisibleeventsCount((prev) => prev + 5);
  };

  const toggleFilterDropdown = () => {
    setFilterDropdownOpen((prev) => !prev);
  };

  const closeFilterDropdown = () => {
    setFilterDropdownOpen(false);
  };

  const toggleNotificationsDropdown = () => {
    setNotificationsDropdownOpen((prev) => !prev);
  };

  const closeNotificationsDropdown = () => {
    setNotificationsDropdownOpen(false);
  };

  /**
   * Mobile user menu actions
   */
  const toggleMobileUserMenu = () => {
    setShowMobileUserMenu((prev) => !prev);
  };

  const closeMobileUserMenu = () => {
    setShowMobileUserMenu(false);
  };

  /**
   * Tab switching actions
   */
  const switchFriendsTab = (tab) => {
    setFriendsActiveTab(tab);
  };

  const switcheventsTab = (tab) => {
    seteventsActiveTab(tab);
  };

  /**
   * Desktop section expansion actions
   */
  const toggleDesktopRequests = () => {
    setDesktopRequestsExpanded((prev) => !prev);
  };

  const toggleEventInvites = () => {
    setEventInvitesExpanded((prev) => !prev);
  };

  const toggleDesktopRequestsVisibility = () => {
    setShowDesktopRequests((prev) => !prev);
  };

  /**
   * Search and filter actions
   */
  const updateSearchTerm = (term) => {
    setSearchTerm(term);
    // Focus search input after state update
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const updateDateFilter = (filter) => {
    setDateFilter(filter);
    setFilterDropdownOpen(false);
  };

  const resetFilters = () => {
    setSearchTerm(DEFAULT_STATE.searchTerm);
    setDateFilter(DEFAULT_STATE.dateFilter);
  };

  /**
   * Utility functions
   */
  const isViewingEvent = () => currentView === "event" && selectedeventId;

  const shouldShowMobileNav = () => isMobile;

  const shouldShowDesktopSidebar = () => !isMobile && sidebarOpen;

  const getLayoutClasses = () => {
    if (isMobile) {
      return {
        main: "h-[calc(100vh-4rem)] w-full transition-all duration-300",
        content: "pb-4 h-full",
      };
    }

    // Desktop: dynamically adjust based on sidebar state
    return {
      main: sidebarOpen
        ? "ml-64 w-[calc(100%-16rem)] min-h-screen transition-all duration-300"
        : "ml-0 w-full min-h-screen transition-all duration-300",
      content: "py-2 sm:py-4",
    };
  };

  /**
   * Focus management
   */
  const focusSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  /**
   * Close all dropdowns - useful for navigation or cleanup
   */
  const closeAllDropdowns = () => {
    seteventsDropdownOpen(false);
    setFilterDropdownOpen(false);
    setNotificationsDropdownOpen(false);
    setShowMobileUserMenu(false);
  };

  return {
    // Refs
    refs: {
      notificationRef,
      mobileUserMenuRef,
      searchInputRef,
    },

    // Layout state
    layout: {
      sidebarOpen,
      activeSection,
      currentView,
      selectedeventId,
      isMobile,
      windowWidth,
    },

    // Dropdown states
    dropdowns: {
      eventsDropdownOpen,
      visibleeventsCount,
      filterDropdownOpen,
      notificationsDropdownOpen,
      showMobileUserMenu,
    },

    // Tab states
    tabs: {
      friendsActiveTab,
      eventsActiveTab,
    },

    // Desktop expansion states
    desktop: {
      showDesktopRequests,
      desktopRequestsExpanded,
      eventInvitesExpanded,
    },

    // Search and filter states
    filters: {
      searchTerm,
      dateFilter,
    },

    // Navigation actions
    navigation: {
      navigateToSection,
      navigateToEvent,
      navigateBackToDashboard,
    },

    // Sidebar actions
    sidebar: {
      toggle: toggleSidebar,
      close: closeSidebar,
      open: openSidebar,
    },

    // Dropdown actions
    dropdownActions: {
      toggleeventsDropdown,
      closeeventsDropdown,
      showMoreevents,
      toggleFilterDropdown,
      closeFilterDropdown,
      toggleNotificationsDropdown,
      closeNotificationsDropdown,
      closeAllDropdowns,
    },

    // Mobile actions
    mobile: {
      toggleUserMenu: toggleMobileUserMenu,
      closeUserMenu: closeMobileUserMenu,
    },

    // Tab actions
    tabActions: {
      switchFriendsTab,
      switcheventsTab,
    },

    // Desktop section actions
    desktopActions: {
      toggleDesktopRequests,
      toggleEventInvites,
      toggleDesktopRequestsVisibility,
    },

    // Filter actions
    filterActions: {
      updateSearchTerm,
      clearSearch,
      updateDateFilter,
      resetFilters,
      focusSearchInput,
    },

    // Utility functions
    utils: {
      isViewingEvent,
      shouldShowMobileNav,
      shouldShowDesktopSidebar,
      getLayoutClasses,
    },
  };
};
