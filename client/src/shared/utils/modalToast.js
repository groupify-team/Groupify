import { toast } from "@shared/utils/toast";

/**
 * Toast utility functions for modal contexts
 * These ensure toast messages appear above modal backdrops
 */

const modalToastConfig = {
  duration: 3000,
  className: "toast-above-modal toast-override",
  style: {
    zIndex: 999999,
  },
};

// Color configurations
const colors = {
  success: { background: "#10b981", color: "white" },
  error: { background: "#ef4444", color: "white" },
  warning: { background: "#f59e0b", color: "white" },
  info: { background: "#3b82f6", color: "white" },
};

export const modalToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...modalToastConfig,
      style: { ...modalToastConfig.style, ...colors.success, ...options.style },
      ...options,
    });
  },
  error: (message, options = {}) => {
    return toast.error(message, {
      ...modalToastConfig,
      style: { ...modalToastConfig.style, ...colors.error, ...options.style },
      ...options,
    });
  },
  warning: (message, options = {}) => {
    return toast(message, {
      ...modalToastConfig,
      icon: "⚠️",
      style: { ...modalToastConfig.style, ...colors.warning, ...options.style },
      ...options,
    });
  },
  info: (message, options = {}) => {
    return toast(message, {
      ...modalToastConfig,
      icon: "ℹ️",
      style: { ...modalToastConfig.style, ...colors.info, ...options.style },
      ...options,
    });
  },
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...modalToastConfig,
      style: {
        ...modalToastConfig.style,
        background: "#6b7280",
        color: "white",
        ...options.style,
      },
      ...options,
    });
  },
  dismiss: (toastId) => {
    return toast.dismiss(toastId);
  },
};

export default modalToast;
