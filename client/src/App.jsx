import React, { memo } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { AuthProvider } from "@/auth-area";
import { ThemeProvider } from "@shared/contexts/ThemeContext";
import { FriendsProvider } from "@shared/contexts/FriendsContext";
import { EventProvider } from "@shared/contexts/EventContext";
import GlobalAccessibilityProvider from "@/shared/components/accessibility/GlobalAccessibilityProvider";

import { usePresence } from "@shared/hooks/usePresence";
import { useAuth } from "@auth/hooks/useAuth";
import FlowController from "@/shared/components/routing/FlowController";
import AppRoutes from "@/shared/components/routing/AppRoutes";
import PageTransitionWrapper from "@/shared/components/ui/PageTransitionWrapper";

import { Toaster } from "react-hot-toast";

const PresenceManager = () => {
  const { currentUser } = useAuth();
  usePresence();
  return null;
};

const InnerApp = memo(() => (
  <AuthProvider>
    <PresenceManager />
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
));

function App() {
  if (import.meta.env.DEV) {
    import("@shared/services/presence/PresenceService").then((module) => {
      window.PresenceService = module.PresenceService;
    });
  }

  return (
    <ThemeProvider>
      <Router>
        <InnerApp />
      </Router>
    </ThemeProvider>
  );
}

export default App;