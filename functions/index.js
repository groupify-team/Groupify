const {onRequest} = require('firebase-functions/v2/https');
const {setGlobalOptions} = require('firebase-functions/v2');
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const cors = require("cors")({
  origin: [
    "http://localhost:5173",
    "https://groupify-77202.web.app",
    "https://groupify-77202.firebaseapp.com",
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});
const axios = require("axios");

admin.initializeApp();

// Set global options for all functions in this file
setGlobalOptions({
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 300
});

// Send Verification Email Function (Gen 2 HTTP)
exports.sendVerificationEmail = onRequest({
  memory: "256MiB",
  timeoutSeconds: 60,
  secrets: ["EMAIL_USER", "EMAIL_PASSWORD", "APP_URL"]
}, async (req, res) => {
  return cors(req, res, async () => {  
    console.log("sendVerificationEmail function called");

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { email, name } = req.body.data || req.body;

    if (!email || !name) {
      res.status(400).json({
        success: false,
        message: "Email and name are required"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
      return;
    }

    try {
      // Check if user exists
      let user;
      try {
        user = await admin.auth().getUserByEmail(email);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          res.status(404).json({
            success: false,
            message: "User not found"
          });
          return;
        }
        throw error;
      }

      // Check if email is already verified
      if (user.emailVerified) {
        res.status(200).json({
          success: true,
          message: "Email is already verified"
        });
        return;
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store verification code in Firestore
      await admin.firestore().collection('verificationCodes').doc(email).set({
        code: verificationCode,
        email: email,
        name: name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false,
        verified: false
      });

      // Create email transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
        authMethod: 'PLAIN'
      });

      // Email template
      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px; text-align: center; }
            .code { background: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #1e293b; margin: 20px 0; letter-spacing: 4px; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Groupify!</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Verify your email to get started</p>
            </div>
            <div class="content">
              <h2>Hi ${name}!</h2>
              <p>Thanks for joining Groupify! Please verify your email address using the code below:</p>
              <div class="code">${verificationCode}</div>
              <p>Or click the button below to verify automatically:</p>
              <a href="${process.env.APP_URL}/confirm-email?code=${verificationCode}&email=${encodeURIComponent(email)}" class="button">Verify Email</a>
              <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
            </div>
            <div class="footer">
              <strong>Groupify Team</strong><br>
              If you didn't create this account, please ignore this email.
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email
      const mailOptions = {
        from: `"Groupify Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🎉 Welcome to Groupify! Verify your email",
        html: htmlTemplate,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to: ${email}`);

      res.status(200).json({
        success: true,
        message: "Verification email sent successfully"
      });

    } catch (error) {
      console.error("Send verification email error:", error);
      res.status(500).json({
        success: false,
        message: `Failed to send verification email: ${error.message}`
      });
    }
  });
});

// Resend Verification Code (Gen 2 HTTP)
exports.resendVerificationCode = onRequest({
  memory: "256MiB",
  timeoutSeconds: 60,
  secrets: ["EMAIL_USER", "EMAIL_PASSWORD"]
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("resendVerificationCode function called");

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { email } = req.body.data || req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
      return;
    }

    try {
      // Check if user exists
      let user;
      try {
        user = await admin.auth().getUserByEmail(email);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          res.status(404).json({
            success: false,
            message: "User not found"
          });
          return;
        }
        throw error;
      }

      // Check if email is already verified
      if (user.emailVerified) {
        res.status(200).json({
          success: true,
          message: "Email is already verified"
        });
        return;
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store verification code in Firestore (overwrite existing)
      await admin.firestore().collection('verificationCodes').doc(email).set({
        code: verificationCode,
        email: email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false
      });

      // Create email transporter with better Gmail configuration
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
        authMethod: 'PLAIN'
      });

      // Email template
      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px; text-align: center; }
            .code { background: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #1e293b; margin: 20px 0; letter-spacing: 4px; }
            .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Email Verification - Groupify</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Verify your email to continue</p>
            </div>
            <div class="content">
              <h2>Your Verification Code</h2>
              <p>Enter this code to verify your email address:</p>
              <div class="code">${verificationCode}</div>
              <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
            </div>
            <div class="footer">
              <strong>Groupify Team</strong><br>
              If you didn't request this verification, please ignore this email.
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email
      const mailOptions = {
        from: `"Groupify Verification" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🔐 Email Verification Code - Groupify",
        html: htmlTemplate,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Verification code resent to: ${email}`);

      res.status(200).json({
        success: true,
        message: "Verification code sent successfully"
      });

    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({
        success: false,
        message: `Failed to resend verification code: ${error.message}`
      });
    }
  });
});

// Send Password Reset Email Function (Gen 2 HTTP)
exports.sendPasswordResetEmail = onRequest({
  memory: "256MiB",
  timeoutSeconds: 60,
  secrets: ["EMAIL_USER", "EMAIL_PASSWORD", "APP_URL"]
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("sendPasswordResetEmail function called");

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { email } = req.body.data || req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
      return;
    }

    try {
      // Check if user exists first
      let user;
      try {
        user = await admin.auth().getUserByEmail(email);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          res.status(404).json({
            success: false,
            message: "No user found with this email address"
          });
          return;
        }
        throw error;
      }

      // Generate reset token (similar to verification code)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Store reset token in Firestore
      await admin.firestore().collection('passwordResets').doc(email).set({
        token: resetToken,
        email: email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        used: false
      });

      // Create email transporter (same as verification email)
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
        authMethod: 'PLAIN'
      });

      // Email template (similar to verification email style)
      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px; text-align: center; }
            .button { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; border: 2px solid #4f46e5; }
            .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reset Your Password - Groupify</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Reset your password to regain access</p>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${process.env.APP_URL}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}" class="button" style="color: #ffffff !important; text-decoration: none; font-weight: bold;">Reset Password</a>
              <p style="color: #6b7280;">This link will expire in 1 hour.</p>
              <p style="color: #6b7280; font-size: 14px;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <strong>Groupify Team</strong><br>
              If you didn't request this password reset, please ignore this email.
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email
      const mailOptions = {
        from: `"Groupify Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🔐 Reset Your Password - Groupify",
        html: htmlTemplate,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to: ${email}`);

      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully"
      });

    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({
        success: false,
        message: `Failed to send password reset email: ${error.message}`
      });
    }
  });
});

// Verify Reset Token Function (Gen 2 HTTP)
exports.verifyResetToken = onRequest({
  memory: "256MiB",
  timeoutSeconds: 60
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("verifyResetToken function called");

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { email, token } = req.body.data || req.body;

    if (!email || !token) {
      res.status(400).json({
        success: false,
        message: "Email and token are required"
      });
      return;
    }

    try {
      const doc = await admin.firestore().collection('passwordResets').doc(email).get();

      if (!doc.exists) {
        res.status(404).json({
          success: false,
          message: "Reset token not found"
        });
        return;
      }

      const { token: storedToken, expiresAt, used } = doc.data();

      if (used) {
        res.status(412).json({
          success: false,
          message: "Reset token already used"
        });
        return;
      }

      if (new Date() > expiresAt.toDate()) {
        res.status(410).json({
          success: false,
          message: "Reset token expired"
        });
        return;
      }

      if (token !== storedToken) {
        res.status(400).json({
          success: false,
          message: "Invalid reset token"
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Reset token is valid"
      });

    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({
        success: false,
        message: `Token verification failed: ${error.message}`
      });
    }
  });
});

// Reset Password Function (Gen 2 HTTP)
exports.resetPassword = onRequest({
  memory: "256MiB",
  timeoutSeconds: 60
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("resetPassword function called");

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { email, token, newPassword } = req.body.data || req.body;

    if (!email || !token || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Email, token, and new password are required"
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
      return;
    }

    try {
      // Verify token first
      const doc = await admin.firestore().collection('passwordResets').doc(email).get();
      if (!doc.exists) {
        res.status(404).json({ success: false, message: "Reset token not found" });
        return;
      }
      const { token: storedToken, expiresAt, used } = doc.data();
      if (used) {
        res.status(412).json({ success: false, message: "Reset token already used" });
        return;
      }
      if (new Date() > expiresAt.toDate()) {
        res.status(410).json({ success: false, message: "Reset token expired" });
        return;
      }
      if (token !== storedToken) {
        res.status(400).json({ success: false, message: "Invalid reset token" });
        return;
      }

      // Update user password
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(user.uid, {
        password: newPassword
      });

      // Mark token as used
      await admin.firestore().collection('passwordResets').doc(email).update({
        used: true
      });

      res.status(200).json({
        success: true,
        message: "Password reset successfully"
      });

    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({
        success: false,
        message: `Password reset failed: ${error.message}`
      });
    }
  });
});

// Verify Email Code Function (Gen 2 HTTP)
exports.verifyEmailCode = onRequest({
  memory: "256MiB",
  timeoutSeconds: 60
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("verifyEmailCode function called");

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { email, verificationCode } = req.body.data || req.body;

    if (!email || !verificationCode) {
      res.status(400).json({
        success: false,
        message: "Email and verification code are required"
      });
      return;
    }

    try {
      // Get verification code from Firestore
      const doc = await admin.firestore()
        .collection('verificationCodes')
        .doc(email)
        .get();

      if (!doc.exists) {
        res.status(404).json({
          success: false,
          message: "Verification code not found or expired"
        });
        return;
      }

      const docData = doc.data();
      const { code, expiresAt, used } = docData;

      // Check if code is already used
      if (used) {
        res.status(412).json({
          success: false,
          message: "Verification code has already been used"
        });
        return;
      }

      // Check if code is expired
      if (new Date() > expiresAt.toDate()) {
        res.status(410).json({
          success: false,
          message: "Verification code has expired. Please request a new one."
        });
        return;
      }

      // Check if code matches
      if (code !== verificationCode) {
        res.status(400).json({
          success: false,
          message: "Invalid verification code"
        });
        return;
      }

      // Mark user as verified in Firebase Auth
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(user.uid, {
        emailVerified: true
      });

      // Mark verification code as used
      await admin.firestore()
        .collection('verificationCodes')
        .doc(email)
        .update({ used: true });

      console.log(`Email verified successfully for: ${email}`);

      res.status(200).json({
        success: true,
        message: "Email verified successfully"
      });

    } catch (error) {
      console.error("Error verifying email code:", error);
      res.status(500).json({
        success: false,
        message: `Verification failed: ${error.message}`
      });
    }
  });
});

// Enable Google Auth Function (Gen 2 HTTP)
exports.enableGoogleAuth = onRequest({
  memory: "256MiB",
  timeoutSeconds: 60
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("enableGoogleAuth function called");

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { uid, email, displayName, photoURL } = req.body.data || req.body;

    if (!uid || !email) {
      res.status(400).json({
        success: false,
        message: "UID and email are required"
      });
      return;
    }

    try {
      // Update user in Firebase Auth to mark email as verified
      await admin.auth().updateUser(uid, {
        emailVerified: true,
        displayName: displayName,
        photoURL: photoURL
      });

      console.log(`Google auth enabled for user: ${email}`);

      res.status(200).json({
        success: true,
        message: "Google authentication enabled"
      });

    } catch (error) {
      console.error("Error enabling Google auth:", error);
      res.status(500).json({
        success: false,
        message: `Failed to enable Google auth: ${error.message}`
      });
    }
  });
});

// Send Contact Email Function (Gen 2 HTTP) - FIXED
exports.sendContactEmail = onRequest({
  memory: "512MiB",
  timeoutSeconds: 60,
  secrets: ["EMAIL_USER", "EMAIL_PASSWORD"]
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("sendContactEmail called with data:", req.body.data);

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Validate input data
    if (!req.body || typeof req.body.data !== "object") {
      res.status(400).json({
        success: false,
        message: "Request data must be an object"
      });
      return;
    }

    const { name, email, subject, message, category } = req.body.data;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: name, email, subject, message"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
      return;
    }

    // Simple HTML template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .field { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5; }
          .field-label { font-weight: bold; color: #4a5568; font-size: 14px; margin-bottom: 5px; text-transform: uppercase; }
          .field-value { color: #2d3748; font-size: 16px; line-height: 1.5; }
          .message-box { background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
          .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; font-size: 14px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📸 New Contact Message - Groupify</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">You have received a new message from your website</p>
          </div>

          <div class="content">
            <div class="field">
              <div class="field-label">From</div>
              <div class="field-value">${name} &lt;${email}&gt;</div>
            </div>

            <div class="field">
              <div class="field-label">Category</div>
              <div class="field-value">${(category || "general").charAt(0).toUpperCase() + (category || "general").slice(1)}</div>
            </div>

            <div class="field">
              <div class="field-label">Subject</div>
              <div class="field-value">${subject}</div>
            </div>

            <div class="field">
              <div class="field-label">Message</div>
              <div class="field-value message-box">${message.replace(/\n/g, "<br>")}</div>
            </div>

            <div style="background: #e6fffa; padding: 15px; border-radius: 8px; border: 1px solid #81e6d9; margin-top: 20px;">
              <strong>⏰ Received:</strong> ${new Date().toLocaleString()}
            </div>
          </div>

          <div class="footer">
            <strong>Groupify Support System</strong><br>
            This message was automatically generated from the contact form.<br>
            © 2025 Groupify. Made with ❤️ for photo lovers.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Create transporter with better Gmail configuration
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
        authMethod: 'PLAIN'
      });

      // Test the transporter first
      console.log("Testing email transporter...");
      await transporter.verify();
      console.log("Email transporter verified successfully");

      const mailOptions = {
        from: `"Groupify Contact Form" <${process.env.EMAIL_USER}>`,
        to: "groupify.ltd@gmail.com",
        subject: `🎫 New Contact Form: ${subject}`,
        html: htmlTemplate,
        replyTo: email,
      };

      console.log("Sending email...");
      const result = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);

      res.status(200).json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      });
    } catch (error) {
      console.error("Email sending error:", error);

      // Provide specific error messages
      let errorMessage = `Failed to send email: ${error.message}`;
      if (error.code === "EAUTH" || error.responseCode === 535) {
        errorMessage = "Email authentication failed. Please check email credentials.";
      } else if (error.code === "ECONNECTION") {
        errorMessage = "Could not connect to email server. Please try again later.";
      }

      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  });
});

// Send Job Application Email Function (Gen 2 HTTP) - FIXED
exports.sendJobApplicationEmail = onRequest({
  memory: "512MiB",
  timeoutSeconds: 60,
  secrets: ["EMAIL_USER", "EMAIL_PASSWORD"]
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("sendJobApplicationEmail called with data:", req.body.data);

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      experience,
      coverLetter,
      portfolio,
      availableDate,
      position,
      department,
      cvFile,
    } = req.body.data || req.body;

    if (!firstName || !lastName || !email || !position) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName, email, position"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
      return;
    }

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
          .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .field { margin-bottom: 15px; display: flex; }
          .field-label { font-weight: bold; color: #374151; min-width: 140px; font-size: 14px; }
          .field-value { color: #4b5563; flex: 1; }
          .cover-letter { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0; white-space: pre-wrap; border-left: 4px solid #6366f1; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💼 New Job Application - Groupify</h1>
            <p style="color: rgba(255,255,255,0.8);">Someone applied for a position at your company!</p>
          </div>
          <div class="content">
            <h2>Applied for: ${position}</h2>
            <div class="field">
              <div class="field-label">Full Name:</div>
              <div class="field-value"><strong>${firstName} ${lastName}</strong></div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value">${email}</div>
            </div>
            <div class="field">
              <div class="field-label">Phone:</div>
              <div class="field-value">${phone || "Not provided"}</div>
            </div>
            <div class="field">
              <div class="field-label">Experience:</div>
              <div class="field-value">${experience || "Not specified"}</div>
            </div>
            <div class="field">
              <div class="field-label">Portfolio:</div>
              <div class="field-value">${portfolio || "Not provided"}</div>
            </div>
            <div class="field">
              <div class="field-label">Available From:</div>
              <div class="field-value">${availableDate || "Not specified"}</div>
            </div>
            ${coverLetter ? `
            <div>
              <h3>📝 Cover Letter</h3>
              <div class="cover-letter">${coverLetter}</div>
            </div>
            ` : ''}
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #3b82f6; margin-top: 20px;">
              <strong>⏰ Applied on:</strong> ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Create transporter with better Gmail configuration
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
        authMethod: 'PLAIN'
      });

      const mailOptions = {
        from: `"Groupify Careers" <${process.env.EMAIL_USER}>`,
        to: "groupify.ltd@gmail.com",
        subject: `🎯 New Application: ${position} - ${firstName} ${lastName}`,
        html: htmlTemplate,
        replyTo: email,
      };

      if (cvFile) {
        mailOptions.attachments = [
          {
            filename: `${firstName}_${lastName}_CV.pdf`,
            content: cvFile,
            encoding: "base64",
          },
        ];
      }

      const result = await transporter.sendMail(mailOptions);
      console.log("Job application email sent successfully:", result.messageId);

      res.status(200).json({
        success: true,
        message: "Application submitted successfully",
        messageId: result.messageId,
      });
    } catch (error) {
      console.error("Job application email error:", error);
      res.status(500).json({
        success: false,
        message: `Failed to submit application: ${error.message}`
      });
    }
  });
});

// Check Email Verification Function (Gen 2 HTTP)
exports.checkEmailVerification = onRequest({
  memory: "128MiB",
  timeoutSeconds: 30
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("checkEmailVerification function called");

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { email } = req.body.data || req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required"
      });
      return;
    }

    try {
      const user = await admin.auth().getUserByEmail(email);

      res.status(200).json({
        success: true,
        emailVerified: user.emailVerified,
        message: user.emailVerified ? "Email is verified" : "Email is not verified"
      });

    } catch (error) {
      console.error("Error checking email verification:", error);
      res.status(500).json({
        success: false,
        message: `Failed to check email verification: ${error.message}`
      });
    }
  });
});

// Check User Exists Function (Gen 2 HTTP)
exports.checkUserExists = onRequest({
  memory: "128MiB",
  timeoutSeconds: 30
}, async (req, res) => {
  return cors(req, res, async () => {
    console.log("checkUserExists function called");

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { email } = req.body.data || req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email is required"
      });
      return;
    }

    try {
      await admin.auth().getUserByEmail(email);

      res.status(200).json({
        success: true,
        exists: true,
        message: "User exists"
      });

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        res.status(200).json({
          success: true,
          exists: false,
          message: "User does not exist"
        });
        return;
      }

      console.error("Error checking user exists:", error);
      res.status(500).json({
        success: false,
        message: `Failed to check user existence: ${error.message}`
      });
    }
  });
});