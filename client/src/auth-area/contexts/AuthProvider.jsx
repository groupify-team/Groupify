import React from "react";
import { CoreAuthProvider } from "./CoreAuthContext";
import { SubscriptionProvider } from "./SubscriptionContext.jsx";

export function AuthProvider({ children }) {
  return (
    <CoreAuthProvider>
      <SubscriptionProvider>{children}</SubscriptionProvider>
    </CoreAuthProvider>
  );
}

export default AuthProvider;
