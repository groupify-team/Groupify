import React, { memo } from "react";
import { BrowserRouter as Router } from "react-router-dom";

// Core providers
import { AuthProvider } from "@/auth-area";
import { ThemeProvider } from "@shared/contexts/ThemeContext";
import GlobalAccessibilityProvider from "@/shared/components/accessibility/GlobalAccessibilityProvider";

// App components
import FlowController from "@/shared/components/routing/FlowController";
import AppRoutes from "@/shared/components/routing/AppRoutes";

// Toast notifications
import { Toaster } from "react-hot-toast";

function App() {
  const AppContent = memo(() => (
    <Router>
      <AuthProvider>
        <GlobalAccessibilityProvider>
          <FlowController>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                className: "z-[70]",
              }}
            />
            <AppRoutes />
          </FlowController>
        </GlobalAccessibilityProvider>
      </AuthProvider>
    </Router>
  ));

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
