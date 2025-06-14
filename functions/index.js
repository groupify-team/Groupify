const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { defineSecret } = require("firebase-functions/params");

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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5;">Welcome to Groupify!</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${variables.USER_NAME},</p>
          <p style="margin-bottom: 30px;">Please verify your email address by entering this code:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px; margin: 0;">${variables.VERIFICATION_CODE}</h2>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <a href="${variables.VERIFICATION_LINK}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Verify Email</a>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          If you didn't request this, please ignore this email.<br>
          © 2025 Groupify. All rights reserved.
        </p>
      </div>
    `;
  } else if (templateName === "welcome") {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5;">Welcome to Groupify! 🎉</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${variables.USER_NAME},</p>
          <p style="margin-bottom: 20px;">Your email has been verified successfully! Welcome to the Groupify community.</p>
          <p style="margin-bottom: 30px;">You can now sign in and start organizing your travel photos with our AI-powered face recognition technology.</p>
          <div style="text-align: center;">
            <a href="${variables.DASHBOARD_LINK}" style="display: inline-block; background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
          </div>
        </div>
        <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px;">
          <h3 style="color: #1976d2; margin-bottom: 15px;">Get Started:</h3>
          <ul style="color: #555; line-height: 1.6;">
            <li>Upload your travel photos</li>
            <li>Let our AI identify faces automatically</li>
            <li>Create albums and share with friends</li>
            <li>Never lose track of your memories again!</li>
          </ul>
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          © 2025 Groupify. All rights reserved.
        </p>
      </div>
    `;
  }
  return "<p>Email content</p>";
}

// Generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    const { uid, email, displayName, photoURL } = request.data;

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
