import { httpsCallable } from "firebase/functions";
import { functions } from "@firebase-services/config";

export const contactService = {
  /**
   * Send a contact form message
   * @param {Object} messageData - The contact form data
   * @param {string} messageData.firstName - First name
   * @param {string} messageData.lastName - Last name
   * @param {string} messageData.email - Email address
   * @param {string} messageData.subject - Message subject
   * @param {string} messageData.message - Message content
   * @param {string} messageData.category - Message category
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async sendMessage(messageData) {
    try {
      // Validate required fields
      const required = ["firstName", "lastName", "email", "subject", "message"];
      const missing = required.filter((field) => !messageData[field]?.trim());

      if (missing.length > 0) {
        return {
          success: false,
          error: `Missing required fields: ${missing.join(", ")}`,
        };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(messageData.email)) {
        return {
          success: false,
          error: "Please enter a valid email address",
        };
      }

      // Prepare the message data
      const cleanedData = {
        firstName: messageData.firstName.trim(),
        lastName: messageData.lastName.trim(),
        email: messageData.email.trim().toLowerCase(),
        subject: messageData.subject.trim(),
        message: messageData.message.trim(),
        category: messageData.category || "general",
        timestamp: new Date().toISOString(),
        source: "contact_form",
      };

      // Call Firebase function
      const sendContactEmail = httpsCallable(functions, "sendContactEmail");
      const result = await sendContactEmail(cleanedData);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Contact service error:", error);

      // Handle different types of Firebase errors
      let errorMessage = "Failed to send message. Please try again.";

      if (error.code === "functions/internal") {
        errorMessage = "Server error. Please try again later.";
      } else if (error.code === "functions/invalid-argument") {
        errorMessage =
          "Invalid information provided. Please check your details.";
      } else if (error.code === "functions/unauthenticated") {
        errorMessage = "Authentication required. Please refresh the page.";
      } else if (error.code === "functions/deadline-exceeded") {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.code === "functions/unavailable") {
        errorMessage =
          "Service temporarily unavailable. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Send a newsletter subscription
   * @param {string} email - Email address to subscribe
   * @param {string} source - Source of the subscription (optional)
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async subscribeNewsletter(email, source = "newsletter_form") {
    try {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: "Please enter a valid email address",
        };
      }

      const subscriptionData = {
        email: email.trim().toLowerCase(),
        source,
        timestamp: new Date().toISOString(),
      };

      console.log("Subscribing to newsletter:", subscriptionData.email);

      // For now, store in localStorage as fallback
      // In production, this would call a Firebase function
      try {
        const existingSubscribers = JSON.parse(
          localStorage.getItem("groupify_subscribers") || "[]"
        );

        if (existingSubscribers.includes(subscriptionData.email)) {
          return {
            success: false,
            error: "This email is already subscribed!",
          };
        }

        const updatedSubscribers = [
          ...existingSubscribers,
          subscriptionData.email,
        ];
        localStorage.setItem(
          "groupify_subscribers",
          JSON.stringify(updatedSubscribers)
        );

        // TODO: Implement Firebase function call
        // const subscribeToNewsletter = httpsCallable(functions, "subscribeToNewsletter");
        // const result = await subscribeToNewsletter(subscriptionData);

        return {
          success: true,
          data: { email: subscriptionData.email },
        };
      } catch (localError) {
        console.error("Newsletter subscription error:", localError);
        return {
          success: false,
          error: "Subscription failed. Please try again.",
        };
      }
    } catch (error) {
      console.error("Newsletter service error:", error);
      return {
        success: false,
        error: "Subscription failed. Please try again.",
      };
    }
  },

  /**
   * Send feedback or bug report
   * @param {Object} feedbackData - The feedback data
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async sendFeedback(feedbackData) {
    try {
      const cleanedData = {
        ...feedbackData,
        timestamp: new Date().toISOString(),
        source: "feedback_form",
      };

      // Store in localStorage for now
      const existingFeedback = JSON.parse(
        localStorage.getItem("groupify_feedback") || "[]"
      );

      existingFeedback.push(cleanedData);
      localStorage.setItem(
        "groupify_feedback",
        JSON.stringify(existingFeedback)
      );

      // TODO: Implement Firebase function call
      // const sendFeedbackEmail = httpsCallable(functions, "sendFeedback");
      // const result = await sendFeedbackEmail(cleanedData);

      return {
        success: true,
        data: cleanedData,
      };
    } catch (error) {
      console.error("Feedback service error:", error);
      return {
        success: false,
        error: "Failed to send feedback. Please try again.",
      };
    }
  },

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Sanitize input to prevent XSS
   * @param {string} input - Input to sanitize
   * @returns {string}
   */
  sanitizeInput(input) {
    if (typeof input !== "string") return input;

    return input
      .trim()
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .substring(0, 2000); // Limit length
  },
};
