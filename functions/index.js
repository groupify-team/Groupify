const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");
const { defineSecret } = require("firebase-functions/params");
const crypto = require("crypto");

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets
const emailUser = defineSecret("EMAIL_USER");
const emailPassword = defineSecret("EMAIL_PASSWORD");
const appUrl = defineSecret("APP_URL");

// Configure email transporter
function getTransporter() {
  try {
    console.log("Creating email transporter...");

    // Simple debug logging
    console.log("EMAIL_USER exists:", !!emailUser.value());
    console.log("EMAIL_PASSWORD exists:", !!emailPassword.value());

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser.value(),
        pass: emailPassword.value(),
      },
    });

    console.log("Email transporter created successfully");
    return transporter;
  } catch (error) {
    console.error("Failed to create email transporter:", error);
    throw new HttpsError("internal", "Email configuration error");
  }
}

// Email template loader
async function loadEmailTemplate(templateName, variables) {
  try {
    const templatePath = path.join(
      __dirname,
      "email-templates",
      `${templateName}.html`
    );

    console.log(`Looking for template at: ${templatePath}`);

    // Read the template file
    let template = await fs.readFile(templatePath, "utf8");
    console.log(`Template ${templateName} loaded successfully`);

    // Replace variables
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      template = template.replace(regex, variables[key]);
    });

    return template;
  } catch (error) {
    console.error("Email template error:", error);
    console.error(
      `Template path: ${path.join(
        __dirname,
        "email-templates",
        `${templateName}.html`
      )}`
    );

    // If file not found, throw a specific error
    if (error.code === "ENOENT") {
      throw new Error(
        `Template file ${templateName}.html not found in email-templates folder`
      );
    }

    throw new Error(
      `Failed to load template: ${templateName} - ${error.message}`
    );
  }
}

// Generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Send verification email
exports.sendVerificationEmail = onCall(
  {
    secrets: [emailUser, emailPassword, appUrl],
    maxInstances: 40,
    timeoutSeconds: 60,
  },
  async (request) => {
    console.log("sendVerificationEmail function called");

    try {
      const { email, name } = request.data;

      console.log(`Processing verification for: ${email}`);

      if (!email || !name) {
        throw new HttpsError("invalid-argument", "Email and name are required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new HttpsError("invalid-argument", "Invalid email format");
      }

      // Generate verification code
      const verificationCode = generateVerificationCode();
      const verificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      console.log(`Generated code: ${verificationCode}`);

      // Store verification code in Firestore
      await admin.firestore().collection("verificationCodes").doc(email).set({
        code: verificationCode,
        expires: verificationExpires,
        email: email,
        name: name,
        verified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Verification code stored in Firestore");

      // Load verification email template
      const verificationEmailHtml = await loadEmailTemplate("verification", {
        USER_NAME: name,
        VERIFICATION_CODE: verificationCode,
        VERIFICATION_LINK: `${appUrl.value()}/confirm-email?code=${verificationCode}&email=${encodeURIComponent(
          email
        )}`,
        UNSUBSCRIBE_LINK: `${appUrl.value()}/unsubscribe`,
        PRIVACY_LINK: `${appUrl.value()}/privacy-policy`,
      });

      console.log("Email template loaded");

      // Send verification email
      const transporter = getTransporter();

      const mailOptions = {
        from: `"Groupify Team" <${emailUser.value()}>`,
        to: email,
        subject: "Verify Your Email - Groupify",
        html: verificationEmailHtml,
      };

      console.log("Attempting to send email...");
      await transporter.sendMail(mailOptions);

      console.log(`Verification email sent successfully to: ${email}`);
      return { success: true, message: "Verification email sent" };
    } catch (error) {
      console.error("Send verification error:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      // Handle specific nodemailer errors
      if (error.code === "EAUTH") {
        throw new HttpsError(
          "internal",
          "Email authentication failed. Please check email credentials."
        );
      }

      throw new HttpsError(
        "internal",
        "Failed to send verification email: " + error.message
      );
    }
  }
);

// Verify email code
exports.verifyEmailCode = onCall(
  {
    secrets: [emailUser, emailPassword, appUrl],
    maxInstances: 40,
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      const { email, verificationCode } = request.data;

      if (!email || !verificationCode) {
        throw new HttpsError(
          "invalid-argument",
          "Email and verification code are required"
        );
      }

      // Get verification code from Firestore
      const verificationDoc = await admin
        .firestore()
        .collection("verificationCodes")
        .doc(email)
        .get();

      if (!verificationDoc.exists) {
        throw new HttpsError("not-found", "Verification code not found");
      }

      const verificationData = verificationDoc.data();

      // Check if already verified
      if (verificationData.verified) {
        throw new HttpsError("already-exists", "Email already verified");
      }

      // Check if code matches and hasn't expired
      if (verificationData.code !== verificationCode) {
        throw new HttpsError("invalid-argument", "Invalid verification code");
      }

      if (Date.now() > verificationData.expires) {
        throw new HttpsError(
          "deadline-exceeded",
          "Verification code has expired"
        );
      }

      // Mark email as verified in Firestore
      await admin
        .firestore()
        .collection("verificationCodes")
        .doc(email)
        .update({
          verified: true,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // **NEW: Also update Firebase Auth user's email verification status**
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, {
          emailVerified: true,
        });
        console.log(`Firebase Auth email verification updated for: ${email}`);
      } catch (authError) {
        console.error(
          "Failed to update Firebase Auth verification:",
          authError
        );
        // Don't fail the entire process if this fails
      }

      // Send welcome email
      try {
        const welcomeEmailHtml = await loadEmailTemplate("welcome", {
          USER_NAME: verificationData.name,
          DASHBOARD_LINK: `${appUrl.value()}/signin`,
          HELP_CENTER_LINK: `${appUrl.value()}/help`,
          FACEBOOK_LINK: "https://facebook.com/groupify",
          INSTAGRAM_LINK: "https://instagram.com/groupify",
          TWITTER_LINK: "https://twitter.com/groupify",
          LINKEDIN_LINK: "https://linkedin.com/company/groupify",
          UNSUBSCRIBE_LINK: `${appUrl.value()}/unsubscribe`,
          PRIVACY_LINK: `${appUrl.value()}/privacy-policy`,
          TERMS_LINK: `${appUrl.value()}/terms`,
        });

        await getTransporter().sendMail({
          from: `"Groupify Team" <${emailUser.value()}>`,
          to: email,
          subject: "Welcome to Groupify! 🎉 Your account is ready",
          html: welcomeEmailHtml,
        });

        console.log(`Welcome email sent to: ${email}`);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the verification if welcome email fails
      }

      console.log(`Email verified for: ${email}`);
      return { success: true, message: "Email verified successfully" };
    } catch (error) {
      console.error("Verify email error:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Email verification failed");
    }
  }
);

// Resend verification code
exports.resendVerificationCode = onCall(
  {
    secrets: [emailUser, emailPassword, appUrl],
    maxInstances: 40,
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      const { email } = request.data;

      if (!email) {
        throw new HttpsError("invalid-argument", "Email is required");
      }

      // Get existing verification data
      const verificationDoc = await admin
        .firestore()
        .collection("verificationCodes")
        .doc(email)
        .get();

      if (!verificationDoc.exists) {
        throw new HttpsError(
          "not-found",
          "No verification request found for this email"
        );
      }

      const verificationData = verificationDoc.data();

      // Check if already verified
      if (verificationData.verified) {
        throw new HttpsError("already-exists", "Email already verified");
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode();
      const verificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Update verification code in Firestore
      await admin
        .firestore()
        .collection("verificationCodes")
        .doc(email)
        .update({
          code: verificationCode,
          expires: verificationExpires,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Load verification email template
      const verificationEmailHtml = await loadEmailTemplate("verification", {
        USER_NAME: verificationData.name,
        VERIFICATION_CODE: verificationCode,
        VERIFICATION_LINK: `${appUrl.value()}/confirm-email?code=${verificationCode}&email=${encodeURIComponent(
          email
        )}`,
        UNSUBSCRIBE_LINK: `${appUrl.value()}/unsubscribe`,
        PRIVACY_LINK: `${appUrl.value()}/privacy-policy`,
      });

      // Send verification email
      await getTransporter().sendMail({
        from: `"Groupify Team" <${emailUser.value()}>`,
        to: email,
        subject: "Verify Your Email - Groupify (Resent)",
        html: verificationEmailHtml,
      });

      console.log(`Verification email resent to: ${email}`);
      return { success: true, message: "Verification email resent" };
    } catch (error) {
      console.error("Resend verification error:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Failed to resend verification email");
    }
  }
);

// Enable Google Auth
exports.enableGoogleAuth = onCall(async (request) => {
  try {
    const { uid, email, displayName, } = request.data;

    if (!uid || !email) {
      throw new HttpsError("invalid-argument", "UID and email are required");
    }

    // Mark email as verified for Google users
    await admin
      .firestore()
      .collection("verificationCodes")
      .doc(email)
      .set({
        verified: true,
        email: email,
        name: displayName || "Google User",
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        provider: "google",
      });

    return { success: true, message: "Google auth enabled" };
  } catch (error) {
    console.error("Google auth error:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to enable Google auth");
  }
});

// ============ NEW PASSWORD RESET FUNCTIONS ============

// Check if user exists
exports.checkUserExists = onCall(async (request) => {
  try {
    const { email } = request.data;

    if (!email) {
      throw new HttpsError("invalid-argument", "Email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError("invalid-argument", "Invalid email format");
    }

    try {
      // Check if user exists in Firebase Auth
      const userRecord = await admin.auth().getUserByEmail(email);
      console.log(`User found: ${email}`);
      return { exists: true };
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        console.log(`User not found: ${email}`);
        return { exists: false };
      }
      throw error;
    }
  } catch (error) {
    console.error("Check user exists error:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to check user existence");
  }
});

// Send password reset email
exports.sendPasswordResetEmail = onCall(
  {
    secrets: [emailUser, emailPassword, appUrl],
    maxInstances: 40,
    timeoutSeconds: 60,
  },
  async (request) => {
    console.log("sendPasswordResetEmail function called");

    try {
      const { email } = request.data;

      console.log(`Processing password reset for: ${email}`);

      if (!email) {
        throw new HttpsError("invalid-argument", "Email is required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new HttpsError("invalid-argument", "Invalid email format");
      }

      // Check if user exists
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          throw new HttpsError(
            "not-found",
            "No account found with this email address"
          );
        }
        throw error;
      }

      // Check for rate limiting (optional - limit reset requests)
      const resetDoc = await admin
        .firestore()
        .collection("passwordResets")
        .doc(email)
        .get();
      if (resetDoc.exists) {
        const resetData = resetDoc.data();
        const timeSinceLastRequest = Date.now() - resetData.lastRequest;
        const cooldownPeriod = 2 * 60 * 1000; // 2 minutes

        if (timeSinceLastRequest < cooldownPeriod) {
          throw new HttpsError(
            "resource-exhausted",
            "Please wait before requesting another password reset"
          );
        }
      }

      // Generate secure reset token
      const resetToken = generateResetToken();
      const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      const resetUrl = `${appUrl.value()}/reset-password?token=${resetToken}&email=${encodeURIComponent(
        email
      )}`;

      console.log(`Generated reset token for: ${email}`);

      // Store reset token in Firestore
      await admin.firestore().collection("passwordResets").doc(email).set({
        token: resetToken,
        expires: resetExpires,
        email: email,
        used: false,
        lastRequest: Date.now(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("Password reset token stored in Firestore");

      // Load reset email template
      const resetEmailHtml = await loadEmailTemplate("resetpassword", {
        RESET_URL: resetUrl,
        USER_EMAIL: email,
        EMAIL: email,
        TOKEN: resetToken,
        SUPPORT_URL: `${appUrl.value()}/support`,
        CONTACT_URL: `${appUrl.value()}/contact`,
        PRIVACY_URL: `${appUrl.value()}/privacy-policy`,
      });

      console.log("Reset email template loaded");

      // Send reset email
      const transporter = getTransporter();

      const mailOptions = {
        from: `"Groupify Team" <${emailUser.value()}>`,
        to: email,
        subject: "Reset Your Groupify Password",
        html: resetEmailHtml,
      };

      console.log("Attempting to send reset email...");
      await transporter.sendMail(mailOptions);

      console.log(`Password reset email sent successfully to: ${email}`);
      return { success: true, message: "Password reset email sent" };
    } catch (error) {
      console.error("Send password reset error:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      // Handle specific nodemailer errors
      if (error.code === "EAUTH") {
        throw new HttpsError(
          "internal",
          "Email authentication failed. Please check email credentials."
        );
      }

      throw new HttpsError(
        "internal",
        "Failed to send password reset email: " + error.message
      );
    }
  }
);

// Verify reset token (for when user clicks the reset link)
exports.verifyResetToken = onCall(async (request) => {
  try {
    const { email, token } = request.data;

    if (!email || !token) {
      throw new HttpsError("invalid-argument", "Email and token are required");
    }

    // Get reset token from Firestore
    const resetDoc = await admin
      .firestore()
      .collection("passwordResets")
      .doc(email)
      .get();

    if (!resetDoc.exists) {
      throw new HttpsError("not-found", "Reset token not found");
    }

    const resetData = resetDoc.data();

    // Check if token has been used
    if (resetData.used) {
      throw new HttpsError(
        "permission-denied",
        "Reset token has already been used"
      );
    }

    // Check if token matches
    if (resetData.token !== token) {
      throw new HttpsError("permission-denied", "Invalid reset token");
    }

    // Check if token has expired
    if (Date.now() > resetData.expires) {
      throw new HttpsError("deadline-exceeded", "Reset token has expired");
    }

    console.log(`Reset token verified for: ${email}`);
    return { success: true, message: "Reset token is valid" };
  } catch (error) {
    console.error("Verify reset token error:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to verify reset token");
  }
});

// Reset password (final step)
exports.resetPassword = onCall(async (request) => {
  try {
    const { email, token, newPassword } = request.data;

    if (!email || !token || !newPassword) {
      throw new HttpsError(
        "invalid-argument",
        "Email, token, and new password are required"
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      throw new HttpsError(
        "invalid-argument",
        "Password must be at least 6 characters long"
      );
    }

    // Get and verify reset token
    const resetDoc = await admin
      .firestore()
      .collection("passwordResets")
      .doc(email)
      .get();

    if (!resetDoc.exists) {
      throw new HttpsError("not-found", "Reset token not found");
    }

    const resetData = resetDoc.data();

    if (resetData.used) {
      throw new HttpsError(
        "permission-denied",
        "Reset token has already been used"
      );
    }

    if (resetData.token !== token) {
      throw new HttpsError("permission-denied", "Invalid reset token");
    }

    if (Date.now() > resetData.expires) {
      throw new HttpsError("deadline-exceeded", "Reset token has expired");
    }

    // Get user and update password
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    });

    // Mark token as used
    await admin.firestore().collection("passwordResets").doc(email).update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Password reset successfully for: ${email}`);
    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Reset password error:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Failed to reset password");
  }
});
