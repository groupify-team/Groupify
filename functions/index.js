const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { defineString } = require("firebase-functions/params");

// Initialize Firebase Admin
admin.initializeApp();

// Define config parameters - these will use Firebase secrets
const emailUser = defineString("EMAIL_USER");
const emailPassword = defineString("EMAIL_PASSWORD");
const appUrl = defineString("APP_URL");

// Configure email transporter with better error handling
function getTransporter() {
  try {
    console.log("Creating email transporter...");
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

// Email template loader with fallback
async function loadEmailTemplate(templateName, variables) {
  try {
    const templatePath = path.join(
      __dirname,
      "email-templates",
      `${templateName}.html`
    );

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      console.warn(`Template ${templateName}.html not found, using fallback`);
      return getFallbackTemplate(templateName, variables);
    }

    let template = fs.readFileSync(templatePath, "utf8");

    // Replace variables
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      template = template.replace(regex, variables[key]);
    });

    return template;
  } catch (error) {
    console.error("Email template error:", error);
    return getFallbackTemplate(templateName, variables);
  }
}

// Fallback templates
function getFallbackTemplate(templateName, variables) {
  if (templateName === "verification") {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to Groupify!</h1>
        <p>Hi ${variables.USER_NAME},</p>
        <p>Your verification code is:</p>
        <h2 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${variables.VERIFICATION_CODE}</h2>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">© 2025 Groupify. All rights reserved.</p>
      </div>
    `;
  } else if (templateName === "welcome") {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to Groupify!</h1>
        <p>Hi ${variables.USER_NAME},</p>
        <p>Your email has been verified successfully!</p>
        <p>You can now sign in and start organizing your travel photos.</p>
        <a href="${variables.DASHBOARD_LINK}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Go to Dashboard</a>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">© 2025 Groupify. All rights reserved.</p>
      </div>
    `;
  }
  return "<p>Email content</p>";
}

// Generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email with detailed error handling
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
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

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

      // Mark email as verified
      await admin
        .firestore()
        .collection("verificationCodes")
        .doc(email)
        .update({
          verified: true,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Send welcome email
      try {
        const welcomeEmailHtml = await loadEmailTemplate("welcome", {
          USER_NAME: verificationData.name,
          DASHBOARD_LINK: `${appUrl.value()}/dashboard`,
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
          subject: "Welcome to Groupify! 🎉",
          html: welcomeEmailHtml,
        });
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
        subject: "Verify Your Email - Groupify",
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
