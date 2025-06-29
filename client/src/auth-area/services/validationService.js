export const validationService = {
  // Email validation patterns
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validate: (email) => {
      if (!email) return { isValid: false, message: "Email is required" };
      if (!validationService.email.regex.test(email)) {
        return { isValid: false, message: "Please enter a valid email address" };
      }
      return { isValid: true, message: "" };
    }
  },

  // Password validation patterns
  password: {
    minLength: 6,
    patterns: {
      uppercase: /[A-Z]/,
      lowercase: /[a-z]/,
      number: /\d/,
      special: /[!@#$%^&*(),.?":{}|<>]/
    },
    validate: (password) => {
      if (!password) return { isValid: false, message: "Password is required" };
      if (password.length < validationService.password.minLength) {
        return { isValid: false, message: `Password must be at least ${validationService.password.minLength} characters long` };
      }
      return { isValid: true, message: "" };
    },
    getStrength: (password) => {
      if (!password) return { strength: 0, label: "None", color: "bg-gray-300" };

      const { patterns } = validationService.password;
      let score = 0;

      if (password.length >= 6) score++;
      if (password.length >= 8) score++;
      if (patterns.uppercase.test(password)) score++;
      if (patterns.lowercase.test(password)) score++;
      if (patterns.number.test(password)) score++;
      if (patterns.special.test(password)) score++;

      if (score <= 2) return { strength: score, label: "Weak", color: "bg-red-500" };
      if (score <= 4) return { strength: score, label: "Medium", color: "bg-yellow-500" };
      return { strength: score, label: "Strong", color: "bg-green-500" };
    }
  },

  // Name validation
  name: {
    minLength: 2,
    maxLength: 50,
    validate: (name) => {
      if (!name) return { isValid: false, message: "Name is required" };
      if (name.length < validationService.name.minLength) {
        return { isValid: false, message: `Name must be at least ${validationService.name.minLength} characters long` };
      }
      if (name.length > validationService.name.maxLength) {
        return { isValid: false, message: `Name must be less than ${validationService.name.maxLength} characters` };
      }
      return { isValid: true, message: "" };
    }
  },

  // Form validation
  validateForm: (formData, rules) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const value = formData[field];
      const rule = rules[field];
      
      if (rule.required && !value) {
        errors[field] = `${field} is required`;
        return;
      }
      
      if (value && rule.validator) {
        const result = rule.validator(value);
        if (!result.isValid) {
          errors[field] = result.message;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};