// components/TripDetailView/components/TripErrorBoundary.jsx
import React from "react";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

class TripErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to your error reporting service
    console.error("TripDetailView Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally refresh the page or reload data
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 border border-red-200/50 dark:border-red-800/50 shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ExclamationTriangleIcon className="w-10 h-10 text-red-500 dark:text-red-400" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Something went wrong
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  We encountered an unexpected error while loading your trip.
                  Please try refreshing the page.
                </p>

                {process.env.NODE_ENV === "development" && (
                  <details className="mb-6 text-left">
                    <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer mb-2">
                      Error Details (Development)
                    </summary>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-40">
                      {this.state.error && this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TripErrorBoundary;
