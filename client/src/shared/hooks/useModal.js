// Custom hook for managing modal state with smooth animations
import { useState, useCallback } from "react";

/**
 * Custom hook for managing modal state
 * @param {boolean} initialState - Initial open state of the modal
 * @returns {object} Modal state and controls
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [isClosing, setIsClosing] = useState(false);

  const openModal = useCallback(() => {
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsClosing(true);
    // Allow time for exit animation
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300);
  }, []);

  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  }, [isOpen, openModal, closeModal]);

  return {
    isOpen,
    isClosing,
    openModal,
    closeModal,
    toggleModal,
  };
};

/**
 * Custom hook for managing multiple modals
 * @param {object} initialStates - Object with modal names as keys and initial states as values
 * @returns {object} Modal states and controls
 */
export const useModals = (initialStates = {}) => {
  const [modals, setModals] = useState(initialStates);

  const openModal = useCallback((modalName) => {
    setModals((prev) => ({
      ...prev,
      [modalName]: true,
    }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals((prev) => ({
      ...prev,
      [modalName]: false,
    }));
  }, []);

  const toggleModal = useCallback((modalName) => {
    setModals((prev) => ({
      ...prev,
      [modalName]: !prev[modalName],
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals((prev) => {
      const newState = {};
      Object.keys(prev).forEach((key) => {
        newState[key] = false;
      });
      return newState;
    });
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
    isOpen: (modalName) => !!modals[modalName],
  };
};

export default useModal;
