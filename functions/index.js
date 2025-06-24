const functions = require("firebase-functions");
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
});
const axios = require("axios");

admin.initializeApp();

// Configure your email transporter - FIXED: createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

exports.sendContactEmail = functions.https.onCall(async (data, context) => {
  // Log the incoming request for debugging
  console.log("sendContactEmail called with data:", data);
  console.log("Context:", context);

  const { name, email, subject, message, category } = data;

  // Read the HTML template
  let htmlTemplate;
  try {
    const templatePath = path.join(
      __dirname,
      "email-templates",
      "contactus.html"
    );
    htmlTemplate = fs.readFileSync(templatePath, "utf8");
  } catch (error) {
    console.error("Error reading email template:", error);
    // Fallback to inline template if file doesn't exist
    htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .field { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5; }
          .field-label { font-weight: bold; color: #4a5568; font-size: 14px; margin-bottom: 5px; }
          .field-value { color: #2d3748; font-size: 16px; }
          .message-box { background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
          .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 14px; }
          .alert { background: #ef4444; color: white; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-weight: 600; text-align: center; }
          .category-badge { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📸 New Contact Message - Groupify</h1>
          </div>
          
          <div class="content">
            <div class="alert">
              🚨 URGENT: New customer inquiry requires your attention
            </div>
            
            <div class="field">
              <div class="field-label">From</div>
              <div class="field-value">{{name}} &lt;{{email}}&gt;</div>
            </div>
            
            <div class="field">
              <div class="field-label">Category</div>
              <div class="field-value">
                <span class="category-badge">{{category}}</span>
              </div>
            </div>
            
            <div class="field">
              <div class="field-label">Subject</div>
              <div class="field-value">{{subject}}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Message</div>
              <div class="message-box">{{message}}</div>
            </div>
            
            <div style="background: #e6fffa; padding: 15px; border-radius: 8px; border: 1px solid #81e6d9;">
              <strong>⏰ Received:</strong> {{timestamp}}
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="mailto:{{email}}?subject=Re: {{subject}}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 10px;">📧 Reply via Email</a>
              <a href="https://wa.me/972532448624?text=Hi {{name}}, thanks for contacting Groupify!" style="background: #25d366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">💬 WhatsApp Reply</a>
            </div>
          </div>
          
          <div class="footer">
            <strong>Groupify Support System</strong><br>
            This message was automatically generated from the contact form.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Replace template variables
  const finalHtml = htmlTemplate
    .replace(/{{name}}/g, name)
    .replace(/{{email}}/g, email)
    .replace(/{{subject}}/g, subject)
    .replace(/{{message}}/g, message.replace(/\n/g, "<br>"))
    .replace(
      /{{category}}/g,
      category.charAt(0).toUpperCase() + category.slice(1)
    )
    .replace(/{{timestamp}}/g, new Date().toLocaleString())
    .replace(/{{whatsapp_number}}/g, "972532448624");

  try {
    await transporter.sendMail({
      from: functions.config().email.user,
      to: "groupify.ltd@gmail.com",
      subject: `🎫 New Contact Form: ${subject}`,
      html: finalHtml,
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
