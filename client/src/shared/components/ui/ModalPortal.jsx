import { createPortal } from "react-dom";

/**
 * Modal Portal Component
 * Renders modal content in a portal to avoid z-index and overflow issues
 */
const ModalPortal = ({ children, isOpen }) => {
  if (!isOpen) return null;

  // Create portal to document.body to escape any container overflow
  return createPortal(children, document.body);
};

export default ModalPortal;
