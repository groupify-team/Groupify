import { toast } from "react-hot-toast";

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

export const modalToast = {
  success: (message, options = {}) => {
    return toast.success(message, { ...modalToastConfig, ...options });
  },
  error: (message, options = {}) => {
    return toast.error(message, { ...modalToastConfig, ...options });
  },
  loading: (message, options = {}) => {
    return toast.loading(message, { ...modalToastConfig, ...options });
  },
  dismiss: (toastId) => {
    return toast.dismiss(toastId);
  },
};

export default modalToast;
