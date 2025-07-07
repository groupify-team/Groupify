class NavigationService {
  constructor() {
    this.listeners = new Set();
    this.navigationContext = this.getStoredContext();
  }

  setContext(context) {
    const navigationContext = {
      origin: context.origin,
      returnPath: context.returnPath,
      section: context.section,
      timestamp: Date.now(),
      metadata: context.metadata || {},
    };

    this.navigationContext = navigationContext;
    this.storeContext(navigationContext);
    this.notifyListeners("contextSet", navigationContext);

    return navigationContext;
  }

  getContext() {
    return this.navigationContext;
  }

  clearContext() {
    this.navigationContext = null;
    this.removeStoredContext();
    this.notifyListeners("contextCleared");
  }

  getReturnPath(fallbackPath = "/") {
    if (!this.navigationContext) {
      return fallbackPath;
    }

    const { returnPath, section } = this.navigationContext;
    let path = returnPath || fallbackPath;
    if (section && !path.includes("section=")) {
      const separator = path.includes("?") ? "&" : "?";
      path += `${separator}section=${section}`;
    }

    return path;
  }

  navigateBack(navigate, options = {}) {
    const {
      successMessage,
      fallbackPath = "/",
      clearContext = true,
      delay = 0,
    } = options;

    const returnPath = this.getReturnPath(fallbackPath);

    const executeNavigation = () => {
      if (clearContext) {
        this.clearContext();
      }

      if (successMessage) {
        const url = new URL(returnPath, window.location.origin);
        url.searchParams.set("success", encodeURIComponent(successMessage));
        navigate(url.pathname + url.search);
      } else {
        navigate(returnPath);
      }
    };

    if (delay > 0) {
      setTimeout(executeNavigation, delay);
    } else {
      executeNavigation();
    }
  }

  navigateToBilling(navigate, options = {}) {
    const { plan, billing = "monthly", from } = options;

    if (from) {
      this.setContext({
        origin: from,
        returnPath: this.getCurrentPath(),
        section: this.getCurrentSection(),
        metadata: { action: "billing", plan, billing },
      });
    }

    const params = new URLSearchParams();
    if (plan) params.set("plan", plan);
    if (billing) params.set("billing", billing);

    const billingPath = `/billing${
      params.toString() ? "?" + params.toString() : ""
    }`;
    navigate(billingPath);
  }

  navigateToPricing(navigate, options = {}) {
    const { plan, from } = options;

    if (from) {
      this.setContext({
        origin: from,
        returnPath: this.getCurrentPath(),
        section: this.getCurrentSection(),
        metadata: { action: "pricing", plan },
      });
    }

    const params = new URLSearchParams();
    if (plan) params.set("plan", plan);

    const pricingPath = `/pricing${
      params.toString() ? "?" + params.toString() : ""
    }`;
    navigate(pricingPath);
  }

  handleSubscriptionSuccess(navigate, options = {}) {
    const { plan, action = "subscription", message } = options;

    const successMessage =
      message ||
      `Successfully ${
        action === "upgrade" ? "upgraded to" : "activated"
      } ${plan} plan!`;

    this.navigateBack(navigate, {
      successMessage,
      delay: 1500,
      clearContext: true,
    });
  }

  getCurrentPath() {
    return window.location.pathname + window.location.search;
  }

  getCurrentSection() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("section") || null;
  }

  storeContext(context) {
    try {
      sessionStorage.setItem(
        "groupify_navigation_context",
        JSON.stringify(context)
      );
    } catch (error) {
      console.warn("Failed to store navigation context:", error);
    }
  }

  getStoredContext() {
    try {
      const stored = sessionStorage.getItem("groupify_navigation_context");
      if (stored) {
        const context = JSON.parse(stored);

        const isValid =
          context.timestamp && Date.now() - context.timestamp < 60 * 60 * 1000;

        if (isValid) {
          return context;
        } else {
          this.removeStoredContext();
        }
      }
    } catch (error) {
      console.warn("Failed to retrieve navigation context:", error);
      this.removeStoredContext();
    }
    return null;
  }

  removeStoredContext() {
    try {
      sessionStorage.removeItem("groupify_navigation_context");
    } catch (error) {
      console.warn("Failed to remove navigation context:", error);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(event, data) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch (error) {
        console.error("Navigation listener error:", error);
      }
    });
  }

  isFromOrigin(origin) {
    return this.navigationContext?.origin === origin;
  }

  getOriginMetadata() {
    return this.navigationContext?.metadata || {};
  }

  updateMetadata(updates) {
    if (this.navigationContext) {
      this.navigationContext.metadata = {
        ...this.navigationContext.metadata,
        ...updates,
      };
      this.storeContext(this.navigationContext);
      this.notifyListeners("metadataUpdated", this.navigationContext.metadata);
    }
  }
}

const navigationService = new NavigationService();
export default navigationService;



