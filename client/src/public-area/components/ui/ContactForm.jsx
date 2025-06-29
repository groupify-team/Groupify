import { useState } from "react";
import { contactService } from "../services/contactService";

export const useContactForm = ({ 
  onSuccess = null, 
  onError = null,
  initialData = {}
} = {}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
    ...initialData,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
      case "lastName":
        if (!value.trim()) {
          return `${name === "firstName" ? "First" : "Last"} name is required`;
        }
        if (value.trim().length < 2) {
          return `${name === "firstName" ? "First" : "Last"} name must be at least 2 characters`;
        }
        if (!/^[a-zA-Z\s'-]+$/.test(value)) {
          return "Name can only contain letters, spaces, apostrophes, and hyphens";
        }
        break;

      case "email":
        if (!value.trim()) {
          return "Email is required";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return "Please enter a valid email address";
        }
        break;

      case "subject":
        if (!value.trim()) {
          return "Subject is required";
        }
        if (value.trim().length < 5) {
          return "Subject must be at least 5 characters";
        }
        if (value.trim().length > 100) {
          return "Subject must be less than 100 characters";
        }
        break;

      case "message":
        if (!value.trim()) {
          return "Message is required";
        }
        if (value.trim().length < 10) {
          return "Message must be at least 10 characters";
        }
        if (value.trim().length > 2000) {
          return "Message must be less than 2000 characters";
        }
        break;

      default:
        break;
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    Object.keys(formData).forEach((field) => {
      if (["firstName", "lastName", "email", "subject", "message"].includes(field)) {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Real-time validation for better UX
    if (value.trim() !== "") {
      const fieldError = validateField(name, value);
      if (fieldError) {
        setErrors((prev) => ({
          ...prev,
          [name]: fieldError,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return { success: false, error: "Please fix the validation errors" };
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await contactService.sendMessage(formData);
      
      if (result.success) {
        setSubmitted(true);
        if (onSuccess) {
          onSuccess(result.data);
        }
        return { success: true, data: result.data };
      } else {
        const errorMessage = result.error || "Failed to send message. Please try again.";
        setErrors({ general: errorMessage });
        if (onError) {
          onError(result.error);
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("Contact form submission error:", error);
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      setErrors({ general: errorMessage });
      if (onError) {
        onError(errorMessage);
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: "",
      category: "general",
      ...initialData,
    });
    setErrors({});
    setSubmitted(false);
    setLoading(false);
  };

  const updateField = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setFieldError = (name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const clearErrors = () => {
    setErrors({});
  };

  return {
    formData,
    loading,
    errors,
    submitted,
    handleChange,
    handleSubmit,
    resetForm,
    updateField,
    setFieldError,
    clearErrors,
    validateForm,
    isValid: Object.keys(errors).length === 0 && 
             formData.firstName && 
             formData.lastName && 
             formData.email && 
             formData.subject && 
             formData.message,
  };
};