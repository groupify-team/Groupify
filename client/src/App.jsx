import React, { memo } from "react";
import { BrowserRouter as Router } from "react-router-dom";

// Core providers
import { AuthProvider } from "@/auth-area";
import { ThemeProvider } from "@shared/contexts/ThemeContext";
import { FriendsProvider } from "@shared/contexts/FriendsContext";
import { EventProvider } from "@shared/contexts/EventContext";
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
          <EventProvider>
            <GlobalAccessibilityProvider>
              <FlowController>
                <Toaster />
                <PageTransitionWrapper>
                  <AppRoutes />
                </PageTransitionWrapper>
              </FlowController>
            </GlobalAccessibilityProvider>
          </EventProvider>
        </FriendsProvider>
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
