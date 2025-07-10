import React, { memo } from "react";
import { BrowserRouter as Router } from "react-router-dom";

// Core providers
import { AuthProvider } from "@/auth-area";
import { ThemeProvider } from "@shared/contexts/ThemeContext";
import { FriendsProvider } from "@shared/contexts/FriendsContext"; // ADD THIS IMPORT
import GlobalAccessibilityProvider from "@/shared/components/accessibility/GlobalAccessibilityProvider";

// App components
import FlowController from "@/shared/components/routing/FlowController";
import AppRoutes from "@/shared/components/routing/AppRoutes";
import PageTransitionWrapper from "@/shared/components/ui/PageTransitionWrapper";

// Toast notifications
import { Toaster } from "react-hot-toast";

function App() {
  const AppContent = memo(() => (
    <Router>
      <AuthProvider>
        <FriendsProvider>
          {" "}
          {/* ADD THIS */}
          <GlobalAccessibilityProvider>
            <FlowController>
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  className: "toast-above-modal",
                }}
              />
              <PageTransitionWrapper>
                <AppRoutes />
              </PageTransitionWrapper>
            </FlowController>
          </GlobalAccessibilityProvider>
        </FriendsProvider>{" "}
        {/* ADD THIS */}
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
