import { validationService } from '../services/validationService';

export const useAuthValidation = () => {
  const validateEmail = (email) => {
    if (!email?.trim()) {
      return { isValid: false, error: "Email is required" };
    }
    const result = validationService.email.validate(email);
    return { isValid: result.isValid, error: result.message };
  };

  const validateSignIn = (formData) => {
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) return emailValidation;

    if (!formData.password) {
      return { isValid: false, error: "Password is required" };
    }

    return { isValid: true, error: "" };
  };

  const validateSignUp = (formData) => {
    // Check required fields
    if (!formData.displayName?.trim()) {
      return { isValid: false, error: "Full name is required" };
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) return emailValidation;

    // Validate password
    const passwordValidation = validationService.password.validate(formData.password);
    if (!passwordValidation.isValid) {
      return { isValid: false, error: passwordValidation.message };
    }

    // Check password strength requirements
    const { patterns } = validationService.password;
    if (!patterns.uppercase.test(formData.password) ||
        !patterns.lowercase.test(formData.password) ||
        !patterns.number.test(formData.password) ||
        !patterns.special.test(formData.password)) {
      return { isValid: false, error: "Password must contain uppercase, lowercase, numbers, and special characters" };
    }

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      return { isValid: false, error: "Passwords do not match" };
    }

    // Check terms agreement
    if (!formData.agreedToTerms) {
      return { isValid: false, error: "Please agree to the Terms of Service and Privacy Policy" };
    }

    return { isValid: true, error: "" };
  };

  const getPasswordStrength = (password) => {
    return validationService.password.getStrength(password);
  };

  return {
    validateEmail,
    validateSignIn,
    validateSignUp,
    getPasswordStrength,
  };
};