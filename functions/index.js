const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cors = require("cors")({
  origin: [
    "http://localhost:5173",
    "https://groupify-77202.web.app",
    "https://groupify-77202.firebaseapp.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
});
admin.initializeApp();

// Send Contact Email Function (Gen 2 HTTP)
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

// Add these missing functions to your index.js file:

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

// Send Job Application Email Function (Gen 2 HTTP)
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

// Enhanced plan limits validation
const PLAN_LIMITS = {
  free: {
    events: 5,
    photosPerEvent: 30,
    membersPerEvent: 5,
    storageGB: 2,
    storageBytes: 2 * 1024 * 1024 * 1024,
  },
  premium: {
    events: 50,
    photosPerEvent: 200,
    membersPerEvent: 20,
    storageGB: 50,
    storageBytes: 50 * 1024 * 1024 * 1024,
  },
  pro: {
    events: "unlimited",
    photosPerEvent: "unlimited",
    membersPerEvent: "unlimited",
    storageGB: 500,
    storageBytes: 500 * 1024 * 1024 * 1024,
  },
  enterprise: {
    events: "unlimited",
    photosPerEvent: "unlimited",
    membersPerEvent: "unlimited",
    storageGB: "unlimited",
    storageBytes: Number.MAX_SAFE_INTEGER,
  },
};

// Utility function to get user's plan
async function getUserPlan(userId) {
  try {
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    if (!userDoc.exists) {
      return "free"; // Default plan
    }

    const userData = userDoc.data();
    return userData.subscription?.plan || "free";
  } catch (error) {
    console.error("Error getting user plan:", error);
    return "free"; // Default to free on error
  }
}

// Utility function to get user's current usage
async function getUserUsage(userId) {
  try {
    // Get event count
    const eventsQuery = await admin
      .firestore()
      .collection("events")
      .where("members", "array-contains", userId)
      .get();

    const eventCount = eventsQuery.size;

    // Get total photos and storage usage
    let totalPhotos = 0;
    let totalStorage = 0;

    const batch = admin.firestore().batch();

    for (const eventDoc of eventsQuery.docs) {
      const photosQuery = await admin
        .firestore()
        .collection("events")
        .doc(eventDoc.id)
        .collection("photos")
        .get();

      totalPhotos += photosQuery.size;

      // Calculate storage from photos
      photosQuery.docs.forEach((photoDoc) => {
        const photoData = photoDoc.data();
        totalStorage += photoData.size || 0;
      });
    }

    return {
      events: eventCount,
      photos: totalPhotos,
      storage: totalStorage,
    };
  } catch (error) {
    console.error("Error getting user usage:", error);
    return { events: 0, photos: 0, storage: 0 };
  }
}

// Enhanced photo upload validation function
exports.validatePhotoUpload = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const {
        userId,
        eventId,
        photoCount = 1,
        totalFileSize = 0,
      } = req.body.data || req.body;

      if (!userId || !eventId) {
        res.status(400).json({
          success: false,
          message: "User ID and Event ID are required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get event data to check current photo count
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const eventData = eventDoc.data();
        const currentEventPhotos = eventData.photoCount || 0;

        // Check per-event photo limit
        if (planLimits.photosPerEvent !== "unlimited") {
          if (currentEventPhotos + photoCount > planLimits.photosPerEvent) {
            res.status(403).json({
              success: false,
              message: `Event photo limit exceeded! Your ${userPlan} plan allows ${planLimits.photosPerEvent} photos per event. This event currently has ${currentEventPhotos} photos.`,
              errorCode: "EVENT_PHOTO_LIMIT_EXCEEDED",
              currentUsage: currentEventPhotos,
              limit: planLimits.photosPerEvent,
              plan: userPlan,
            });
            return;
          }
        }

        // Check storage limit
        if (planLimits.storageBytes !== Number.MAX_SAFE_INTEGER) {
          const userUsage = await getUserUsage(userId);
          const newStorageUsed = userUsage.storage + totalFileSize;

          if (newStorageUsed > planLimits.storageBytes) {
            res.status(403).json({
              success: false,
              message: `Storage limit exceeded! Your ${userPlan} plan allows ${
                planLimits.storageGB
              }GB of storage. You've used ${(
                userUsage.storage /
                (1024 * 1024 * 1024)
              ).toFixed(2)}GB.`,
              errorCode: "STORAGE_LIMIT_EXCEEDED",
              currentUsage: userUsage.storage,
              limit: planLimits.storageBytes,
              plan: userPlan,
            });
            return;
          }
        }

        // Validation passed
        res.status(200).json({
          success: true,
          message: "Photo upload validation passed",
          remainingPhotos:
            planLimits.photosPerEvent === "unlimited"
              ? "unlimited"
              : planLimits.photosPerEvent - currentEventPhotos,
          remainingStorage:
            planLimits.storageBytes === Number.MAX_SAFE_INTEGER
              ? "unlimited"
              : planLimits.storageBytes - (await getUserUsage(userId)).storage,
        });
      } catch (error) {
        console.error("Error validating photo upload:", error);
        res.status(500).json({
          success: false,
          message: `Validation failed: ${error.message}`,
        });
      }
    });
  }
);

// Enhanced member invitation validation function
exports.validateMemberInvitation = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { userId, eventId, inviteeCount = 1 } = req.body.data || req.body;

      if (!userId || !eventId) {
        res.status(400).json({
          success: false,
          message: "User ID and Event ID are required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get event data to check current member count
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const eventData = eventDoc.data();
        const currentMembers = eventData.members || [];
        const currentMemberCount = currentMembers.length;

        // Check member limit
        if (planLimits.membersPerEvent !== "unlimited") {
          if (currentMemberCount + inviteeCount > planLimits.membersPerEvent) {
            res.status(403).json({
              success: false,
              message: `Member limit exceeded! Your ${userPlan} plan allows ${planLimits.membersPerEvent} members per event. This event currently has ${currentMemberCount} members.`,
              errorCode: "MEMBER_LIMIT_EXCEEDED",
              currentUsage: currentMemberCount,
              limit: planLimits.membersPerEvent,
              plan: userPlan,
            });
            return;
          }
        }

        // Validation passed
        res.status(200).json({
          success: true,
          message: "Member invitation validation passed",
          remainingSlots:
            planLimits.membersPerEvent === "unlimited"
              ? "unlimited"
              : planLimits.membersPerEvent - currentMemberCount,
        });
      } catch (error) {
        console.error("Error validating member invitation:", error);
        res.status(500).json({
          success: false,
          message: `Validation failed: ${error.message}`,
        });
      }
    });
  }
);

// Enhanced event creation validation function
exports.validateEventCreation = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { userId } = req.body.data || req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "User ID is required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get user's current event count
        const userUsage = await getUserUsage(userId);
        const currentEventCount = userUsage.events;

        // Check event limit
        if (planLimits.events !== "unlimited") {
          if (currentEventCount >= planLimits.events) {
            res.status(403).json({
              success: false,
              message: `Event limit reached! Your ${userPlan} plan allows ${planLimits.events} events. You currently have ${currentEventCount} events.`,
              errorCode: "EVENT_LIMIT_EXCEEDED",
              currentUsage: currentEventCount,
              limit: planLimits.events,
              plan: userPlan,
            });
            return;
          }
        }

        // Validation passed
        res.status(200).json({
          success: true,
          message: "Event creation validation passed",
          remainingEvents:
            planLimits.events === "unlimited"
              ? "unlimited"
              : planLimits.events - currentEventCount,
        });
      } catch (error) {
        console.error("Error validating event creation:", error);
        res.status(500).json({
          success: false,
          message: `Validation failed: ${error.message}`,
        });
      }
    });
  }
);

// Enhanced event invitation acceptance with plan validation
exports.acceptEventInvitation = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { invitationId, userId } = req.body.data || req.body;

      if (!invitationId || !userId) {
        res.status(400).json({
          success: false,
          message: "Invitation ID and user ID are required",
        });
        return;
      }

      try {
        // Get the invitation details
        const invitationDoc = await admin
          .firestore()
          .collection("eventInvitations")
          .doc(invitationId)
          .get();

        if (!invitationDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Invitation not found",
          });
          return;
        }

        const invitation = invitationDoc.data();

        // Check if invitation is still pending
        if (invitation.status !== "pending") {
          res.status(400).json({
            success: false,
            message: "Invitation is no longer pending",
          });
          return;
        }

        // Get user's plan and current usage
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
        const userUsage = await getUserUsage(userId);

        // Check if user has reached their event limit
        if (
          planLimits.events !== "unlimited" &&
          userUsage.events >= planLimits.events
        ) {
          res.status(403).json({
            success: false,
            message: `Event limit reached! Your ${userPlan} plan allows ${planLimits.events} events. You currently have ${userUsage.events} events. Upgrade your plan to accept more invitations.`,
            errorCode: "EVENT_LIMIT_EXCEEDED",
            currentEventCount: userUsage.events,
            eventLimit: planLimits.events,
            userPlan: userPlan,
          });
          return;
        }

        // Get the event to check member limits
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(invitation.eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const event = eventDoc.data();
        const currentMembers = event.members || [];

        // Check if user is already a member
        if (currentMembers.includes(userId)) {
          res.status(400).json({
            success: false,
            message: "User is already a member of this event",
          });
          return;
        }

        // Get event creator's plan to check member limits
        const eventCreatorPlan = await getUserPlan(event.createdBy);
        const eventPlanLimits =
          PLAN_LIMITS[eventCreatorPlan] || PLAN_LIMITS.free;

        // Check if adding this member would exceed the event's member limit
        if (
          eventPlanLimits.membersPerEvent !== "unlimited" &&
          currentMembers.length >= eventPlanLimits.membersPerEvent
        ) {
          res.status(403).json({
            success: false,
            message: `Cannot join event. The event creator's ${eventCreatorPlan} plan allows only ${eventPlanLimits.membersPerEvent} members per event.`,
            errorCode: "EVENT_MEMBER_LIMIT_EXCEEDED",
            currentMembers: currentMembers.length,
            memberLimit: eventPlanLimits.membersPerEvent,
            eventCreatorPlan: eventCreatorPlan,
          });
          return;
        }

        // Use a transaction to ensure data consistency
        await admin.firestore().runTransaction(async (transaction) => {
          // Add user to event members
          transaction.update(
            admin.firestore().collection("events").doc(invitation.eventId),
            {
              members: admin.firestore.FieldValue.arrayUnion(userId),
              memberCount: currentMembers.length + 1,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          );

          // Update invitation status
          transaction.update(
            admin.firestore().collection("eventInvitations").doc(invitationId),
            {
              status: "accepted",
              acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          );

          // Update user's event count in their profile
          transaction.update(
            admin.firestore().collection("users").doc(userId),
            {
              eventCount: userUsage.events + 1,
              lastEventJoined: admin.firestore.FieldValue.serverTimestamp(),
            }
          );
        });

        res.status(200).json({
          success: true,
          message: "Invitation accepted successfully",
          eventId: invitation.eventId,
          newEventCount: userUsage.events + 1,
        });
      } catch (error) {
        console.error("Error accepting event invitation:", error);
        res.status(500).json({
          success: false,
          message: `Failed to accept invitation: ${error.message}`,
        });
      }
    });
  }
);

// Enhanced photo upload with server-side validation
exports.uploadPhotoWithValidation = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 300,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { userId, eventId, photoData, fileName, fileSize } =
        req.body.data || req.body;

      if (!userId || !eventId || !photoData || !fileName) {
        res.status(400).json({
          success: false,
          message: "User ID, Event ID, photo data, and file name are required",
        });
        return;
      }

      try {
        // Get user's plan
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;

        // Get event data
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const eventData = eventDoc.data();

        // Check if user is a member of the event
        if (!eventData.members || !eventData.members.includes(userId)) {
          res.status(403).json({
            success: false,
            message: "User is not a member of this event",
          });
          return;
        }

        const currentEventPhotos = eventData.photoCount || 0;

        // Validate against per-event photo limit
        if (planLimits.photosPerEvent !== "unlimited") {
          if (currentEventPhotos >= planLimits.photosPerEvent) {
            res.status(403).json({
              success: false,
              message: `Event photo limit exceeded! Your ${userPlan} plan allows ${planLimits.photosPerEvent} photos per event.`,
              errorCode: "EVENT_PHOTO_LIMIT_EXCEEDED",
            });
            return;
          }
        }

        // Validate against storage limit
        if (planLimits.storageBytes !== Number.MAX_SAFE_INTEGER) {
          const userUsage = await getUserUsage(userId);
          const newStorageUsed = userUsage.storage + (fileSize || 0);

          if (newStorageUsed > planLimits.storageBytes) {
            res.status(403).json({
              success: false,
              message: `Storage limit exceeded! Your ${userPlan} plan allows ${planLimits.storageGB}GB of storage.`,
              errorCode: "STORAGE_LIMIT_EXCEEDED",
            });
            return;
          }
        }

        // Create photo document
        const photoRef = admin
          .firestore()
          .collection("events")
          .doc(eventId)
          .collection("photos")
          .doc();
        const photoId = photoRef.id;

        // In a real implementation, you would upload the photo to Firebase Storage here
        // For now, we'll just store metadata
        await admin.firestore().runTransaction(async (transaction) => {
          // Add photo document
          transaction.set(photoRef, {
            id: photoId,
            fileName: fileName,
            uploadedBy: userId,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            size: fileSize || 0,
            // In real implementation, add: storageUrl, thumbnailUrl, etc.
          });

          // Update event photo count
          transaction.update(
            admin.firestore().collection("events").doc(eventId),
            {
              photoCount: admin.firestore.FieldValue.increment(1),
              lastPhotoUpload: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
          );
        });

        res.status(200).json({
          success: true,
          message: "Photo uploaded successfully",
          photoId: photoId,
          newPhotoCount: currentEventPhotos + 1,
        });
      } catch (error) {
        console.error("Error uploading photo:", error);
        res.status(500).json({
          success: false,
          message: `Photo upload failed: ${error.message}`,
        });
      }
    });
  }
);

// Get user's plan limits and usage
exports.getUserPlanInfo = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { userId } = req.body.data || req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "User ID is required",
        });
        return;
      }

      try {
        const userPlan = await getUserPlan(userId);
        const planLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
        const userUsage = await getUserUsage(userId);

        // Calculate percentages and remaining amounts
        const calculateUsageInfo = (used, limit) => {
          if (limit === "unlimited" || limit === Number.MAX_SAFE_INTEGER) {
            return {
              used,
              limit: "unlimited",
              remaining: "unlimited",
              percentage: 0,
            };
          }

          const percentage = Math.min(100, Math.round((used / limit) * 100));
          const remaining = Math.max(0, limit - used);

          return {
            used,
            limit,
            remaining,
            percentage,
          };
        };

        const result = {
          plan: userPlan,
          limits: planLimits,
          usage: {
            events: calculateUsageInfo(userUsage.events, planLimits.events),
            photos: calculateUsageInfo(
              userUsage.photos,
              planLimits.photosPerEvent
            ),
            storage: {
              ...calculateUsageInfo(userUsage.storage, planLimits.storageBytes),
              usedFormatted: formatBytes(userUsage.storage),
              limitFormatted:
                planLimits.storageGB === "unlimited"
                  ? "unlimited"
                  : `${planLimits.storageGB}GB`,
            },
          },
          recommendations: [],
        };

        // Add upgrade recommendations
        if (result.usage.events.percentage > 80) {
          result.recommendations.push({
            type: "events",
            urgency: result.usage.events.percentage > 95 ? "high" : "medium",
            message: `You've used ${result.usage.events.percentage}% of your event limit`,
          });
        }

        if (result.usage.storage.percentage > 80) {
          result.recommendations.push({
            type: "storage",
            urgency: result.usage.storage.percentage > 95 ? "high" : "medium",
            message: `You've used ${result.usage.storage.percentage}% of your storage`,
          });
        }

        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error("Error getting user plan info:", error);
        res.status(500).json({
          success: false,
          message: `Failed to get plan info: ${error.message}`,
        });
      }
    });
  }
);

// Utility function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Enhanced event invitation with member limit validation
exports.sendEventInvitationWithValidation = onRequest(
  {
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { eventId, inviterUserId, inviteeUserId, inviteeEmail } =
        req.body.data || req.body;

      if (!eventId || !inviterUserId || (!inviteeUserId && !inviteeEmail)) {
        res.status(400).json({
          success: false,
          message:
            "Event ID, inviter user ID, and invitee identifier are required",
        });
        return;
      }

      try {
        // Get event data
        const eventDoc = await admin
          .firestore()
          .collection("events")
          .doc(eventId)
          .get();

        if (!eventDoc.exists) {
          res.status(404).json({
            success: false,
            message: "Event not found",
          });
          return;
        }

        const eventData = eventDoc.data();

        // Check if inviter is a member or admin
        if (!eventData.members || !eventData.members.includes(inviterUserId)) {
          res.status(403).json({
            success: false,
            message: "You must be a member to send invitations",
          });
          return;
        }

        // Get event creator's plan to check member limits
        const creatorPlan = await getUserPlan(eventData.createdBy);
        const planLimits = PLAN_LIMITS[creatorPlan] || PLAN_LIMITS.free;
        const currentMemberCount = eventData.members
          ? eventData.members.length
          : 0;

        // Check member limit
        if (planLimits.membersPerEvent !== "unlimited") {
          if (currentMemberCount >= planLimits.membersPerEvent) {
            res.status(403).json({
              success: false,
              message: `Member limit reached! The event creator's ${creatorPlan} plan allows ${planLimits.membersPerEvent} members per event.`,
              errorCode: "MEMBER_LIMIT_EXCEEDED",
              currentMembers: currentMemberCount,
              limit: planLimits.membersPerEvent,
              creatorPlan: creatorPlan,
            });
            return;
          }
        }

        // Create invitation
        const invitationRef = admin
          .firestore()
          .collection("eventInvitations")
          .doc();
        const invitationId = invitationRef.id;

        await invitationRef.set({
          id: invitationId,
          eventId: eventId,
          inviterUserId: inviterUserId,
          inviteeUserId: inviteeUserId || null,
          inviteeEmail: inviteeEmail || null,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        res.status(200).json({
          success: true,
          message: "Invitation sent successfully",
          invitationId: invitationId,
          remainingSlots:
            planLimits.membersPerEvent === "unlimited"
              ? "unlimited"
              : planLimits.membersPerEvent - currentMemberCount - 1,
        });
      } catch (error) {
        console.error("Error sending event invitation:", error);
        res.status(500).json({
          success: false,
          message: `Failed to send invitation: ${error.message}`,
        });
      }
    });
  }
);

// Set global options for all functions
setGlobalOptions({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 300,
});
