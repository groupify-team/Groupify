class NavigationService {
  constructor() {
    this.listeners = new Set();
    this.navigationContext = this.getStoredContext();
  }

  /**
   * Set navigation context for returning users to correct location
   */
  setContext(context) {
    const navigationContext = {
      origin: context.origin, // 'dashboard-settings', 'public-pricing', 'signup', etc.
      returnPath: context.returnPath, // Full path to return to
      section: context.section, // Optional section within page
      timestamp: Date.now(),
      metadata: context.metadata || {}, // Additional context data
    };

    this.navigationContext = navigationContext;
    this.storeContext(navigationContext);
    this.notifyListeners('contextSet', navigationContext);
    
    console.log('🧭 Navigation context set:', navigationContext);
    return navigationContext;
  }

  /**
   * Get current navigation context
   */
  getContext() {
    return this.navigationContext;
  }

  /**
   * Clear navigation context
   */
  clearContext() {
    this.navigationContext = null;
    this.removeStoredContext();
    this.notifyListeners('contextCleared');
    console.log('🧭 Navigation context cleared');
  }

  /**
   * Get return path based on context
   */
  getReturnPath(fallbackPath = '/') {
    if (!this.navigationContext) {
      return fallbackPath;
    }

    const { origin, returnPath, section } = this.navigationContext;

    // Build return path with section if available
    let path = returnPath || fallbackPath;
    if (section && !path.includes('section=')) {
      const separator = path.includes('?') ? '&' : '?';
      path += `${separator}section=${section}`;
    }

    console.log('🧭 Calculated return path:', path, 'from context:', this.navigationContext);
    return path;
  }

  /**
   * Navigate back to origin with success handling
   */
  navigateBack(navigate, options = {}) {
    const { 
      successMessage, 
      fallbackPath = '/', 
      clearContext = true,
      delay = 0 
    } = options;

    const returnPath = this.getReturnPath(fallbackPath);

    const executeNavigation = () => {
      if (clearContext) {
        this.clearContext();
      }

      // Add success message to URL if provided
      if (successMessage) {
        const url = new URL(returnPath, window.location.origin);
        url.searchParams.set('success', encodeURIComponent(successMessage));
        navigate(url.pathname + url.search);
      } else {
        navigate(returnPath);
      }

      console.log('🧭 Navigated back to:', returnPath);
    };

    if (delay > 0) {
      setTimeout(executeNavigation, delay);
    } else {
      executeNavigation();
    }
  }

  /**
   * Navigate to billing with context
   */
  navigateToBilling(navigate, options = {}) {
    const { plan, billing = 'monthly', from } = options;
    
    // Set context for return navigation
    if (from) {
      this.setContext({
        origin: from,
        returnPath: this.getCurrentPath(),
        section: this.getCurrentSection(),
        metadata: { action: 'billing', plan, billing }
      });
    }

    // Build billing URL
    const params = new URLSearchParams();
    if (plan) params.set('plan', plan);
    if (billing) params.set('billing', billing);
    
    const billingPath = `/billing${params.toString() ? '?' + params.toString() : ''}`;
    navigate(billingPath);
    
    console.log('🧭 Navigated to billing:', billingPath);
  }

  /**
   * Navigate to pricing with context
   */
  navigateToPricing(navigate, options = {}) {
    const { plan, from } = options;
    
    // Set context for return navigation
    if (from) {
      this.setContext({
        origin: from,
        returnPath: this.getCurrentPath(),
        section: this.getCurrentSection(),
        metadata: { action: 'pricing', plan }
      });
    }

    // Build pricing URL
    const params = new URLSearchParams();
    if (plan) params.set('plan', plan);
    
    const pricingPath = `/pricing${params.toString() ? '?' + params.toString() : ''}`;
    navigate(pricingPath);
    
    console.log('🧭 Navigated to pricing:', pricingPath);
  }

  /**
   * Handle successful subscription action
   */
  handleSubscriptionSuccess(navigate, options = {}) {
    const { plan, action = 'subscription', message } = options;
    
    const successMessage = message || `Successfully ${action === 'upgrade' ? 'upgraded to' : 'activated'} ${plan} plan!`;
    
    this.navigateBack(navigate, {
      successMessage,
      delay: 1500, // Give time for success animation
      clearContext: true
    });
  }

  /**
   * Get current path for context setting
   */
  getCurrentPath() {
    return window.location.pathname + window.location.search;
  }

  /**
   * Get current section from URL
   */
  getCurrentSection() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('section') || null;
  }

  /**
   * Store context in sessionStorage
   */
  storeContext(context) {
    try {
      sessionStorage.setItem('groupify_navigation_context', JSON.stringify(context));
    } catch (error) {
      console.warn('Failed to store navigation context:', error);
    }
  }

  /**
   * Get stored context from sessionStorage
   */
  getStoredContext() {
    try {
      const stored = sessionStorage.getItem('groupify_navigation_context');
      if (stored) {
        const context = JSON.parse(stored);
        
        // Check if context is still valid (not older than 1 hour)
        const isValid = context.timestamp && (Date.now() - context.timestamp) < 60 * 60 * 1000;
        
        if (isValid) {
          return context;
        } else {
          this.removeStoredContext();
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve navigation context:', error);
      this.removeStoredContext();
    }
    return null;
  }

  /**
   * Remove stored context
   */
  removeStoredContext() {
    try {
      sessionStorage.removeItem('groupify_navigation_context');
    } catch (error) {
      console.warn('Failed to remove navigation context:', error);
    }
  }

  /**
   * Subscribe to navigation events
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Navigation listener error:', error);
      }
    });
  }

  /**
   * Check if user came from specific origin
   */
  isFromOrigin(origin) {
    return this.navigationContext?.origin === origin;
  }

  /**
   * Get origin metadata
   */
  getOriginMetadata() {
    return this.navigationContext?.metadata || {};
  }

  /**
   * Update context metadata
   */
  updateMetadata(updates) {
    if (this.navigationContext) {
      this.navigationContext.metadata = {
        ...this.navigationContext.metadata,
        ...updates
      };
      this.storeContext(this.navigationContext);
      this.notifyListeners('metadataUpdated', this.navigationContext.metadata);
    }
  }

  /**
   * Debug current state
   */
  debug() {
    console.group('🧭 Navigation Service Debug');
    console.log('Current context:', this.navigationContext);
    console.log('Current path:', this.getCurrentPath());
    console.log('Current section:', this.getCurrentSection());
    console.log('Return path would be:', this.getReturnPath());
    console.log('Listeners count:', this.listeners.size);
    console.groupEnd();
  }
}

// Create singleton instance
const navigationService = new NavigationService();

export default navigationService;