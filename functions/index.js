const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

const cors = require("cors")({
  origin: [
    "http://localhost:5173",
    "https://groupify-77202.web.app",
    "https://groupify-77202.firebaseapp.com",
  ],
});
const axios = require("axios");

admin.initializeApp();

// Configure your email transporter
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: functions.config().email.user, // Set via: firebase functions:config:set email.user="your-email@gmail.com"
    pass: functions.config().email.pass, // Set via: firebase functions:config:set email.pass="your-app-password"
  },
});

exports.sendContactEmail = functions.https.onCall(async (data, context) => {
  const { name, email, subject, message, category } = data;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .ticket-id { background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin-top: 10px; display: inline-block; }
        .content { padding: 30px; }
        .field { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea; }
        .field-label { font-weight: bold; color: #4a5568; font-size: 14px; margin-bottom: 5px; }
        .field-value { color: #2d3748; font-size: 16px; }
        .message-box { background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 New Support Ticket</h1>
          <div class="ticket-id">Ticket #${Date.now()
            .toString()
            .slice(-6)}</div>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="field-label">👤 Customer Name</div>
            <div class="field-value">${name}</div>
          </div>
          
          <div class="field">
            <div class="field-label">📧 Email Address</div>
            <div class="field-value">${email}</div>
          </div>
          
          <div class="field">
            <div class="field-label">🏷️ Category</div>
            <div class="field-value">${
              category.charAt(0).toUpperCase() + category.slice(1)
            }</div>
          </div>
          
          <div class="field">
            <div class="field-label">📋 Subject</div>
            <div class="field-value">${subject}</div>
          </div>
          
          <div class="message-box">
            <div class="field-label">💬 Message</div>
            <div class="field-value">${message.replace(/\n/g, "<br>")}</div>
          </div>
          
          <div style="background: #e6fffa; padding: 15px; border-radius: 8px; border: 1px solid #81e6d9;">
            <strong>⏰ Received:</strong> ${new Date().toLocaleString()}
          </div>
        </div>
        
        <div class="footer">
          <strong>Groupify Support System</strong><br>
          This ticket was automatically generated from the contact form.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: functions.config().email.user,
      to: "groupify.ltd@gmail.com",
      subject: `🎫 New Contact Form: ${subject}`,
      html: htmlTemplate,
      replyTo: email,
    });

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Email error:", error);
    throw new functions.https.HttpsError("internal", "Failed to send email");
  }
});

// Verify reCAPTCHA token
exports.verifyCaptcha = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA token is required",
      });
    }

    try {
      const secretKey = functions.config().recaptcha?.secret_key;
      if (!secretKey) {
        console.error("RECAPTCHA_SECRET_KEY environment variable not set");
        return res.status(500).json({
          success: false,
          message: "Server configuration error",
        });
      }

      // Verify with Google reCAPTCHA
      const response = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
          params: {
            secret: secretKey,
            response: token,
            remoteip: req.ip,
          },
        }
      );

      const { success, score, action } = response.data;

      // For reCAPTCHA v2: just check success
      // For reCAPTCHA v3: check success and score (0.0 to 1.0)
      const isValid = success && (score === undefined || score > 0.5);

      if (isValid) {
        // Log successful verification (optional)
        console.log("CAPTCHA verified successfully", {
          ip: req.ip,
          timestamp: new Date().toISOString(),
          score: score || "N/A",
        });

        return res.json({
          success: true,
          message: "CAPTCHA verified successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "CAPTCHA verification failed",
          score: score || null,
        });
      }
    } catch (error) {
      console.error("CAPTCHA verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during CAPTCHA verification",
      });
    }
  });
});
