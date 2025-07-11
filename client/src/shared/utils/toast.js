import { toast as hotToast } from "react-hot-toast";

/**
 * Colored toast functions for regular (non-modal) contexts
 */

// Color configurations
const colors = {
  success: { background: "#10b981", color: "white" },
  error: { background: "#ef4444", color: "white" },
  warning: { background: "#f59e0b", color: "white" },
  info: { background: "#3b82f6", color: "white" },
};

const baseStyle = {
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "500",
  padding: "12px 16px",
  minWidth: "300px",
  maxWidth: "500px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
};

export const toast = {
  success: (message, options = {}) => {
    return hotToast.success(message, {
      duration: 4000,
      style: { ...baseStyle, ...colors.success, ...options.style },
      ...options,
    });
  },

  error: (message, options = {}) => {
    return hotToast.error(message, {
      duration: 4000,
      style: { ...baseStyle, ...colors.error, ...options.style },
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return hotToast(message, {
      duration: 4000,
      icon: "⚠️",
      style: { ...baseStyle, ...colors.warning, ...options.style },
      ...options,
    });
  },

  info: (message, options = {}) => {
    return hotToast(message, {
      duration: 4000,
      icon: "ℹ️",
      style: { ...baseStyle, ...colors.info, ...options.style },
      ...options,
    });
  },

  loading: (message, options = {}) => {
    return hotToast.loading(message, {
      duration: 4000,
      style: {
        ...baseStyle,
        background: "#6b7280",
        color: "white",
        ...options.style,
      },
      ...options,
    });
  },

  dismiss: (toastId) => {
    return hotToast.dismiss(toastId);
  },
};

export default toast;
